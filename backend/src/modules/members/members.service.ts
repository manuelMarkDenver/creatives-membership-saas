import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MemberAuditAction } from '@prisma/client';
import { MEMBER_STATES, MEMBER_ACTION_REASONS } from '../../constants/member-audit';

export interface MemberActionRequest {
  reason: string;
  notes?: string;
}

export interface MemberHistoryQuery {
  page?: number;
  limit?: number;
  category?: 'ACCOUNT' | 'SUBSCRIPTION' | 'PAYMENT' | 'ACCESS';
  startDate?: string;
  endDate?: string;
}

export interface AuditLogData {
  memberId: string;
  action: MemberAuditAction;
  reason?: string;
  notes?: string;
  previousState?: string;
  newState?: string;
  performedBy?: string;
  metadata?: any;
}

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}
  
  async getMemberById(memberId: string) {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      include: {
        customerSubscriptions: {
          include: {
            membershipPlan: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!member) {
      throw new Error('Member not found');
    }
    
    return member;
  }

  async getMemberState(member: any): Promise<string> {
    // Check if deleted
    if (member.deletedAt || !member.isActive) {
      return MEMBER_STATES.DELETED;
    }

    // Check subscription status
    const activeSubscription = member.customerSubscriptions?.[0];
    if (!activeSubscription) {
      return MEMBER_STATES.CANCELLED;
    }

    // Check if subscription is expired
    const now = new Date();
    const endDate = new Date(activeSubscription.endDate);
    if (endDate < now || activeSubscription.status === 'EXPIRED') {
      return MEMBER_STATES.EXPIRED;
    }

    // Check if subscription is cancelled
    if (activeSubscription.status === 'CANCELLED') {
      return MEMBER_STATES.CANCELLED;
    }

    return MEMBER_STATES.ACTIVE;
  }
  
  async activateMember(memberId: string, request: MemberActionRequest, performedBy: string) {
    const member = await this.getMemberById(memberId);
    const currentState = await this.getMemberState(member);
    
    // Validate current state - can only activate cancelled or expired members
    if (currentState !== MEMBER_STATES.CANCELLED && currentState !== MEMBER_STATES.EXPIRED) {
      throw new Error(`Cannot activate member in ${currentState} state. Member must be cancelled or expired.`);
    }

    // Validate reason
    if (!MEMBER_ACTION_REASONS.ACTIVATION.includes(request.reason)) {
      throw new Error('Invalid activation reason');
    }
    
    // Update member status
    const updatedMember = await this.prisma.user.update({
      where: { id: memberId },
      data: { 
        isActive: true,
        updatedAt: new Date()
      }
    });

    // If there's a cancelled subscription, reactivate it
    const cancelledSubscription = member.customerSubscriptions?.[0];
    if (cancelledSubscription && cancelledSubscription.status === 'CANCELLED') {
      await this.prisma.customerSubscription.update({
        where: { id: cancelledSubscription.id },
        data: { 
          status: 'ACTIVE',
          cancelledAt: null,
          cancellationReason: null,
          cancellationNotes: null
        }
      });
    }
    
    // Create audit log
    await this.createAuditLog({
      memberId,
      action: 'ACCOUNT_ACTIVATED',
      reason: request.reason,
      notes: request.notes,
      previousState: currentState,
      newState: MEMBER_STATES.ACTIVE,
      performedBy,
      metadata: {
        subscriptionId: cancelledSubscription?.id,
        subscriptionStatus: cancelledSubscription?.status
      }
    });
    
    return { 
      success: true, 
      message: 'Member activated successfully',
      member: updatedMember
    };
  }
  
  async cancelMember(memberId: string, request: MemberActionRequest, performedBy: string) {
    const member = await this.getMemberById(memberId);
    const currentState = await this.getMemberState(member);
    
    if (currentState !== MEMBER_STATES.ACTIVE && currentState !== MEMBER_STATES.EXPIRED) {
      throw new Error(`Cannot cancel member in ${currentState} state. Only active or expired members can be cancelled.`);
    }

    // Validate reason
    if (!MEMBER_ACTION_REASONS.CANCELLATION.includes(request.reason)) {
      throw new Error('Invalid cancellation reason');
    }
    
    // Cancel current subscription if exists
    const activeSubscription = member.customerSubscriptions?.[0];
    if (activeSubscription) {
      await this.prisma.customerSubscription.update({
        where: { id: activeSubscription.id },
        data: { 
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: request.reason,
          cancellationNotes: request.notes
        }
      });
    }
    
    // Create audit log
    await this.createAuditLog({
      memberId,
      action: 'ACCOUNT_DEACTIVATED',
      reason: request.reason,
      notes: request.notes,
      previousState: currentState,
      newState: MEMBER_STATES.CANCELLED,
      performedBy,
      metadata: {
        subscriptionId: activeSubscription?.id,
        subscriptionEndDate: activeSubscription?.endDate
      }
    });
    
    return { 
      success: true, 
      message: 'Member cancelled successfully'
    };
  }
  
  async restoreMember(memberId: string, request: MemberActionRequest, performedBy: string) {
    const member = await this.getMemberById(memberId);
    
    if (!member.deletedAt) {
      throw new Error('Member is not deleted');
    }

    // Validate reason
    if (!MEMBER_ACTION_REASONS.RESTORATION.includes(request.reason)) {
      throw new Error('Invalid restoration reason');
    }
    
    // Restore member
    const restoredMember = await this.prisma.user.update({
      where: { id: memberId },
      data: { 
        isActive: true,
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date()
      }
    });
    
    // Create audit log
    await this.createAuditLog({
      memberId,
      action: 'ACCOUNT_RESTORED',
      reason: request.reason,
      notes: request.notes,
      previousState: MEMBER_STATES.DELETED,
      newState: MEMBER_STATES.ACTIVE,
      performedBy,
      metadata: {
        restoredAt: new Date().toISOString()
      }
    });
    
    return { 
      success: true, 
      message: 'Member restored successfully',
      member: restoredMember
    };
  }
  
  async renewMemberSubscription(memberId: string, planId: string, performedBy: string) {
    const member = await this.getMemberById(memberId);
    const currentState = await this.getMemberState(member);
    
    // Get the membership plan
    const membershipPlan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId }
    });
    
    if (!membershipPlan) {
      throw new Error('Membership plan not found');
    }
    
    // Calculate new dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + membershipPlan.duration);
    
    // Create new subscription
    const newSubscription = await this.prisma.customerSubscription.create({
      data: {
        tenantId: member.tenantId!,
        customerId: memberId,
        membershipPlanId: planId,
        status: 'ACTIVE',
        startDate,
        endDate,
        price: membershipPlan.price,
        autoRenew: true
      }
    });

    // Update member to active if not already
    await this.prisma.user.update({
      where: { id: memberId },
      data: { 
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    // Create audit log
    await this.createAuditLog({
      memberId,
      action: 'SUBSCRIPTION_RENEWED',
      reason: 'SUBSCRIPTION_RENEWED',
      previousState: currentState,
      newState: MEMBER_STATES.ACTIVE,
      performedBy,
      metadata: { 
        planId, 
        subscriptionId: newSubscription.id,
        planName: membershipPlan.name,
        duration: membershipPlan.duration,
        price: membershipPlan.price.toString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    
    return { 
      success: true, 
      message: 'Membership renewed successfully',
      subscription: newSubscription
    };
  }
  
  async getMemberHistory(memberId: string, query: MemberHistoryQuery) {
    console.log('📜 Getting member history for:', memberId, 'with query:', query);
    const { page = 1, limit = 50, category, startDate, endDate } = query;
    const offset = (page - 1) * limit;
    
    // Build where clause
    const where: any = { memberId };
    
    if (category) {
      // Filter by action category
      const categoryActions = {
        ACCOUNT: ['ACCOUNT_CREATED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_DELETED', 'ACCOUNT_RESTORED'],
        SUBSCRIPTION: ['SUBSCRIPTION_STARTED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_SUSPENDED', 'SUBSCRIPTION_RESUMED'],
        PAYMENT: ['PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED'],
        ACCESS: ['FACILITY_ACCESS_GRANTED', 'FACILITY_ACCESS_REVOKED', 'LOGIN_SUCCESSFUL', 'LOGIN_FAILED']
      };
      
      where.action = { in: categoryActions[category] || [] };
    }
    
    if (startDate) {
      where.performedAt = { ...where.performedAt, gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.performedAt = { ...where.performedAt, lte: new Date(endDate) };
    }
    
    // Get events and total count
    const [events, total] = await Promise.all([
      this.prisma.memberAuditLog.findMany({
        where,
        include: {
          performer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { performedAt: 'desc' },
        skip: offset,
        take: limit
      }),
      
      this.prisma.memberAuditLog.count({ where })
    ]);
    
    console.log('🔍 Found', total, 'audit logs for member', memberId, 'returning', events.length, 'items');
    
    return {
      logs: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
  
  private async createAuditLog(data: AuditLogData) {
    console.log('🔍 Creating audit log:', {
      memberId: data.memberId,
      action: data.action,
      reason: data.reason,
      performedBy: data.performedBy
    });
    
    try {
      const result = await this.prisma.memberAuditLog.create({
        data: {
          memberId: data.memberId,
          action: data.action,
          reason: data.reason,
          notes: data.notes,
          previousState: data.previousState,
          newState: data.newState,
          performedBy: data.performedBy,
          metadata: data.metadata
        }
      });
      console.log('✅ Audit log created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Failed to create audit log:', error);
      throw error;
    }
  }

  // Helper method to get member status for frontend
  async getMemberWithStatus(memberId: string) {
    const member = await this.getMemberById(memberId);
    const state = await this.getMemberState(member);
    
    // Get the active subscription if it exists
    const subscription = member.customerSubscriptions?.[0] || null;
    
    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phoneNumber: member.phoneNumber,
      isActive: member.isActive,
      currentState: state,
      subscription: subscription
    };
  }

  // Get valid reasons for different actions
  getActionReasons() {
    // Transform the flat object into the format expected by the frontend
    return [
      {
        category: 'ACCOUNT',
        reasons: [...MEMBER_ACTION_REASONS.ACTIVATION, ...MEMBER_ACTION_REASONS.RESTORATION]
      },
      {
        category: 'SUBSCRIPTION',
        reasons: [...MEMBER_ACTION_REASONS.CANCELLATION, 'SUBSCRIPTION_RENEWED']
      }
    ];
  }
}
