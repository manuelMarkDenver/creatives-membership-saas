import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Req,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthEventsService } from './auth-events.service';
import { AuthGuard } from './auth.guard';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { SetInitialPasswordDto } from './dto/set-initial-password.dto';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { validatePassword } from '../../common/utils/password-validator';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

// Simple in-memory rate limiter for OAuth endpoints
const oauthRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes (reduced for testing)
const RATE_LIMIT_MAX = 20; // 20 attempts per window (increased for testing)

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = oauthRateLimit.get(identifier);

  if (!record || now > record.resetTime) {
    // First attempt or window expired
    oauthRateLimit.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}

class CreateGoogleUserDto {
  @IsString()
  @IsNotEmpty()
  googleId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;
}

class SetGooglePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly authEventsService: AuthEventsService,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  /**
   * Email/Password login
   * POST /auth/login
   */
  @Post('login')
  async loginWithPassword(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          tenant: true,
        },
      });

      if (!user || !user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is deleted
      if (user.deletedAt) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Check if email is verified (skip for SUPER_ADMIN)
      if (!user.emailVerified && user.role !== 'SUPER_ADMIN') {
        throw new UnauthorizedException(
          'Please verify your email before logging in. Check your inbox for the verification link.',
        );
      }

      // Generate a simple token (in production, use proper JWT)
      const token = Buffer.from(
        JSON.stringify({
          userId: user.id,
          email: user.email,
          role: user.role, // Use role field
          tenantId: user.tenantId,
          timestamp: Date.now(),
        }),
      ).toString('base64');

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role, // Platform role
            tenantId: user.tenantId,
            tenant: user.tenant,
          },
          token,
        },
        message: 'Login successful',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Login error:', error);
      throw new InternalServerErrorException('Login failed');
    }
  }

  /**
   * Initiate Google OAuth login
   * GET /auth/google
   */
  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  googleAuth(@Req() req: Request) {
    // Basic rate limiting for OAuth attempts (disabled for testing)
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    // Temporarily disabled for testing
    // if (!checkRateLimit(`oauth_${clientIP}`)) {
    //   throw new BadRequestException(
    //     'Too many OAuth attempts. Please try again later.',
    //   );
    // }

    // Passport handles the redirect to Google
  }

  /**
   * Handle Google OAuth callback
   * GET /auth/google/callback
   */
  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    // Rate limiting for callback attempts (disabled for testing)
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    // Temporarily disabled for testing
    // if (!checkRateLimit(`oauth_callback_${clientIP}`)) {
    //   return res.redirect(
    //     `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('Too many authentication attempts. Please try again later.')}`,
    //   );
    // }
    try {
      // Passport attaches the user to the request
      const googleUser = req.user as any;

      if (!googleUser) {
        throw new Error('No user data from Google OAuth');
      }

      // Handle Google login through auth service
      const result = await this.authService.handleGoogleLogin(googleUser);

      if ('requiresOnboarding' in result && result.requiresOnboarding) {
        // New tenant created from Google OAuth - redirect to success with onboarding flag
        const params = new URLSearchParams({
          token: result.data.token,
          user_id: result.data.user.id,
          email: result.data.user.email,
          requires_onboarding: 'true',
        });
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/success?${params.toString()}`,
        );
      }

      if (!result.success || !result.data) {
        throw new Error('Google login failed');
      }

      // Successful login - redirect to dashboard with token
      const params = new URLSearchParams({
        token: result.data.token,
        user_id: result.data.user.id,
        email: result.data.user.email,
      });

      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/success?${params.toString()}`,
      );
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Google authentication failed';
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  @Get('refresh')
  async refresh(@Query('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const session = await this.supabaseService.refreshSession(refreshToken);

      return {
        success: true,
        data: {
          access_token: session.session?.access_token,
          refresh_token: session.session?.refresh_token,
          expires_at: session.session?.expires_at,
          user: session.user,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Token refresh failed: ${error.message}`,
      );
    }
  }

  /**
   * Sign out user
   * POST /auth/logout
   */
  @Get('logout')
  async logout(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Access token is required');
    }

    try {
      await this.supabaseService.signOut(token);

      return {
        success: true,
        message: 'Successfully signed out',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Sign out failed: ${error.message}`,
      );
    }
  }

  /**
   * Get current user info
   * GET /auth/me (requires Authorization header or x-bypass-auth header)
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() request: Request) {
    // The AuthGuard has already authenticated the user and attached it to the request
    const authenticatedUser = (request as any).user;

    if (!authenticatedUser) {
      throw new BadRequestException('User not authenticated');
    }

    // Get the full user data from database
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.id },
      include: { tenant: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Handle tenant logic for Super Admin
    let effectiveTenantId = user.tenantId;
    let effectiveTenant = user.tenant;

    if (user.role === 'SUPER_ADMIN') {
      // Super Admins should always have null tenantId for global access
      effectiveTenantId = null;
      effectiveTenant = null;
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name:
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role, // Return platform role
        authProvider: user.authProvider, // Include auth provider for onboarding logic
        tenantId: effectiveTenantId,
        tenant: effectiveTenant,
        created_at: user.createdAt,
        // Include verification token if user hasn't set initial password (for onboarding)
        emailVerificationToken: !user.initialPasswordSet
          ? user.emailVerificationToken
          : undefined,
      },
    };
  }

  /**
   * Change user password
   * POST /auth/change-password
   */
  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Req() request: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const authenticatedUser = (request as any).user;
    const { currentPassword, newPassword } = changePasswordDto;

    if (!authenticatedUser) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      // Get the user with password field
      const user = await this.prisma.user.findUnique({
        where: { id: authenticatedUser.id },
      });

      if (!user || !user.password) {
        throw new UnauthorizedException('User not found or invalid account');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Validate new password against system security level
      const securityLevel =
        await this.systemSettingsService.getPasswordSecurityLevel();
      const validation = validatePassword(newPassword, securityLevel);

      if (!validation.valid) {
        throw new BadRequestException(
          `Password does not meet security requirements: ${validation.errors.join(', ')}`,
        );
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Password change error:', error);
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  /**
   * Public tenant registration
   * POST /auth/register-tenant
   */
  @Post('register-tenant')
  async registerTenant(@Body() registerDto: RegisterTenantDto) {
    return this.authService.registerTenant(registerDto);
  }

  /**
   * Verify email with token
   * GET /auth/verify-email/:token
   */
  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * Set initial password after email verification
   * POST /auth/set-initial-password
   */
  @Post('set-initial-password')
  async setInitialPassword(@Body() dto: SetInitialPasswordDto) {
    return this.authService.setInitialPassword(dto.token, dto.password);
  }

  /**
   * Set initial password for Google OAuth users
   * POST /auth/set-google-password
   */
  @Post('set-google-password')
  @UseGuards(AuthGuard)
  async setGoogleUserPassword(
    @Req() request: Request,
    @Body() dto: SetGooglePasswordDto,
  ) {
    const authenticatedUser = (request as any).user;
    if (!authenticatedUser) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.authService.setGoogleUserPassword(
      authenticatedUser.id,
      dto.password,
    );
  }

  /**
   * Resend verification email
   * POST /auth/resend-verification
   */
  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.resendVerificationEmail(body.email);
  }

  /**
   * Log authentication events
   * POST /auth/events
   */
  @Post('events')
  async logAuthEvent(@Req() req: Request, @Body() body: {
    type: string;
    userId?: string;
    tenantId?: string;
    userAgent?: string;
    reason?: string;
    meta?: any;
  }) {
    // Get real client IP from request headers
    const clientIP = req.ip ||
                     req.connection.remoteAddress ||
                     (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                     (req.headers['x-real-ip'] as string) ||
                     'unknown';

    console.log('Auth event received:', body, 'IP:', clientIP);
    try {
      await this.authEventsService.logAuthEvent({
        type: body.type,
        userId: body.userId,
        tenantId: body.tenantId,
        ipAddress: clientIP,
        userAgent: body.userAgent,
        reason: body.reason,
        meta: body.meta,
      });

      console.log('Auth event logged successfully:', body.type);
      return { success: true };
    } catch (error) {
      console.error('Failed to log auth event:', error);
      // Don't fail the request if logging fails
      return { success: false, error: 'Failed to log event' };
    }
  }
}
