import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import slugify from 'slugify';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { validatePassword } from '../../common/utils/password-validator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private systemSettingsService: SystemSettingsService,
  ) {}

  /**
   * Register a new tenant with email verification
   */
  async registerTenant(data: RegisterTenantDto) {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.ownerEmail },
      });

      if (existingUser) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      const slug = slugify(data.name.trim(), { lower: true, strict: true });

      // Check if slug already exists
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { slug },
      });

      if (existingTenant) {
        throw new ConflictException(
          `A business with the name "${data.name}" already exists. Please choose a different name.`,
        );
      }

      // Generate random password for owner
      const tempPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      // Generate email verification token
      const verificationToken = this.generateVerificationToken(data.ownerEmail);

      // Create tenant, owner, and main branch in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Create tenant with PENDING status
        const tenant = await tx.tenant.create({
          data: {
            name: data.name.trim(),
            slug,
            category: data.category,
            status: 'PENDING', // Will be activated after email verification
            adminEmailRecipients: [data.ownerEmail.trim().toLowerCase()], // Default to owner's email
          },
        });

        // 2. Create owner user
        const owner = await tx.user.create({
          data: {
            tenantId: tenant.id,
            firstName: data.ownerFirstName.trim(),
            lastName: data.ownerLastName.trim(),
            email: data.ownerEmail.trim().toLowerCase(),
            phoneNumber: data.ownerPhoneNumber?.trim() || null,
            password: hashedPassword,
            role: 'OWNER',
            emailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        });

        // 3. Create main branch
        const branch = await tx.branch.create({
          data: {
            tenantId: tenant.id,
            name: 'Main Branch',
            address: null,
            phoneNumber: null,
            email: data.ownerEmail.trim().toLowerCase(),
            isActive: true,
            isMainBranch: true,
          },
        });

        // 4. Assign owner to main branch
        await tx.gymUserBranch.create({
          data: {
            userId: owner.id,
            branchId: branch.id,
            tenantId: tenant.id,
            accessLevel: 'FULL_ACCESS',
            isPrimary: true,
          },
        });

        return { tenant, owner, branch };
      });

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail(
          data.ownerEmail,
          verificationToken,
          `${data.ownerFirstName} ${data.ownerLastName}`,
          data.name,
        );
      } catch (emailError) {
        this.logger.error(
          `Failed to send verification email: ${emailError.message}`,
          emailError.stack,
        );
        // Don't fail the registration if email fails
      }

       this.logger.log(`New tenant registered: ${result.tenant.name} (${result.tenant.id})`);

       // Send global admin notification for new tenant registration
       try {
         await this.emailService.sendGlobalAdminAlert(
           'New Tenant Registration',
           `A new tenant "${result.tenant.name}" has registered. Owner: ${data.ownerEmail}`,
           'new_tenant'
         );
       } catch (alertError) {
         this.logger.error(
           `Failed to send global admin alert: ${alertError.message}`,
           alertError.stack,
         );
         // Don't fail registration if admin alert fails
       }

       return {
        success: true,
        message:
          'Registration successful! Please check your email to verify your account.',
        data: {
          tenantId: result.tenant.id,
          tenantName: result.tenant.name,
          ownerEmail: data.ownerEmail,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw new BadRequestException('Registration failed. Please try again.');
    }
  }

  /**
   * Verify email and activate account
   */
  async verifyEmail(token: string) {
    try {
      // Decode and verify JWT token
      const secret = process.env.JWT_SECRET || 'default-secret-change-me';
      const decoded = jwt.verify(token, secret) as {
        email: string;
        type: string;
      };

      if (decoded.type !== 'email_verification') {
        throw new BadRequestException('Invalid verification token');
      }

      // Find user by email and token
      const user = await this.prisma.user.findFirst({
        where: {
          email: decoded.email,
          emailVerificationToken: token,
        },
        include: {
          tenant: true,
        },
      });

      if (!user) {
        throw new BadRequestException(
          'Invalid or expired verification token',
        );
      }

      // Check if already verified
      if (user.emailVerified) {
        // Generate login token anyway
        const loginToken = this.generateLoginToken(user);
        return {
          success: true,
          message: 'Email already verified. You can now login.',
          alreadyVerified: true,
          data: {
            token: loginToken,
            user: this.formatUserResponse(user),
          },
        };
      }

      // Check if token expired
      if (
        user.emailVerificationExpiry &&
        user.emailVerificationExpiry < new Date()
      ) {
        throw new BadRequestException(
          'Verification token has expired. Please request a new one.',
        );
      }

      // Update user and tenant in transaction
      await this.prisma.$transaction(async (tx) => {
        // Mark email as verified (keep token for password setup)
        await tx.user.update({
          where: { id: user.id },
          data: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
            // Don't clear token yet - needed for password setup
            emailVerificationExpiry: null,
          },
        });

        // Activate tenant
        if (user.tenantId) {
          await tx.tenant.update({
            where: { id: user.tenantId },
            data: {
              status: 'ACTIVE',
            },
          });
        }
      });

      this.logger.log(`Email verified for user: ${user.email}`);

      // Generate login token
      const loginToken = this.generateLoginToken(user);

      return {
        success: true,
        message: 'Email verified successfully! You can now login.',
        requiresPasswordSetup: !user.initialPasswordSet,
        verificationToken: token, // Keep token for password setup
        data: {
          token: loginToken,
          user: this.formatUserResponse(user),
        },
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'Verification token has expired. Please request a new one.',
        );
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid verification token');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Email verification failed: ${error.message}`, error.stack);
      throw new BadRequestException('Email verification failed');
    }
  }

  /**
   * Set initial password after email verification
   */
  async setInitialPassword(token: string, newPassword: string) {
    try {
      // Decode and verify JWT token
      const secret = process.env.JWT_SECRET || 'default-secret-change-me';
      const decoded = jwt.verify(token, secret) as {
        email: string;
        type: string;
      };

      if (decoded.type !== 'email_verification') {
        throw new BadRequestException('Invalid token');
      }

      // Find user by email and token
      const user = await this.prisma.user.findFirst({
        where: {
          email: decoded.email,
          emailVerificationToken: token,
        },
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired token');
      }

      if (!user.emailVerified) {
        throw new BadRequestException(
          'Please verify your email before setting a password',
        );
      }

      if (user.initialPasswordSet) {
        throw new BadRequestException(
          'Password already set. Use change password instead.',
        );
      }

      // Validate password against system security level
      const securityLevel =
        await this.systemSettingsService.getPasswordSecurityLevel();
      const validation = validatePassword(newPassword, securityLevel);

      if (!validation.valid) {
        throw new BadRequestException(
          `Password does not meet security requirements: ${validation.errors.join(', ')}`,
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user with new password
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          initialPasswordSet: true,
          emailVerificationToken: null, // Clear token after use
        },
      });

      this.logger.log(`Initial password set for user: ${user.email}`);

      return {
        success: true,
        message: 'Password set successfully! You can now login.',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid token');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Set initial password failed: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to set password');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new BadRequestException('No account found with this email');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken(email);

    // Update user with new token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      email,
      verificationToken,
      `${user.firstName} ${user.lastName}`,
      user.tenant?.name || 'Your Business',
    );

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  // Helper methods
  private generateTemporaryPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private generateVerificationToken(email: string): string {
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';
    return jwt.sign(
      {
        email,
        type: 'email_verification',
      },
      secret,
      { expiresIn: '24h' },
    );
  }

  private generateLoginToken(user: any): string {
    return Buffer.from(
      JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        timestamp: Date.now(),
      }),
    ).toString('base64');
  }

  private formatUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant,
    };
  }
}
