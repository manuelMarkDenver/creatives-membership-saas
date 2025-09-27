import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  GymMemberSubscriptionStatus,
  TransactionType,
  TransactionStatus,
} from '@prisma/client';

@Injectable()
export class GymSubscriptionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get gym member's current subscription (most recent)
   */
  async getCurrentSubscription(memberId: string, tenantId: string) {
    return this.prisma.gymMemberSubscription.findFirst({
      where: {
        memberId: memberId,
        tenantId,
      },
      include: {
        membershipPlan: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,

            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get gym member's subscription history
   */
  async getSubscriptionHistory(memberId: string, tenantId: string) {
    return this.prisma.gymMemberSubscription.findMany({
      where: {
        memberId: memberId,
        tenantId,
      },
      include: {
        membershipPlan: {
          select: {
            id: true,

            price: true,
            duration: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Renew gym membership for a member
   */
  async renewMembership(
    memberId: string,
    membershipPlanId: string,
    tenantId: string,
    processedBy: string,
    paymentMethod: string = 'cash',
  ) {
    // Check for duplicate active subscriptions to prevent conflicts
    // Allow renewals for expired subscriptions or short-term memberships
    const existingActiveSubscription = await this.prisma.gymMemberSubscription.findFirst({
      where: {
        memberId: memberId,
        tenantId,
        status: GymMemberSubscriptionStatus.ACTIVE,
        endDate: {
          gt: new Date(), // Still valid in the future
        },
      },
      include: {
        membershipPlan: true,
      },
    });

    // Only prevent renewal if there's an active subscription with significant time remaining
    // Allow renewal for day passes or subscriptions ending within 24 hours
    if (existingActiveSubscription) {
      const now = new Date();
      const timeRemaining = existingActiveSubscription.endDate.getTime() - now.getTime();
      const hoursRemaining = timeRemaining / (1000 * 60 * 60);
      
      // Allow renewal if:
      // 1. Less than 24 hours remaining on current subscription
      // 2. Current plan is a day pass (duration <= 1 day)
      // 3. It's the same plan (renewal/extension)
      const isDayPass = existingActiveSubscription.membershipPlan.duration <= 1;
      const isSamePlan = existingActiveSubscription.membershipPlanId === membershipPlanId;
      const isExpiringSoon = hoursRemaining <= 24;
      
      if (!isDayPass && !isExpiringSoon && !isSamePlan) {
        const remainingDays = Math.ceil(hoursRemaining / 24);
        throw new BadRequestException(
          `Member still has an active subscription with ${remainingDays} day(s) remaining. Cannot create overlapping subscriptions.`,
        );
      }
    }

    // Get the membership plan
    const membershipPlan = await this.prisma.membershipPlan.findFirst({
      where: {
        id: membershipPlanId,
        tenantId,
        isActive: true,
      },
    });

    if (!membershipPlan) {
      throw new NotFoundException('Membership plan not found or inactive');
    }

    // Get member details
    const member = await this.prisma.user.findFirst({
      where: {
        id: memberId,
        tenantId,
        role: 'CLIENT',
      },
    });

    if (!member) {
      throw new NotFoundException('Gym member not found');
    }

    // Check for existing active subscription
    const existingSubscription = await this.getCurrentSubscription(
      memberId,
      tenantId,
    );

    // If there's an active subscription, expire it first
    if (
      existingSubscription &&
      existingSubscription.status === GymMemberSubscriptionStatus.ACTIVE
    ) {
      await this.prisma.gymMemberSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: GymMemberSubscriptionStatus.EXPIRED,
          cancelledAt: new Date(),
          cancellationReason: 'renewed',
          cancellationNotes: 'Expired due to membership renewal',
        },
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + membershipPlan.duration);

    // Create new subscription
    const subscription = await this.prisma.gymMemberSubscription.create({
      data: {
        memberId: memberId,
        tenantId,
        membershipPlanId,
        status: GymMemberSubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        price: membershipPlan.price,
        currency: 'PHP',
        autoRenew: true,
      },
      include: {
        membershipPlan: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,

            email: true,
          },
        },
      },
    });

    // Validate processedBy user exists if provided
    let validProcessedBy: string | null = null;
    if (processedBy) {
      const processor = await this.prisma.user.findUnique({
        where: { id: processedBy },
      });
      if (processor) {
        validProcessedBy = processedBy;
      }
    }

    // Create transaction record
    await this.prisma.customerTransaction.create({
      data: {
        tenantId,
        customerId: memberId,
        businessType: 'gym',
        transactionCategory: 'membership',
        amount: membershipPlan.price,
        netAmount: membershipPlan.price,
        paymentMethod,
        transactionType: TransactionType.PAYMENT,
        status: TransactionStatus.COMPLETED,
        relatedEntityType: 'membership_plan',
        relatedEntityId: membershipPlan.id,
        relatedEntityName: membershipPlan.name,
        description: `Gym membership renewal: ${membershipPlan.name}`,
        processedBy: validProcessedBy,
      },
    });

    // Update user's businessData to remove payment history only
    // (keep other business-specific data but use new transaction system)
    const currentUser = await this.prisma.user.findUnique({
      where: { id: memberId },
    });
    const currentBusinessData = currentUser?.businessData as any;

    if (currentBusinessData) {
      // Remove paymentHistory but keep other data
      delete currentBusinessData.paymentHistory;

      await this.prisma.user.update({
        where: { id: memberId },
        data: {
          businessData: currentBusinessData,
        },
      });
    }

    return {
      success: true,
      subscription,
      message: `Gym membership renewed successfully. Valid until ${endDate.toLocaleDateString()}`,
    };
  }

  /**
   * Cancel gym membership for a member
   */
  async cancelMembership(
    memberId: string,
    tenantId: string,
    processedBy: string,
    cancellationReason?: string,
    cancellationNotes?: string,
  ) {
    // Get current subscription
    const subscription = await this.getCurrentSubscription(memberId, tenantId);

    if (!subscription) {
      throw new NotFoundException('No subscription found for this gym member');
    }

    // Check if already cancelled or expired
    if (subscription.status !== GymMemberSubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        'Subscription is already cancelled or expired',
      );
    }

    // Cancel the subscription
    const cancelledSubscription =
      await this.prisma.gymMemberSubscription.update({
        where: { id: subscription.id },
        data: {
          status: GymMemberSubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: cancellationReason || 'manual_cancellation',
          cancellationNotes,
          autoRenew: false,
        },
        include: {
          membershipPlan: true,
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              photoUrl: true,
            },
          },
          tenant: true,
        },
      });

    // Update user's businessData to remove payment history only
    // (keep other business-specific data but use new transaction system)
    const currentUser = await this.prisma.user.findUnique({
      where: { id: memberId },
    });
    const currentBusinessData = currentUser?.businessData as any;

    if (currentBusinessData) {
      // Remove paymentHistory but keep other data
      delete currentBusinessData.paymentHistory;

      await this.prisma.user.update({
        where: { id: memberId },
        data: {
          businessData: currentBusinessData,
        },
      });
    }

    return {
      success: true,
      subscription: cancelledSubscription,
      message: 'Gym membership cancelled successfully',
    };
  }

  /**
   * Get gym member transactions
   */
  async getMemberTransactions(memberId: string, tenantId: string) {
    return this.prisma.customerTransaction.findMany({
      where: {
        customerId: memberId,
        tenantId,
        businessType: 'gym', // Filter for gym-specific transactions
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        processor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get gym subscription statistics for tenant
   * Counts unique gym members by their most recent subscription status
   */
  async getSubscriptionStats(tenantId: string) {
    // Get all gym member subscriptions for the tenant, grouped by member
    const subscriptionsByMember =
      await this.prisma.gymMemberSubscription.groupBy({
        by: ['memberId'],
        where: {
          tenantId,
          // Only include gym members
          member: {
            role: 'CLIENT',
          },
        },
        _max: {
          createdAt: true,
        },
      });

    // For each gym member, get their most recent subscription
    const memberStatuses = await Promise.all(
      subscriptionsByMember.map(async (group) => {
        if (!group._max.createdAt) {
          return { status: null, endDate: null }; // Skip if no createdAt found
        }

        const mostRecent = await this.prisma.gymMemberSubscription.findFirst({
          where: {
            memberId: group.memberId,
            tenantId,
            createdAt: group._max.createdAt,
            member: {
              role: 'CLIENT',
            },
          },
          select: {
            status: true,
            endDate: true,
          },
        });
        return {
          status: mostRecent?.status || null,
          endDate: mostRecent?.endDate || null,
        };
      }),
    );

    // Count expiring subscriptions (active subscriptions ending within 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const expiringCount = memberStatuses.filter(({ status, endDate }) => {
      return (
        status === 'ACTIVE' &&
        endDate &&
        endDate <= sevenDaysFromNow &&
        endDate >= now
      );
    }).length;

    // Count gym members by their current status
    const stats = memberStatuses.reduce(
      (acc, { status }) => {
        if (status) {
          acc[status.toLowerCase()] = (acc[status.toLowerCase()] || 0) + 1;
          acc.total += 1;
        }
        return acc;
      },
      {
        total: 0,
        active: 0,
        expired: 0,
        cancelled: 0,
        expiring: expiringCount,
      },
    );

    return stats;
  }

  /**
   * Get count of expiring subscriptions
   */
  async getExpiringCount(tenantId: string, daysBefore: number = 7) {
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + daysBefore);

    const count = await this.prisma.gymMemberSubscription.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: targetDate,
        },
        member: {
          role: 'CLIENT',
          deletedAt: null,
        },
      },
    });

    return { count };
  }

  /**
   * Get detailed list of expiring subscriptions
   */
  async getExpiringSubscriptions(
    tenantId: string,
    daysBefore: number = 7,
    page: number = 1,
    limit: number = 50,
  ) {
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + daysBefore);

    const skip = (page - 1) * limit;

    // Get expiring subscriptions with member and plan details
    const [subscriptions, totalCount] = await Promise.all([
      this.prisma.gymMemberSubscription.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
          endDate: {
            gte: now,
            lte: targetDate,
          },
          member: {
            role: 'CLIENT',
            deletedAt: null,
          },
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              photoUrl: true,
            },
          },
          membershipPlan: {
            select: {
              id: true,
              name: true,
              type: true,
              price: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: {
          endDate: 'asc', // Most urgent first
        },
        skip,
        take: limit,
      }),
      this.prisma.gymMemberSubscription.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          endDate: {
            gte: now,
            lte: targetDate,
          },
          member: {
            role: 'CLIENT',
            deletedAt: null,
          },
        },
      }),
    ]);

    // Calculate urgency and days until expiry for each subscription
    const enrichedSubscriptions = subscriptions.map((subscription) => {
      const daysUntilExpiry = Math.ceil(
        (subscription.endDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      let urgency: 'critical' | 'high' | 'medium';
      if (daysUntilExpiry <= 1) {
        urgency = 'critical';
      } else if (daysUntilExpiry <= 3) {
        urgency = 'high';
      } else {
        urgency = 'medium';
      }

      return {
        id: subscription.id,
        customerId: subscription.memberId,
        membershipPlanId: subscription.membershipPlanId,
        tenantId: subscription.tenantId,
        status: subscription.status,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate.toISOString(),
        price: subscription.price,
        daysUntilExpiry,
        memberName:
          `${subscription.member.firstName} ${subscription.member.lastName}`.trim(),
        isExpired: daysUntilExpiry <= 0,
        urgency,
        customer: {
          id: subscription.member.id,
          firstName: subscription.member.firstName,
          lastName: subscription.member.lastName,
          email: subscription.member.email,
          phoneNumber: subscription.member.phoneNumber,
          photoUrl: subscription.member.photoUrl,
        },
        membershipPlan: subscription.membershipPlan,
        tenant: subscription.tenant,
      };
    });

    // Calculate summary statistics
    const critical = enrichedSubscriptions.filter(
      (s) => s.urgency === 'critical',
    ).length;
    const high = enrichedSubscriptions.filter(
      (s) => s.urgency === 'high',
    ).length;
    const medium = enrichedSubscriptions.filter(
      (s) => s.urgency === 'medium',
    ).length;

    const pages = Math.ceil(totalCount / limit);
    const hasNext = page < pages;
    const hasPrev = page > 1;

    return {
      subscriptions: enrichedSubscriptions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages,
        hasNext,
        hasPrev,
      },
      summary: {
        totalExpiring: totalCount,
        daysBefore,
        critical,
        high,
        medium,
      },
    };
  }
}
