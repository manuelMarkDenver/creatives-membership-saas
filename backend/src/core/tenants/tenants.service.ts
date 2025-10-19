import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { BusinessCategory, Role, AccessLevel } from '@prisma/client';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async createTenant(data: CreateTenantDto) {
    // Use a transaction to ensure all operations succeed or fail together
    return this.prisma.$transaction(async (tx) => {
      try {
        // Validate required fields
        if (!data.name?.trim()) {
          throw new BadRequestException(
            'Tenant name is required and cannot be empty',
          );
        }

        if (!Object.values(BusinessCategory).includes(data.category)) {
          throw new BadRequestException(
            `Invalid business category. Must be one of: ${Object.values(BusinessCategory).join(', ')}`,
          );
        }

        const slug = slugify(data.name.trim(), { lower: true, strict: true });

        // Check if slug already exists
        const existingTenant = await tx.tenant.findUnique({
          where: { slug },
        });

        if (existingTenant) {
          throw new ConflictException(
            `A tenant with the name "${data.name}" already exists. Please choose a different name.`,
          );
        }

        // Check if owner email already exists
        const existingUser = await tx.user.findUnique({
          where: { email: data.ownerEmail },
        });

        if (existingUser) {
          throw new ConflictException(
            `A user with email "${data.ownerEmail}" already exists.`,
          );
        }

        // 1. Create the tenant
        const tenant = await tx.tenant.create({
          data: {
            name: data.name.trim(),
            slug,
            category: data.category,
            logoUrl: data.logoUrl,
            address: data.address,
            phoneNumber: data.phoneNumber,
            email: data.email,
            websiteUrl: data.websiteUrl,
            description: data.description,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            freeBranchOverride: data.freeBranchOverride || 0,
          },
        });

        // 2. Generate temporary password for owner
        const tempPassword = this.generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // 3. Create the owner user
        const owner = await tx.user.create({
          data: {
            tenantId: tenant.id,
            firstName: data.ownerFirstName,
            lastName: data.ownerLastName,
            email: data.ownerEmail,
            phoneNumber: data.ownerPhoneNumber,
            password: hashedPassword,
            role: Role.OWNER,
          },
        });

        // 4. Create the first trial branch (Main Branch)
        const branch = await tx.branch.create({
          data: {
            tenantId: tenant.id,
            name: 'Main Branch',
            address: tenant.address,
            phoneNumber: tenant.phoneNumber,
            email: tenant.email,
            isActive: true,
          },
        });

        // 5. Assign the owner to the branch with full access
        await tx.gymUserBranch.create({
          data: {
            userId: owner.id,
            branchId: branch.id,
            tenantId: tenant.id,
            accessLevel: AccessLevel.FULL_ACCESS,
            isPrimary: true,
          },
        });

        // 6. Create a trial subscription for the branch
        // Get the trial plan
        const trialPlan = await tx.plan.findUnique({
          where: { name: 'Free Trial' },
        });

        if (!trialPlan) {
          throw new NotFoundException(
            'Free Trial plan not found. Please run database seeding.',
          );
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 28); // 4 weeks trial

        await tx.subscription.create({
          data: {
            branchId: branch.id,
            planId: trialPlan.id,
            startDate,
            endDate,
            status: 'ACTIVE',
          },
        });

        this.logger.log(
          `Created complete tenant setup: ${tenant.name} (${tenant.id}) with owner ${owner.email} and trial branch`,
        );
        this.logger.log(
          `Temporary password for ${owner.email}: ${tempPassword}`,
        );

        // Return tenant with all created relationships plus temporary password
        const result = await tx.tenant.findUnique({
          where: { id: tenant.id },
          include: {
            users: {
              where: { role: Role.OWNER },
            },
            branches: {
              include: {
                subscriptions: {
                  include: {
                    plan: true,
                  },
                },
              },
            },
          },
        });

        // Add temporary password to response for super admin
        return {
          ...result,
          tempPassword,
        };
      } catch (error) {
        if (
          error instanceof BadRequestException ||
          error instanceof ConflictException ||
          error instanceof NotFoundException
        ) {
          throw error;
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            const field = error.meta?.target as string[];
            throw new ConflictException(
              `A ${field?.[0] === 'email' ? 'user with this email' : 'tenant with this information'} already exists.`,
            );
          }
        }

        this.logger.error(
          `Failed to create tenant: ${(error as Error).message}`,
          (error as Error).stack,
        );
        throw new InternalServerErrorException(
          'Failed to create tenant. Please try again.',
        );
      }
    });
  }

  async listTenants(category?: BusinessCategory) {
    try {
      // Validate category if provided
      if (category && !Object.values(BusinessCategory).includes(category)) {
        throw new BadRequestException(
          `Invalid business category. Must be one of: ${Object.values(BusinessCategory).join(', ')}`,
        );
      }

      const tenants = await this.prisma.tenant.findMany({
        where: category ? { category } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          branches: {
            include: {
              subscriptions: {
                where: {
                  status: { in: ['ACTIVE', 'EXPIRED'] },
                },
                include: {
                  plan: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 1, // Get latest subscription per branch
              },
              _count: {
                select: {
                  gymUserBranches: {
                    where: {
                      user: {
                        role: 'STAFF',
                      },
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              users: {
                where: {
                  role: 'STAFF',
                },
              },
              branches: true,
            },
          },
        },
      });

      this.logger.log(
        `Retrieved ${tenants.length} tenants${category ? ` with category ${category}` : ''}`,
      );
      return tenants;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to list tenants: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve tenants. Please try again.',
      );
    }
  }

  async getTenant(id: string) {
    try {
      // Validate UUID format
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with ID '${id}' not found`);
      }

      return tenant;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get tenant ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve tenant. Please try again.',
      );
    }
  }

  async updateTenant(id: string, data: UpdateTenantDto) {
    try {
      // Validate UUID format
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      // Check if tenant exists first
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { id },
      });
      if (!existingTenant) {
        throw new NotFoundException(`Tenant with ID '${id}' not found`);
      }

      // Validate business category if provided
      if (
        data.category &&
        !Object.values(BusinessCategory).includes(data.category)
      ) {
        throw new BadRequestException(
          `Invalid business category. Must be one of: ${Object.values(BusinessCategory).join(', ')}`,
        );
      }

      const updateData: UpdateTenantDto = { ...data };

      // Only regenerate slug if a new name is provided
      if (data.name?.trim()) {
        const newSlug = slugify(data.name.trim(), {
          lower: true,
          strict: true,
        });

        // Check if another tenant already uses this slug
        const existing = await this.prisma.tenant.findFirst({
          where: { slug: newSlug, NOT: { id } },
        });

        if (existing) {
          throw new ConflictException(
            `Another tenant with the name "${data.name}" already exists. Please choose a different name.`,
          );
        }

        updateData.name = data.name.trim();
        updateData.slug = newSlug;
      }

      const updatedTenant = await this.prisma.tenant.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(
        `Updated tenant: ${updatedTenant.name} (${updatedTenant.id})`,
      );
      return updatedTenant;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = error.meta?.target as string[];
          throw new ConflictException(
            `A tenant with this ${field?.[0] || 'information'} already exists.`,
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(`Tenant with ID '${id}' not found`);
        }
      }

      this.logger.error(
        `Failed to update tenant ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to update tenant. Please try again.',
      );
    }
  }

  async deleteTenant(id: string) {
    try {
      // Validate UUID format
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      // Check if tenant exists and get user count
      const tenant = await this.prisma.tenant.findUnique({
        where: { id },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with ID '${id}' not found`);
      }

      // Warn if tenant has users (they will be deleted due to cascade)
      if (tenant._count.users > 0) {
        this.logger.warn(
          `Deleting tenant ${tenant.name} (${id}) will also delete ${tenant._count.users} associated users`,
        );
      }

      const deletedTenant = await this.prisma.tenant.delete({
        where: { id },
      });

      this.logger.log(
        `Deleted tenant: ${deletedTenant.name} (${deletedTenant.id})`,
      );
      return deletedTenant;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Tenant with ID '${id}' not found`);
        }
      }

      this.logger.error(
        `Failed to delete tenant ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to delete tenant. Please try again.',
      );
    }
  }

  /**
   * Update tenant owner details
   */
  async updateTenantOwner(
    tenantId: string,
    ownerData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
    },
  ) {
    try {
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      // Check if tenant exists
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          users: {
            where: { role: Role.OWNER },
          },
        },
      });

      if (!existingTenant) {
        throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
      }

      // Find the owner user
      const owner = existingTenant.users.find((user) => user.role === Role.OWNER);
      if (!owner) {
        throw new NotFoundException(`Owner not found for tenant '${tenantId}'`);
      }

      // Check if new email already exists (if email is being changed)
      if (ownerData.email && ownerData.email !== owner.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: ownerData.email },
        });
        if (existingUser) {
          throw new ConflictException(
            `A user with email "${ownerData.email}" already exists.`,
          );
        }
      }

      // Update owner details
      const updatedOwner = await this.prisma.user.update({
        where: { id: owner.id },
        data: {
          ...(ownerData.firstName && { firstName: ownerData.firstName.trim() }),
          ...(ownerData.lastName && { lastName: ownerData.lastName.trim() }),
          ...(ownerData.email && { email: ownerData.email.trim() }),
          ...(ownerData.phoneNumber && { phoneNumber: ownerData.phoneNumber.trim() }),
        },
      });

      this.logger.log(
        `Updated owner details for tenant ${existingTenant.name}: ${updatedOwner.email}`,
      );
      return updatedOwner;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to update tenant owner: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to update tenant owner. Please try again.',
      );
    }
  }

  /**
   * Generate new password for tenant owner
   */
  async resetTenantOwnerPassword(tenantId: string) {
    try {
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      // Check if tenant exists and get owner
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          users: {
            where: { role: Role.OWNER },
          },
        },
      });

      if (!existingTenant) {
        throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
      }

      const owner = existingTenant.users.find((user) => user.role === Role.OWNER);
      if (!owner) {
        throw new NotFoundException(`Owner not found for tenant '${tenantId}'`);
      }

      // Generate new temporary password
      const tempPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      // Update owner's password
      await this.prisma.user.update({
        where: { id: owner.id },
        data: { password: hashedPassword },
      });

      this.logger.log(
        `Reset password for tenant owner: ${owner.email} (Tenant: ${existingTenant.name})`,
      );
      this.logger.log(
        `New temporary password for ${owner.email}: ${tempPassword}`,
      );

      return {
        ownerEmail: owner.email,
        tempPassword,
        tenantName: existingTenant.name,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to reset tenant owner password: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to reset owner password. Please try again.',
      );
    }
  }

  /**
   * Get tenant owner details
   */
  async getTenantOwner(tenantId: string) {
    try {
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          users: {
            where: { role: Role.OWNER },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              role: true,
              createdAt: true,
              // Don't include password for security
            },
          },
        },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
      }

      const owner = tenant.users.find((user) => user.role === Role.OWNER);
      if (!owner) {
        throw new NotFoundException(`Owner not found for tenant '${tenantId}'`);
      }

      return owner;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get tenant owner: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve owner details. Please try again.',
      );
    }
  }

  /**
   * Super admin method to update tenant's free branch override
   */
  async updateFreeBranchOverride(tenantId: string, override: number) {
    try {
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      if (override < 0) {
        throw new BadRequestException(
          'Free branch override cannot be negative',
        );
      }

      const existingTenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!existingTenant) {
        throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
      }

      const updatedTenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { freeBranchOverride: override },
      });

      this.logger.log(
        `Updated free branch override for tenant ${updatedTenant.name} to ${override}`,
      );
      return updatedTenant;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to update free branch override: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to update free branch override. Please try again.',
      );
    }
  }

  /**
   * Get system-wide statistics for Super Admin dashboard
   */
  async getSystemStats() {
    try {
      // Get total counts using Prisma's count aggregation
      const [
        totalTenants,
        totalBranches,
        totalUsers,
        activeTenants,
        totalActiveSubscriptions,
        totalSubscriptions,
        totalRevenue,
      ] = await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.branch.count(),
        this.prisma.user.count(),
        this.prisma.tenant.count({
          where: {
            // Assuming tenants are active if they have at least one active branch
            branches: {
              some: {
                isActive: true,
              },
            },
          },
        }),
        this.prisma.subscription.count({
          where: { status: 'ACTIVE' },
        }),
        this.prisma.subscription.count(),
        this.prisma.payment.aggregate({
          where: { status: 'SUCCESSFUL' },
          _sum: { amount: true },
        }),
      ]);

      // Get tenant breakdown by category
      const tenantsByCategory = await this.prisma.tenant.groupBy({
        by: ['category'],
        _count: {
          id: true,
        },
      });

      // Get recent tenant activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTenants = await this.prisma.tenant.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      const stats = {
        overview: {
          totalTenants,
          totalBranches,
          totalUsers,
          activeTenants,
          recentTenants, // Added in last 30 days
          totalActiveSubscriptions,
          totalSubscriptions,
          totalRevenue: totalRevenue._sum.amount || 0,
        },
        tenantsByCategory: tenantsByCategory.reduce(
          (acc, item) => {
            acc[item.category] = item._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        systemHealth: {
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      };

      this.logger.log('Retrieved system statistics for Super Admin');
      return stats;
    } catch (error) {
      this.logger.error(
        `Failed to get system stats: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve system statistics. Please try again.',
      );
    }
  }

  /**
   * Mark tenant onboarding as completed
   */
  async markOnboardingComplete(tenantId: string) {
    try {
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      const updatedTenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { 
          onboardingCompletedAt: new Date(),
          updatedAt: new Date()
        },
      });

      this.logger.log(
        `Marked onboarding complete for tenant: ${updatedTenant.name} (${updatedTenant.id})`,
      );
      return updatedTenant;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to mark onboarding complete: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to update onboarding status. Please try again.',
      );
    }
  }

  /**
   * Mark owner password as changed (used when owner updates from temp password)
   */
  async markOwnerPasswordChanged(tenantId: string) {
    try {
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      const updatedTenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { 
          ownerPasswordChanged: true,
          updatedAt: new Date()
        },
      });

      this.logger.log(
        `Marked owner password changed for tenant: ${updatedTenant.name} (${updatedTenant.id})`,
      );
      return updatedTenant;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to mark owner password changed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to update password status. Please try again.',
      );
    }
  }

  /**
   * Check if tenant needs onboarding
   */
  async getTenantOnboardingStatus(tenantId: string) {
    try {
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          onboardingCompletedAt: true,
          ownerPasswordChanged: true,
          // Check if tenant has membership plans
          gymMembershipPlans: {
            where: { deletedAt: null },
            take: 1,
            select: { id: true }
          },
          // Check if tenant has members
          users: {
            where: { role: 'CLIENT', deletedAt: null },
            take: 1,
            select: { id: true }
          }
        },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
      }

      const hasMembers = tenant.users.length > 0;
      const hasMembershipPlans = tenant.gymMembershipPlans.length > 0;
      const isOnboardingComplete = !!tenant.onboardingCompletedAt;
      const hasChangedPassword = tenant.ownerPasswordChanged;

      return {
        tenantId,
        tenantName: tenant.name,
        isOnboardingComplete,
        hasChangedPassword,
        hasMembershipPlans,
        hasMembers,
        onboardingCompletedAt: tenant.onboardingCompletedAt,
        // Suggest next steps if not complete
        nextSteps: !isOnboardingComplete ? [
          !hasChangedPassword ? 'Change temporary password' : null,
          !hasMembershipPlans ? 'Create membership plans' : null,
          !hasMembers ? 'Add first members' : null
        ].filter(Boolean) : []
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get tenant onboarding status: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve onboarding status. Please try again.',
      );
    }
  }

  /**
   * Generate a temporary password for new tenant owners
   */
  private generateTemporaryPassword(): string {
    // Generate a secure 12-character password with mixed case, numbers, and symbols
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    // Ensure at least one character from each category
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining positions with random characters from all categories
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to randomize positions
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Helper method to validate UUID format
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
