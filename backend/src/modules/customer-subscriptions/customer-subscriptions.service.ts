import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CustomerSubscriptionStatus, TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class CustomerSubscriptionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get customer's current subscription (most recent)
   */
  async getCurrentSubscription(customerId: string, tenantId: string) {
    return this.prisma.customerSubscription.findFirst({
      where: {
        customerId,
        tenantId
      },
      include: {
        membershipPlan: true,
        customer: {
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
   * Get customer's subscription history
   */
  async getSubscriptionHistory(customerId: string, tenantId: string) {
    return this.prisma.customerSubscription.findMany({
      where: {
        customerId,
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
   * Renew membership for a customer
   */
  async renewMembership(
    customerId: string, 
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

    // Get customer details
    const customer = await this.prisma.user.findFirst({
      where: {
        id: customerId,
        tenantId,
        role: 'GYM_MEMBER'
      }
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check for existing active subscription
    const existingSubscription = await this.getCurrentSubscription(customerId, tenantId);
    
    // If there's an active subscription, expire it first
    if (existingSubscription && existingSubscription.status === CustomerSubscriptionStatus.ACTIVE) {
      await this.prisma.customerSubscription.update({
        where: { id: existingSubscription.id },
        data: { 
          status: CustomerSubscriptionStatus.EXPIRED,
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
    const subscription = await this.prisma.customerSubscription.create({
      data: {
        customerId,
        tenantId,
        membershipPlanId,
        status: CustomerSubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        price: membershipPlan.price,
        currency: 'PHP',
        autoRenew: true
      },
      include: {
        membershipPlan: true,
        customer: {
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
        customerId,
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
        description: `Membership renewal: ${membershipPlan.name}`,
        processedBy: validProcessedBy
      }
    });

    // Update user's businessData to remove payment history only
    // (keep other business-specific data but use new transaction system)
    const currentUser = await this.prisma.user.findUnique({ where: { id: customerId } });
    const currentBusinessData = currentUser?.businessData as any;
    
    if (currentBusinessData) {
      // Remove paymentHistory but keep other data
      delete currentBusinessData.paymentHistory;
      
      await this.prisma.user.update({
        where: { id: customerId },
        data: {
          businessData: currentBusinessData
        }
      });
    }

    return {
      success: true,
      subscription,
      message: `Membership renewed successfully. Valid until ${endDate.toLocaleDateString()}`
    };
  }

  /**
   * Cancel membership for a customer
   */
  async cancelMembership(
    customerId: string, 
    tenantId: string, 
    processedBy: string,
    cancellationReason?: string,
    cancellationNotes?: string
  ) {
    // Get current subscription
    const subscription = await this.getCurrentSubscription(customerId, tenantId);
    
    if (!subscription) {
      throw new NotFoundException('No subscription found for this customer');
    }

    // Check if already cancelled or expired
    if (subscription.status !== CustomerSubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is already cancelled or expired');
    }

    // Cancel the subscription
    const cancelledSubscription = await this.prisma.customerSubscription.update({
      where: { id: subscription.id },
      data: {
        status: CustomerSubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: cancellationReason || 'manual_cancellation',
        cancellationNotes,
        autoRenew: false
      },
      include: {
        membershipPlan: true,
        customer: {
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
    const currentUser = await this.prisma.user.findUnique({ where: { id: customerId } });
    const currentBusinessData = currentUser?.businessData as any;
    
    if (currentBusinessData) {
      // Remove paymentHistory but keep other data
      delete currentBusinessData.paymentHistory;
      
      await this.prisma.user.update({
        where: { id: customerId },
        data: {
          businessData: currentBusinessData
        }
      });
    }

    return {
      success: true,
      subscription: cancelledSubscription,
      message: 'Membership cancelled successfully'
    };
  }

  /**
   * Get customer transactions
   */
  async getCustomerTransactions(customerId: string, tenantId: string) {
    return this.prisma.customerTransaction.findMany({
      where: {
        customerId,
        tenantId
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
   * Get subscription statistics for tenant
   */
  async getSubscriptionStats(tenantId: string) {
    const [total, active, expired, cancelled] = await Promise.all([
      this.prisma.customerSubscription.count({ where: { tenantId } }),
      this.prisma.customerSubscription.count({ 
        where: { tenantId, status: CustomerSubscriptionStatus.ACTIVE } 
      }),
      this.prisma.customerSubscription.count({ 
        where: { tenantId, status: CustomerSubscriptionStatus.EXPIRED } 
      }),
      this.prisma.customerSubscription.count({ 
        where: { tenantId, status: CustomerSubscriptionStatus.CANCELLED } 
      })
    ]);

    return {
      total,
      active,
      expired,
      cancelled
    };
  }
}
