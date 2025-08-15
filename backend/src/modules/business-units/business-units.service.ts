import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BusinessUnitType, SaasSubscriptionStatus } from '@prisma/client';

export interface CreateBusinessUnitDto {
  tenantId: string;
  name: string;
  unitType?: BusinessUnitType;
  address?: string;
  phoneNumber?: string;
  email?: string;
  subscriptionTier?: string;
  monthlyPrice?: number;
}

export interface UpdateBusinessUnitDto {
  name?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
  subscriptionTier?: string;
  monthlyPrice?: number;
}

@Injectable()
export class BusinessUnitsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new business unit with automatic trial setup
   */
  async createBusinessUnit(createDto: CreateBusinessUnitDto) {
    // Get tenant to check paid mode and limits
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: createDto.tenantId },
      include: {
        businessUnits: true
      }
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if tenant can create more business units
    const canCreate = await this.canCreateBusinessUnit(createDto.tenantId);
    if (!canCreate.allowed) {
      throw new BadRequestException(canCreate.reason);
    }

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + tenant.trialDurationDays);

    // Create business unit
    const businessUnit = await this.prisma.businessUnit.create({
      data: {
        tenantId: createDto.tenantId,
        name: createDto.name,
        unitType: createDto.unitType || BusinessUnitType.LOCATION,
        address: createDto.address,
        phoneNumber: createDto.phoneNumber,
        email: createDto.email,
        isPaid: false, // Always start as free/trial
        trialEndsAt,
        subscriptionTier: createDto.subscriptionTier || 'basic',
        monthlyPrice: createDto.monthlyPrice || 3999,
      }
    });

    // Create initial SaaS subscription (trial)
    const saasSubscription = await this.prisma.saasSubscription.create({
      data: {
        businessUnitId: businessUnit.id,
        planName: createDto.subscriptionTier || 'basic',
        status: SaasSubscriptionStatus.TRIAL,
        startDate: new Date(),
        trialEndsAt,
        monthlyPrice: createDto.monthlyPrice || 3999,
        currency: 'PHP',
        autoRenew: true,
      }
    });

    return {
      businessUnit,
      saasSubscription,
      message: `Business unit created with ${tenant.trialDurationDays}-day trial period`
    };
  }

  /**
   * Check if tenant can create more business units
   */
  async canCreateBusinessUnit(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        businessUnits: {
          where: { isActive: true }
        }
      }
    });

    if (!tenant) {
      return { allowed: false, reason: 'Tenant not found' };
    }

    const activeUnitsCount = tenant.businessUnits.length;
    const freeUnitsAllowed = tenant.freeUnitsLimit + tenant.freeBranchOverride;

    // If paid mode is disabled, allow unlimited units
    if (!tenant.paidModeEnabled) {
      return { allowed: true, reason: 'Paid mode disabled - unlimited units allowed' };
    }

    // Check if under free limit
    if (activeUnitsCount < freeUnitsAllowed) {
      return { 
        allowed: true, 
        reason: `Free unit available (${activeUnitsCount}/${freeUnitsAllowed} used)` 
      };
    }

    // Must create paid unit
    return { 
      allowed: true, 
      reason: 'Paid unit required',
      requiresPayment: true
    };
  }

  /**
   * Toggle paid mode for tenant (admin function)
   */
  async togglePaidMode(tenantId: string, enabled: boolean, adminId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        paidModeEnabled: enabled,
        updatedAt: new Date()
      }
    });

    // Log the change for audit purposes
    console.log(`Paid mode ${enabled ? 'enabled' : 'disabled'} for tenant ${tenant.name} by admin ${adminId}`);

    return {
      tenant: updatedTenant,
      message: `Paid mode ${enabled ? 'enabled' : 'disabled'} successfully`
    };
  }

  /**
   * Get all business units for tenant
   */
  async getBusinessUnits(tenantId: string) {
    return this.prisma.businessUnit.findMany({
      where: { tenantId },
      include: {
        saasSubscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Get most recent subscription
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get business unit by ID
   */
  async getBusinessUnit(unitId: string, tenantId: string) {
    const unit = await this.prisma.businessUnit.findFirst({
      where: { 
        id: unitId,
        tenantId 
      },
      include: {
        saasSubscriptions: {
          orderBy: { createdAt: 'desc' }
        },
        tenant: {
          select: {
            name: true,
            paidModeEnabled: true,
            freeUnitsLimit: true,
            trialDurationDays: true
          }
        }
      }
    });

    if (!unit) {
      throw new NotFoundException('Business unit not found');
    }

    return unit;
  }

  /**
   * Update business unit
   */
  async updateBusinessUnit(unitId: string, tenantId: string, updateDto: UpdateBusinessUnitDto) {
    // Verify unit exists and belongs to tenant
    await this.getBusinessUnit(unitId, tenantId);

    return this.prisma.businessUnit.update({
      where: { id: unitId },
      data: {
        ...updateDto,
        updatedAt: new Date()
      },
      include: {
        saasSubscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
  }

  /**
   * Delete business unit (soft delete by marking inactive)
   */
  async deleteBusinessUnit(unitId: string, tenantId: string) {
    // Verify unit exists and belongs to tenant
    await this.getBusinessUnit(unitId, tenantId);

    return this.prisma.businessUnit.update({
      where: { id: unitId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Convert business unit from trial to paid
   */
  async upgradeToPaid(unitId: string, tenantId: string, paymentDetails: {
    paymentMethod: string;
    paymentReference?: string;
  }) {
    const unit = await this.getBusinessUnit(unitId, tenantId);
    
    if (unit.isPaid) {
      throw new BadRequestException('Business unit is already on paid plan');
    }

    // Update business unit to paid
    const updatedUnit = await this.prisma.businessUnit.update({
      where: { id: unitId },
      data: {
        isPaid: true,
        updatedAt: new Date()
      }
    });

    // Update SaaS subscription to active
    const currentSubscription = unit.saasSubscriptions[0];
    if (currentSubscription) {
      await this.prisma.saasSubscription.update({
        where: { id: currentSubscription.id },
        data: {
          status: SaasSubscriptionStatus.ACTIVE,
          paymentMethod: paymentDetails.paymentMethod,
          paymentReference: paymentDetails.paymentReference,
          lastPaymentDate: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }
      });
    }

    return {
      businessUnit: updatedUnit,
      message: 'Business unit upgraded to paid plan successfully'
    };
  }

  /**
   * Get tenant statistics including business units
   */
  async getTenantStats(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        businessUnits: {
          include: {
            saasSubscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    }) as {
      id: string;
      name: string;
      category: any;
      paidModeEnabled: boolean;
      freeUnitsLimit: number;
      trialDurationDays: number;
      businessUnits: {
        id: string;
        isActive: boolean;
        isPaid: boolean;
        saasSubscriptions: {
          status: any;
        }[];
      }[];
    } | null;

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const stats = {
      tenant: {
        name: tenant.name,
        category: tenant.category,
        paidModeEnabled: tenant.paidModeEnabled,
        freeUnitsLimit: tenant.freeUnitsLimit,
        trialDurationDays: tenant.trialDurationDays
      },
      businessUnits: {
        total: tenant.businessUnits.length,
        active: tenant.businessUnits.filter(u => u.isActive).length,
        inactive: tenant.businessUnits.filter(u => !u.isActive).length,
        paid: tenant.businessUnits.filter(u => u.isPaid).length,
        trial: tenant.businessUnits.filter(u => !u.isPaid).length,
      },
      subscriptions: {
        trial: 0,
        active: 0,
        expired: 0,
        cancelled: 0
      }
    };

    // Count subscription statuses
    tenant.businessUnits.forEach(unit => {
      const latestSub = unit.saasSubscriptions[0];
      if (latestSub) {
        stats.subscriptions[latestSub.status.toLowerCase()]++;
      }
    });

    return stats;
  }
}
