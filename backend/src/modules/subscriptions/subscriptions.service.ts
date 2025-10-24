import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BillingCycle, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a trial subscription for a branch (used when tenant/branch is created)
   */
  async createTrialSubscription(branchId: string) {
    // Get the trial plan
    const trialPlan = await this.prisma.plan.findUnique({
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

    return this.prisma.subscription.create({
      data: {
        branchId,
        planId: trialPlan.id,
        startDate,
        endDate,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        plan: true,
        branch: {
          include: {
            tenant: true,
          },
        },
      },
    });
  }

  /**
   * Check if a tenant can create additional branches
   */
  async canCreateBranch(tenantId: string): Promise<{
    canCreate: boolean;
    reason?: string;
    freeBranchesRemaining: number;
    trialBranchesActive: number;
  }> {
    // Get tenant with override information
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branches: {
          where: {
            isActive: true, // Only count active (non-deleted) branches
          },
          include: {
            subscriptions: {
              where: {
                status: SubscriptionStatus.ACTIVE,
              },
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Count active branches with trial subscriptions
    const activeBranches = tenant.branches.filter((branch) =>
      branch.subscriptions.some(
        (sub) => sub.status === SubscriptionStatus.ACTIVE,
      ),
    );

    const trialBranchesActive = activeBranches.filter((branch) =>
      branch.subscriptions.some(
        (sub) =>
          sub.status === SubscriptionStatus.ACTIVE &&
          sub.plan.billingCycle === BillingCycle.TRIAL &&
          sub.endDate > new Date(), // Trial not expired
      ),
    ).length;

    const paidBranchesActive = activeBranches.length - trialBranchesActive;

    // Calculate free branches allowed: 1 standard trial + any override
    const freeBranchesAllowed = 1 + (tenant.freeBranchOverride || 0);
    const freeBranchesUsed = trialBranchesActive;
    const freeBranchesRemaining = Math.max(
      0,
      freeBranchesAllowed - freeBranchesUsed,
    );

    if (freeBranchesRemaining > 0) {
      return {
        canCreate: true,
        freeBranchesRemaining,
        trialBranchesActive,
      };
    }

    // Check if any trial branches have expired
    const expiredTrialBranches = tenant.branches.filter((branch) =>
      branch.subscriptions.some(
        (sub) =>
          sub.plan.billingCycle === BillingCycle.TRIAL &&
          sub.endDate <= new Date() && // Trial expired
          sub.status === SubscriptionStatus.ACTIVE,
      ),
    );

    if (expiredTrialBranches.length > 0) {
      // Mark expired subscriptions as expired
      await this.prisma.subscription.updateMany({
        where: {
          branchId: { in: expiredTrialBranches.map((b) => b.id) },
          status: SubscriptionStatus.ACTIVE,
          endDate: { lte: new Date() },
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      });

      return {
        canCreate: false,
        reason:
          'Trial period expired. Please upgrade to a paid plan to create more branches.',
        freeBranchesRemaining: 0,
        trialBranchesActive: 0,
      };
    }

    return {
      canCreate: false,
      reason: 'Free branch limit reached. Upgrade to create more branches.',
      freeBranchesRemaining: 0,
      trialBranchesActive,
    };
  }

  /**
   * Get tenant's subscription status overview
   */
  async getTenantSubscriptionStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branches: {
          include: {
            subscriptions: {
              where: {
                status: {
                  in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED],
                },
              },
              include: {
                plan: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const branchStatuses = tenant.branches.map((branch) => {
      const latestSubscription = branch.subscriptions[0];
      const isExpired =
        latestSubscription && latestSubscription.endDate <= new Date();

      return {
        branchId: branch.id,
        branchName: branch.name,
        subscription: latestSubscription,
        status: isExpired
          ? 'EXPIRED'
          : latestSubscription?.status || 'NO_SUBSCRIPTION',
        daysRemaining: latestSubscription
          ? Math.max(
              0,
              Math.ceil(
                (latestSubscription.endDate.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : 0,
      };
    });

    const canCreateResult = await this.canCreateBranch(tenantId);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        freeBranchOverride: tenant.freeBranchOverride,
      },
      branches: branchStatuses,
      canCreateBranch: canCreateResult,
    };
  }

  /**
   * Super admin method to update tenant's free branch override
   */
  async updateFreeBranchOverride(tenantId: string, override: number) {
    if (override < 0) {
      throw new BadRequestException('Free branch override cannot be negative');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { freeBranchOverride: override },
    });
  }

  /**
   * Get all subscriptions with filtering options (Super Admin)
   */
  async getAllSubscriptions(filters: {
    status?: string;
    planId?: string;
    tenantId?: string;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.planId) {
      where.planId = filters.planId;
    }

    if (filters.tenantId) {
      where.branch = {
        tenantId: filters.tenantId,
      };
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where,
      include: {
        plan: true,
        branch: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
              },
            },
          },
        },
        payments: {
          where: { status: 'SUCCESSFUL' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const subscriptionStats = subscriptions.map((sub) => ({
      id: sub.id,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      plan: sub.plan,
      branch: {
        id: sub.branch.id,
        name: sub.branch.name,
        tenant: sub.branch.tenant,
      },
      totalPayments: sub.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      ),
      paymentCount: sub.payments.length,
      daysRemaining: Math.max(
        0,
        Math.ceil(
          (sub.endDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      ),
      isExpired: sub.endDate <= new Date(),
    }));

    return {
      subscriptions: subscriptionStats,
      summary: {
        total: subscriptions.length,
        active: subscriptions.filter(
          (s) => s.status === SubscriptionStatus.ACTIVE,
        ).length,
        expired: subscriptions.filter((s) => s.endDate <= new Date()).length,
        totalRevenue: subscriptionStats.reduce(
          (sum, s) => sum + s.totalPayments,
          0,
        ),
      },
    };
  }

  /**
   * Get subscription by ID with full details
   */
  async getSubscriptionById(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        branch: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      ...subscription,
      totalPayments: subscription.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      ),
      daysRemaining: Math.max(
        0,
        Math.ceil(
          (subscription.endDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      ),
      isExpired: subscription.endDate <= new Date(),
    };
  }

  /**
   * Create a new subscription (Super Admin)
   */
  async createSubscription(data: {
    branchId: string;
    planId: string;
    startDate: string;
    endDate: string;
    status?: SubscriptionStatus;
  }) {
    // Verify branch exists
    const branch = await this.prisma.branch.findUnique({
      where: { id: data.branchId },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Verify plan exists
    const plan = await this.prisma.plan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check for overlapping active subscriptions
    const overlappingSubscription = await this.prisma.subscription.findFirst({
      where: {
        branchId: data.branchId,
        status: SubscriptionStatus.ACTIVE,
        OR: [
          {
            startDate: {
              lte: new Date(data.endDate),
            },
            endDate: {
              gte: new Date(data.startDate),
            },
          },
        ],
      },
    });

    if (overlappingSubscription) {
      throw new BadRequestException(
        'Branch already has an active subscription for this period',
      );
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        branchId: data.branchId,
        planId: data.planId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || SubscriptionStatus.ACTIVE,
      },
      include: {
        plan: true,
        branch: {
          include: {
            tenant: true,
          },
        },
      },
    });

    return subscription;
  }

  /**
   * Update subscription (Super Admin)
   */
  async updateSubscription(
    id: string,
    data: {
      planId?: string;
      startDate?: string;
      endDate?: string;
      status?: SubscriptionStatus;
    },
  ) {
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify plan exists if planId is being updated
    if (data.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: data.planId },
      });

      if (!plan) {
        throw new NotFoundException('Plan not found');
      }
    }

    const updateData: any = {};
    if (data.planId) updateData.planId = data.planId;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.status) updateData.status = data.status;

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        plan: true,
        branch: {
          include: {
            tenant: true,
          },
        },
      },
    });

    return updatedSubscription;
  }

  /**
   * Delete subscription (Super Admin)
   */
  async deleteSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Prevent deletion if there are payments
    if (subscription.payments.length > 0) {
      throw new BadRequestException(
        `Cannot delete subscription with ${subscription.payments.length} payment(s). ` +
          'Please set status to CANCELED instead.',
      );
    }

    await this.prisma.subscription.delete({
      where: { id },
    });

    return { message: 'Subscription deleted successfully' };
  }

  /**
   * Update subscription status (Super Admin)
   */
  async updateSubscriptionStatus(id: string, status: string) {
    if (
      !Object.values(SubscriptionStatus).includes(status as SubscriptionStatus)
    ) {
      throw new BadRequestException('Invalid subscription status');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: { status: status as SubscriptionStatus },
      include: {
        plan: true,
        branch: {
          include: {
            tenant: true,
          },
        },
      },
    });

    return {
      ...updatedSubscription,
      message: `Subscription status updated to ${status}`,
    };
  }

  /**
   * Extend subscription by X days (Super Admin)
   */
  async extendSubscription(id: string, days: number) {
    if (days <= 0) {
      throw new BadRequestException('Days must be a positive number');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + days);

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: { endDate: newEndDate },
      include: {
        plan: true,
        branch: {
          include: {
            tenant: true,
          },
        },
      },
    });

    return {
      ...updatedSubscription,
      message: `Subscription extended by ${days} days`,
      daysRemaining: Math.max(
        0,
        Math.ceil(
          (newEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        ),
      ),
    };
  }

  /**
   * Get subscriptions expiring soon (Super Admin)
   */
  async getExpiringSoon(days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          lte: futureDate,
          gte: new Date(), // Not already expired
        },
      },
      include: {
        plan: true,
        branch: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    const subscriptionStats = subscriptions.map((sub) => ({
      id: sub.id,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      plan: sub.plan,
      branch: {
        id: sub.branch.id,
        name: sub.branch.name,
        tenant: sub.branch.tenant,
      },
      daysRemaining: Math.ceil(
        (sub.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      ),
    }));

    return {
      subscriptions: subscriptionStats,
      summary: {
        total: subscriptions.length,
        averageDaysRemaining:
          subscriptions.length > 0
            ? Math.round(
                subscriptionStats.reduce((sum, s) => sum + s.daysRemaining, 0) /
                  subscriptions.length,
              )
            : 0,
      },
    };
  }
}
