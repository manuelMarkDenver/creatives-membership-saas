import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GymMemberSubscriptionStatus, TransactionType, TransactionStatus } from '@prisma/client';

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
        tenantId
      },
      include: {
        membershipPlan: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get gym member's subscription history
   */
  async getSubscriptionHistory(memberId: string, tenantId: string) {
    return this.prisma.gymMemberSubscription.findMany({
      where: {
        memberId: memberId,
        tenantId
      },
      include: {
        membershipPlan: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
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
    paymentMethod: string = 'cash'
  ) {
    // Get the membership plan
    const membershipPlan = await this.prisma.membershipPlan.findFirst({
      where: {
        id: membershipPlanId,
        tenantId,
        isActive: true
      }
    });

    if (!membershipPlan) {
      throw new NotFoundException('Membership plan not found or inactive');
    }

    // Get member details
    const member = await this.prisma.user.findFirst({
      where: {
        id: memberId,
        tenantId,
        role: 'GYM_MEMBER'
      }
    });

    if (!member) {
      throw new NotFoundException('Gym member not found');
    }

    // Check for existing active subscription
    const existingSubscription = await this.getCurrentSubscription(memberId, tenantId);
    
    // If there's an active subscription, expire it first
    if (existingSubscription && existingSubscription.status === GymMemberSubscriptionStatus.ACTIVE) {
      await this.prisma.gymMemberSubscription.update({
        where: { id: existingSubscription.id },
        data: { 
          status: GymMemberSubscriptionStatus.EXPIRED,
          cancelledAt: new Date(),
          cancellationReason: 'renewed',
          cancellationNotes: 'Expired due to membership renewal'
        }
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
        autoRenew: true
      },
      include: {
        membershipPlan: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Validate processedBy user exists if provided
    let validProcessedBy: string | null = null;
    if (processedBy) {
      const processor = await this.prisma.user.findUnique({
        where: { id: processedBy }
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
        processedBy: validProcessedBy
      }
    });

    // Update user's businessData to remove payment history only
    // (keep other business-specific data but use new transaction system)
    const currentUser = await this.prisma.user.findUnique({ where: { id: memberId } });
    const currentBusinessData = currentUser?.businessData as any;
    
    if (currentBusinessData) {
      // Remove paymentHistory but keep other data
      delete currentBusinessData.paymentHistory;
      
      await this.prisma.user.update({
        where: { id: memberId },
        data: {
          businessData: currentBusinessData
        }
      });
    }

    return {
      success: true,
      subscription,
      message: `Gym membership renewed successfully. Valid until ${endDate.toLocaleDateString()}`
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
    cancellationNotes?: string
  ) {
    // Get current subscription
    const subscription = await this.getCurrentSubscription(memberId, tenantId);
    
    if (!subscription) {
      throw new NotFoundException('No subscription found for this gym member');
    }

    // Check if already cancelled or expired
    if (subscription.status !== GymMemberSubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is already cancelled or expired');
    }

    // Cancel the subscription
    const cancelledSubscription = await this.prisma.gymMemberSubscription.update({
      where: { id: subscription.id },
      data: {
        status: GymMemberSubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: cancellationReason || 'manual_cancellation',
        cancellationNotes,
        autoRenew: false
      },
      include: {
        membershipPlan: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update user's businessData to remove payment history only  
    // (keep other business-specific data but use new transaction system)
    const currentUser = await this.prisma.user.findUnique({ where: { id: memberId } });
    const currentBusinessData = currentUser?.businessData as any;
    
    if (currentBusinessData) {
      // Remove paymentHistory but keep other data
      delete currentBusinessData.paymentHistory;
      
      await this.prisma.user.update({
        where: { id: memberId },
        data: {
          businessData: currentBusinessData
        }
      });
    }

    return {
      success: true,
      subscription: cancelledSubscription,
      message: 'Gym membership cancelled successfully'
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
        businessType: 'gym' // Filter for gym-specific transactions
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        processor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Get gym subscription statistics for tenant
   * Counts unique gym members by their most recent subscription status
   */
  async getSubscriptionStats(tenantId: string) {
    // Get all gym member subscriptions for the tenant, grouped by member
    const subscriptionsByMember = await this.prisma.gymMemberSubscription.groupBy({
      by: ['memberId'],
      where: { 
        tenantId,
        // Only include gym members
        member: {
          role: 'GYM_MEMBER'
        }
      },
      _max: {
        createdAt: true
      }
    });

    // For each gym member, get their most recent subscription
    const memberStatuses = await Promise.all(
      subscriptionsByMember.map(async (group) => {
        if (!group._max.createdAt) {
          return null; // Skip if no createdAt found
        }
        
        const mostRecent = await this.prisma.gymMemberSubscription.findFirst({
          where: {
            memberId: group.memberId,
            tenantId,
            createdAt: group._max.createdAt,
            member: {
              role: 'GYM_MEMBER'
            }
          },
          select: {
            status: true
          }
        });
        return mostRecent?.status || null;
      })
    );

    // Count gym members by their current status
    const stats = memberStatuses.reduce((acc, status) => {
      if (status) {
        acc[status.toLowerCase()] = (acc[status.toLowerCase()] || 0) + 1;
        acc.total += 1;
      }
      return acc;
    }, {
      total: 0,
      active: 0,
      expired: 0,
      cancelled: 0
    });

    return stats;
  }
}
