import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { S3UploadService } from '../../../core/supabase/s3-upload.service';
import { NotificationsService } from '../../../core/notifications/notifications.service';

@Injectable()
export class GymMembersService {
  private readonly logger = new Logger(GymMembersService.name);

  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
    private s3UploadService: S3UploadService,
    private notificationsService: NotificationsService,
  ) {}

  // ========================================
  // Gym Member Creation - Creates User + GymMemberProfile automatically
  // ========================================

  async createGymMember(data: any, tenantId: string) {
    try {
      // Validate required fields
      if (!data.firstName?.trim()) {
        throw new BadRequestException('First name is required');
      }
      if (!data.lastName?.trim()) {
        throw new BadRequestException('Last name is required');
      }

      // Create user and gym member profile in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Create the user
        const user = await tx.user.create({
          data: {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email?.trim().toLowerCase() || null,
            phoneNumber: data.phoneNumber?.trim() || null,
          },
        });

        // 2. Create the gym member profile
        const gymProfile = await tx.gymMemberProfile.create({
          data: {
            userId: user.id,
            tenantId: tenantId,
            role: 'GYM_MEMBER',
            status: 'ACTIVE',
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            emergencyContactRelation: data.emergencyContactRelation,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            joinedDate: new Date(),
          },
          include: {
            user: true,
            tenant: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        });

        return gymProfile;
      });

      this.logger.log(
        `Created gym member: ${result.user.firstName} ${result.user.lastName} (${result.userId})`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create gym member: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  // ========================================
  // NOTE: For basic user CRUD (read, update, delete, photo upload)
  // use the Users controller at /users - it handles ALL user types (GYM_MEMBER, ECOM_CUSTOMER, etc.)
  //
  // This service focuses ONLY on gym-specific business logic:
  // - Subscription management
  // - Gym analytics and stats
  // - Workout tracking
  // - Equipment usage
  // - Gym-specific reporting
  // ========================================

  async getGymSpecificStats(tenantId: string) {
    // TODO: Implement gym-specific member statistics (attendance, equipment usage, etc.)
    return { message: 'Gym-specific stats will be implemented here' };
  }

  async getWorkoutStats(tenantId: string, memberId?: string) {
    // TODO: Implement workout tracking and statistics
    return { message: 'Workout stats will be implemented here' };
  }

  async getEquipmentUsage(tenantId: string) {
    // TODO: Implement equipment usage analytics
    return { message: 'Equipment usage analytics will be implemented here' };
  }

  // ========================================
  // Member Management Methods - Gym Specific
  // ========================================

  async getMemberState(member: any): Promise<string> {
    // Check if deleted (has deletedAt timestamp)
    if (member.deletedAt) {
      return 'DELETED';
    }

    // Check subscription status
    const activeSubscription = member.gymMemberSubscriptions?.[0];
    if (!activeSubscription) {
      // No subscription - determine if inactive or cancelled based on isActive flag
      return !member.isActive ? 'INACTIVE' : 'CANCELLED';
    }

    // Check if subscription is cancelled
    if (activeSubscription.status === 'CANCELLED') {
      return 'CANCELLED';
    }

    // Check if subscription is expired
    const now = new Date();
    const endDate = new Date(activeSubscription.endDate);
    if (endDate < now || activeSubscription.status === 'EXPIRED') {
      return 'EXPIRED';
    }

    // Member has active subscription - check if account is active
    if (!member.isActive) {
      return 'INACTIVE';
    }

    return 'ACTIVE';
  }

  async getMemberById(memberId: string) {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      include: {
        gymMemberSubscriptions: {
          include: {
            membershipPlan: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async activateMember(
    memberId: string,
    request: { reason: string; notes?: string },
    performedBy: string,
  ) {
    const member = await this.getMemberById(memberId);
    const currentState = await this.getMemberState(member);

    // Validate current state - can only activate cancelled, expired, or inactive members
    if (
      currentState !== 'CANCELLED' &&
      currentState !== 'EXPIRED' &&
      currentState !== 'INACTIVE'
    ) {
      throw new BadRequestException(
        `Cannot activate member in ${currentState} state. Member must be cancelled, expired, or inactive.`,
      );
    }

    // Update member status
    const updatedMember = await this.prisma.user.update({
      where: { id: memberId },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // If there's a cancelled subscription, reactivate it
    const cancelledSubscription = member.gymMemberSubscriptions?.[0];
    if (cancelledSubscription && cancelledSubscription.status === 'CANCELLED') {
      await this.prisma.gymMemberSubscription.update({
        where: { id: cancelledSubscription.id },
        data: {
          status: 'ACTIVE',
          cancelledAt: null,
          cancellationReason: null,
          cancellationNotes: null,
        },
      });
    }

    // Create audit log
    await this.createAuditLog({
      memberId,
      action: 'ACCOUNT_ACTIVATED',
      reason: request.reason,
      notes: request.notes,
      previousState: currentState,
      newState: 'ACTIVE',
      performedBy,
      metadata: {
        subscriptionId: cancelledSubscription?.id,
        subscriptionStatus: cancelledSubscription?.status,
      },
    });

    return {
      success: true,
      message: 'Member activated successfully',
      member: updatedMember,
    };
  }

  async cancelMember(
    memberId: string,
    request: { reason: string; notes?: string },
    performedBy: string,
  ) {
    const member = await this.getMemberById(memberId);
    const currentState = await this.getMemberState(member);

    if (currentState !== 'ACTIVE' && currentState !== 'EXPIRED') {
      throw new BadRequestException(
        `Cannot cancel member in ${currentState} state. Only active or expired members can be cancelled.`,
      );
    }

    // Cancel current subscription if exists
    const activeSubscription = member.gymMemberSubscriptions?.[0];
    if (activeSubscription) {
      await this.prisma.gymMemberSubscription.update({
        where: { id: activeSubscription.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: request.reason,
          cancellationNotes: request.notes,
        },
      });
    }

    // Create audit log
    await this.createAuditLog({
      memberId,
      action: 'ACCOUNT_DEACTIVATED',
      reason: request.reason,
      notes: request.notes,
      previousState: currentState,
      newState: 'CANCELLED',
      performedBy,
      metadata: {
        subscriptionId: activeSubscription?.id,
        subscriptionEndDate: activeSubscription?.endDate,
      },
    });

    return {
      success: true,
      message: 'Member cancelled successfully',
    };
  }

  async renewMemberSubscription(
    memberId: string,
    planId: string,
    performedBy: string,
  ) {
    const member = await this.getMemberById(memberId);
    const currentState = await this.getMemberState(member);

    // Check for existing renewal on the same day to prevent duplicates
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    const existingTodayRenewal =
      await this.prisma.gymMemberSubscription.findFirst({
        where: {
          memberId: memberId,
          tenantId: member.tenantId!,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

    if (existingTodayRenewal) {
      throw new BadRequestException(
        'A membership renewal has already been processed for this member today. Please wait until tomorrow to process another renewal.',
      );
    }

    // Get the membership plan
    const membershipPlan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!membershipPlan) {
      throw new NotFoundException('Membership plan not found');
    }

    // Check for existing active subscription and expire it first
    const existingSubscription =
      await this.prisma.gymMemberSubscription.findFirst({
        where: {
          memberId: memberId,
          tenantId: member.tenantId!,
          status: 'ACTIVE',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    // If there's an active subscription, expire it first
    if (existingSubscription) {
      await this.prisma.gymMemberSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: 'EXPIRED',
          cancelledAt: new Date(),
          cancellationReason: 'renewed',
          cancellationNotes: 'Expired due to membership renewal',
        },
      });
    }

    // Calculate new dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + membershipPlan.duration);

    // Create new subscription
    const newSubscription = await this.prisma.gymMemberSubscription.create({
      data: {
        tenantId: member.tenantId!,
        memberId: memberId,
        membershipPlanId: planId,
        status: 'ACTIVE',
        startDate,
        endDate,
        price: membershipPlan.price,
        autoRenew: true,
      },
    });

    // Update member to active if not already
    await this.prisma.user.update({
      where: { id: memberId },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog({
      memberId,
      action: 'SUBSCRIPTION_RENEWED',
      reason: 'SUBSCRIPTION_RENEWED',
      previousState: currentState,
      newState: 'ACTIVE',
      performedBy,
      metadata: {
        planId,
        subscriptionId: newSubscription.id,
        planName: membershipPlan.name,
        duration: membershipPlan.duration,
        price: membershipPlan.price.toString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    return {
      success: true,
      message: 'Membership renewed successfully',
      subscription: newSubscription,
    };
  }

  async softDeleteMember(
    memberId: string,
    performedBy: string,
    actionData?: { reason: string; notes?: string },
  ) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(memberId)) {
        throw new BadRequestException('Invalid member ID format');
      }

      // Check if member exists and is not already deleted
      const existingMember = await this.prisma.user.findUnique({
        where: { id: memberId },
      });

      if (!existingMember) {
        throw new NotFoundException(`Member with ID '${memberId}' not found`);
      }

      if (existingMember.deletedAt) {
        throw new BadRequestException('Member is already deleted');
      }

      // Soft delete the member
      const deletedMember = await this.prisma.user.update({
        where: { id: memberId },
        data: {
          isActive: false,
          deletedAt: new Date(),
          deletedBy: performedBy,
          updatedAt: new Date(),
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      this.logger.log(
        `Soft deleted member: ${deletedMember.firstName} ${deletedMember.lastName} (${memberId})`,
      );

      // Create audit log for the deletion
      await this.createAuditLog({
        memberId,
        action: 'ACCOUNT_DELETED',
        reason: actionData?.reason || 'Administrative action',
        notes: actionData?.notes || 'Member account soft deleted',
        previousState: 'ACTIVE',
        newState: 'DELETED',
        performedBy,
        metadata: {
          deletedAt: deletedMember.deletedAt?.toISOString(),
          deletedBy: performedBy,
        },
      });

      return {
        success: true,
        message: 'Member deleted successfully',
        member: deletedMember,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to soft delete member ${memberId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to delete member. Please try again.',
      );
    }
  }

  async restoreMember(
    memberId: string,
    performedBy: string,
    actionData?: { reason: string; notes?: string },
  ) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(memberId)) {
        throw new BadRequestException('Invalid member ID format');
      }

      // Check if member exists and is deleted
      const existingMember = await this.prisma.user.findUnique({
        where: { id: memberId },
      });

      if (!existingMember) {
        throw new NotFoundException(`Member with ID '${memberId}' not found`);
      }

      if (!existingMember.deletedAt) {
        throw new BadRequestException('Member is not deleted');
      }

      // Restore the member
      const restoredMember = await this.prisma.user.update({
        where: { id: memberId },
        data: {
          isActive: true,
          deletedAt: null,
          deletedBy: null,
          updatedAt: new Date(),
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      this.logger.log(
        `Restored member: ${restoredMember.firstName} ${restoredMember.lastName} (${memberId})`,
      );

      // Create audit log for the restoration
      await this.createAuditLog({
        memberId,
        action: 'ACCOUNT_RESTORED',
        reason: actionData?.reason || 'Administrative action',
        notes: actionData?.notes || 'Member account restored',
        previousState: 'DELETED',
        newState: 'ACTIVE',
        performedBy,
        metadata: {
          restoredAt: new Date().toISOString(),
          restoredBy: performedBy,
        },
      });

      return {
        success: true,
        message: 'Member restored successfully',
        member: restoredMember,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to restore member ${memberId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to restore member. Please try again.',
      );
    }
  }

  async getMemberWithStatus(memberId: string) {
    const member = await this.getMemberById(memberId);
    const state = await this.getMemberState(member);

    // Get the active subscription if it exists
    const subscription = member.gymMemberSubscriptions?.[0] || null;

    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phoneNumber: member.phoneNumber,
      isActive: member.isActive,
      currentState: state,
      subscription: subscription,
    };
  }

  async getMemberHistory(
    memberId: string,
    query: {
      page?: number;
      limit?: number;
      category?: 'ACCOUNT' | 'SUBSCRIPTION' | 'PAYMENT' | 'ACCESS';
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { page = 1, limit = 50, category, startDate, endDate } = query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = { memberId };

    if (category) {
      // Filter by action category
      const categoryActions = {
        ACCOUNT: [
          'ACCOUNT_CREATED',
          'ACCOUNT_ACTIVATED',
          'ACCOUNT_DEACTIVATED',
          'ACCOUNT_DELETED',
          'ACCOUNT_RESTORED',
        ],
        SUBSCRIPTION: [
          'SUBSCRIPTION_STARTED',
          'SUBSCRIPTION_RENEWED',
          'SUBSCRIPTION_CANCELLED',
          'SUBSCRIPTION_EXPIRED',
          'SUBSCRIPTION_SUSPENDED',
          'SUBSCRIPTION_RESUMED',
        ],
        PAYMENT: ['PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED'],
        ACCESS: [
          'FACILITY_ACCESS_GRANTED',
          'FACILITY_ACCESS_REVOKED',
          'LOGIN_SUCCESSFUL',
          'LOGIN_FAILED',
        ],
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
              email: true,
            },
          },
        },
        orderBy: { performedAt: 'desc' },
        skip: offset,
        take: limit,
      }),

      this.prisma.memberAuditLog.count({ where }),
    ]);

    return {
      logs: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  getActionReasons() {
    return [
      {
        category: 'ACCOUNT',
        reasons: [
          'Member request',
          'Payment received',
          'System error resolved',
          'Administrative decision',
          'Policy compliance',
        ],
      },
      {
        category: 'SUBSCRIPTION',
        reasons: [
          'Member request',
          'Non-payment',
          'Policy violation',
          'System maintenance',
          'Membership transfer',
          'SUBSCRIPTION_RENEWED',
        ],
      },
    ];
  }

  async getExpiringGymMembers(tenantId: string, daysBefore: number = 30) {
    try {
      // Validate inputs
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      if (daysBefore < 0 || daysBefore > 365) {
        throw new BadRequestException('Days before must be between 0 and 365');
      }

      // Verify tenant exists and is a GYM
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
      }

      if (tenant.category !== 'GYM') {
        throw new BadRequestException(
          'Expiring memberships are only available for GYM tenants',
        );
      }

      // Calculate target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);

      // Query users with expiring memberships
      // Note: This queries the JSON businessData field for endDate
      const users = await this.prisma.user.findMany({
        where: {
          tenantId,
          isActive: true,
          // Query JSON field: businessData.endDate <= targetDate
          AND: [
            {
              businessData: {
                path: ['type'],
                equals: 'gym_member',
              },
            },
            {
              businessData: {
                path: ['endDate'],
                lte: targetDate.toISOString(),
              },
            },
          ],
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
              slug: true,
            },
          },
        },
        // Note: Ordering by JSON fields is limited in Prisma
        // We'll sort in application code instead
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(
        `Found ${users.length} expiring gym members for tenant ${tenant.name}`,
      );

      return users;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get expiring gym members: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve expiring gym members. Please try again.',
      );
    }
  }

  async getExpiringGymMembersWithNotifications(
    tenantId: string,
    daysBefore: number = 30,
  ) {
    try {
      const expiringMembers = await this.getExpiringGymMembers(
        tenantId,
        daysBefore,
      );

      // Prepare notification data
      const notificationData = expiringMembers.map((member) => {
        const businessData = member.businessData as any;
        const daysUntilExpiry = Math.ceil(
          (new Date(businessData.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        return {
          userId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          email: member.email,
          phoneNumber: member.phoneNumber,
          membershipType: businessData.membershipType,
          expirationDate: businessData.endDate,
          daysUntilExpiry,
          notificationType: daysUntilExpiry <= 0 ? 'expired' : 'expiring_soon',
        };
      });

      // TODO: Later integrate with NotificationsService
      // const notificationsSent = await this.notificationsService.sendExpirationNotifications(notificationData);

      // For now, just log what would be sent
      notificationData.forEach((notification) => {
        this.logger.log(
          `Would notify ${notification.memberName} (${notification.email}) - ${notification.notificationType} in ${notification.daysUntilExpiry} days`,
        );
      });

      return {
        expiringMembers,
        notificationData,
        notificationsSent: notificationData.length, // Placeholder
      };
    } catch (error) {
      this.logger.error(
        `Failed to prepare expiring member notifications: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to prepare expiring member notifications. Please try again.',
      );
    }
  }

  async getExpiringMembersCount(
    tenantId: string,
    daysBefore: number = 7,
    userContext?: any,
  ) {
    try {
      const currentDate = new Date();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);

      // Count expiring members with proper role-based branch filtering

      // Build base where clause - count both expiring AND recently expired members
      const whereClause: any = {
        tenantId,
        status: 'ACTIVE', // Only active subscriptions
        cancelledAt: null, // Exclude cancelled subscriptions (matches frontend logic)
        endDate: {
          lte: targetDate, // Show subscriptions expiring within the window (including those that just expired)
        },
        // Exclude subscriptions for deleted users
        member: {
          deletedAt: null,
          isActive: true, // Only active users
        },
      };

      // Apply role-based branch filtering if user context is provided
      if (userContext && userContext.role !== 'SUPER_ADMIN') {
        // Get user's branch access for non-super-admin users
        const userWithBranches = await this.prisma.user.findUnique({
          where: { id: userContext.userId },
          include: {
            gymUserBranches: {
              include: {
                branch: {
                  select: {
                    id: true,
                    name: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        });

        const gymUserBranchAccess = userWithBranches?.gymUserBranches || [];
        const accessibleBranchIds = gymUserBranchAccess.map(
          (ub) => ub.branchId,
        );

        if (userContext.role === 'MANAGER' || userContext.role === 'STAFF') {
          // Managers and Staff can only see branches they have access to
          if (accessibleBranchIds.length > 0) {
            whereClause.branchId = { in: accessibleBranchIds };
          } else {
            // No branch access = no results
            whereClause.branchId = { in: [] };
          }
        }
        // OWNER role sees all branches in their tenant (no additional filtering needed)
      }

      // Use the same logic as overview method - count unique customers with latest subscriptions
      // Get all customer IDs that match our criteria
      const matchingSubscriptions =
        await this.prisma.gymMemberSubscription.findMany({
          where: whereClause,
          select: {
            memberId: true,
            endDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

      // Group by customer and get only the most recent subscription per customer
      const customerLatestSubscriptions = new Map();
      matchingSubscriptions.forEach((sub) => {
        const existing = customerLatestSubscriptions.get(sub.memberId);
        if (!existing || sub.createdAt > existing.createdAt) {
          customerLatestSubscriptions.set(sub.memberId, sub);
        }
      });

      const count = customerLatestSubscriptions.size;

      return { count, daysBefore };
    } catch (error) {
      this.logger.error(
        `Failed to get expiring members count: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to get expiring members count',
      );
    }
  }

  async getExpiringMembersOverview(daysBefore: number = 7, filters: any) {
    try {
      // Validate filters
      if (!filters.page || isNaN(filters.page) || filters.page < 1) {
        filters.page = 1;
      }
      if (!filters.limit || isNaN(filters.limit) || filters.limit < 1) {
        filters.limit = 10;
      }

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);

      // Get user's branch access information
      const userId = filters.userId;
      let accessibleBranchIds: string[] = [];
      let availableBranches: any[] = [];
      let gymUserBranchAccess: any[] = [];

      if (filters.userRole !== 'SUPER_ADMIN') {
        // Get user's branch access for non-super-admin users
        const userWithBranches = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            gymUserBranches: {
              include: {
                branch: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        });

        gymUserBranchAccess = userWithBranches?.gymUserBranches || [];
        accessibleBranchIds = gymUserBranchAccess.map((ub) => ub.branchId);
      }

      // Build where clause based on user role - include both expiring AND recently expired
      const whereClause: any = {
        status: 'ACTIVE',
        cancelledAt: null, // Exclude cancelled subscriptions
        endDate: {
          lte: targetDate, // Show subscriptions expiring within the window (including those that just expired)
        },
        // Exclude subscriptions for deleted/inactive users
        member: {
          deletedAt: null,
          isActive: true,
        },
      };

      // Apply role-based filtering
      if (filters.userRole === 'SUPER_ADMIN') {
        // Super Admin can filter by specific tenant
        if (filters.tenantId) {
          whereClause.tenantId = filters.tenantId;

          // If tenant is specified, get available branches for filtering
          availableBranches = await this.prisma.branch.findMany({
            where: { tenantId: filters.tenantId, isActive: true },
            select: { id: true, name: true, address: true },
          });
        } else {
          // Get all tenants for grouping
          const allTenants = await this.prisma.tenant.findMany({
            select: { id: true, name: true, category: true },
          });
        }

        // Super admin can also filter by specific branch
        if (filters.branchId) {
          whereClause.branchId = filters.branchId;
        }
      } else if (filters.userRole === 'OWNER') {
        // Owners can see all branches in their tenant
        whereClause.tenantId = filters.userTenantId;

        // Get all branches in the tenant for branch filtering dropdown
        availableBranches = await this.prisma.branch.findMany({
          where: { tenantId: filters.userTenantId, isActive: true },
          select: { id: true, name: true, address: true },
        });

        // Owner can filter by specific branch
        if (filters.branchId) {
          whereClause.branchId = filters.branchId;
        }
      } else if (filters.userRole === 'MANAGER') {
        // Managers can see branches they have access to
        whereClause.tenantId = filters.userTenantId;

        if (accessibleBranchIds.length > 0) {
          if (
            filters.branchId &&
            accessibleBranchIds.includes(filters.branchId)
          ) {
            // Filter by specific branch if they have access
            whereClause.branchId = filters.branchId;
          } else if (!filters.branchId) {
            // Show all accessible branches by default
            whereClause.branchId = { in: accessibleBranchIds };
          } else {
            // Trying to access branch they don't have permission to
            whereClause.branchId = { in: [] }; // Return no results
          }
        } else {
          whereClause.branchId = { in: [] }; // Return no results
        }

        // Available branches for dropdown (only branches they have access to)
        availableBranches = gymUserBranchAccess.map((ub) => ({
          id: ub.branch.id,
          name: ub.branch.name,
          address: ub.branch.address,
        }));
      } else if (filters.userRole === 'STAFF') {
        // Staff can only see branches they're explicitly assigned to
        whereClause.tenantId = filters.userTenantId;

        if (accessibleBranchIds.length > 0) {
          if (
            filters.branchId &&
            accessibleBranchIds.includes(filters.branchId)
          ) {
            whereClause.branchId = filters.branchId;
          } else {
            // Show only branches they have access to
            whereClause.branchId = { in: accessibleBranchIds };
          }
        } else {
          whereClause.branchId = { in: [] }; // Return no results
        }

        // Available branches for dropdown
        availableBranches = gymUserBranchAccess.map((ub) => ({
          id: ub.branch.id,
          name: ub.branch.name,
          address: ub.branch.address,
        }));
      }

      // Add filter to exclude deleted and inactive users from the where clause
      whereClause.member = {
        deletedAt: null,
        isActive: true, // Only active users should appear in expiring list
      };

      this.logger.debug(
        `[OVERVIEW DEBUG] WhereClause:`,
        JSON.stringify(whereClause, null, 2),
      );
      this.logger.debug(
        `[OVERVIEW DEBUG] TargetDate: ${targetDate.toISOString()}, DaysBefore: ${daysBefore}`,
      );
      this.logger.debug(
        `[OVERVIEW DEBUG] User Role: ${filters.userRole}, Tenant: ${filters.userTenantId}`,
      );

      // Get only the most recent subscription per customer to avoid duplicates
      // First, get all customer IDs that match our criteria
      const matchingSubscriptions =
        await this.prisma.gymMemberSubscription.findMany({
          where: whereClause,
          select: {
            memberId: true,
            endDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

      // Group by customer and get only the most recent subscription per customer
      const customerLatestSubscriptions = new Map();
      matchingSubscriptions.forEach((sub) => {
        const existing = customerLatestSubscriptions.get(sub.memberId);
        if (!existing || sub.createdAt > existing.createdAt) {
          customerLatestSubscriptions.set(sub.memberId, sub);
        }
      });

      // Get the full subscription data for the latest subscriptions only
      const latestSubscriptionIds = Array.from(
        customerLatestSubscriptions.values(),
      ).map((sub) => ({
        memberId: sub.memberId,
        endDate: sub.endDate,
      }));

      // Apply pagination to the unique customers
      const paginatedLatestSubs = latestSubscriptionIds.slice(
        Math.max(0, (filters.page - 1) * filters.limit),
        Math.max(0, (filters.page - 1) * filters.limit) +
          Math.min(100, filters.limit),
      );

      const [subscriptions, totalCount] = await Promise.all([
        this.prisma.gymMemberSubscription.findMany({
          where: {
            ...whereClause,
            OR: paginatedLatestSubs.map((sub) => ({
              memberId: sub.memberId,
              endDate: sub.endDate,
            })),
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
            branch: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
          orderBy: { endDate: 'asc' },
        }),
        Promise.resolve(latestSubscriptionIds.length), // Use unique customer count
      ]);

      // Calculate days until expiry for each subscription
      const enrichedSubscriptions = subscriptions.map((subscription) => {
        const daysUntilExpiry = Math.ceil(
          (new Date(subscription.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        return {
          ...subscription,
          daysUntilExpiry,
          memberName:
            `${subscription.member.firstName} ${subscription.member.lastName}`.trim(),
          isExpired: daysUntilExpiry <= 0,
          urgency:
            daysUntilExpiry <= 1
              ? 'critical'
              : daysUntilExpiry <= 3
              ? 'high'
              : 'medium',
        };
      });

      // Group by tenant for Super Admin view
      const groupedByTenant =
        filters.userRole === 'SUPER_ADMIN'
          ? enrichedSubscriptions.reduce((acc, subscription) => {
              const tenantName = subscription.tenant.name;
              if (!acc[tenantName]) {
                acc[tenantName] = {
                  tenant: subscription.tenant,
                  members: [],
                  count: 0,
                };
              }
              acc[tenantName].members.push(subscription);
              acc[tenantName].count++;
              return acc;
            }, {} as any)
          : null;

      // Group by branch for Owner/Manager/Staff with multiple branches
      const groupedByBranch =
        filters.userRole !== 'SUPER_ADMIN' && availableBranches.length > 1
          ? enrichedSubscriptions.reduce((acc, subscription) => {
              const branchName =
                subscription.branch?.name || 'No Branch Assigned';
              const branchId = subscription.branch?.id || 'unassigned';
              if (!acc[branchName]) {
                acc[branchName] = {
                  branch: subscription.branch || {
                    id: 'unassigned',
                    name: 'No Branch Assigned',
                    address: null,
                  },
                  members: [],
                  count: 0,
                };
              }
              acc[branchName].members.push(subscription);
              acc[branchName].count++;
              return acc;
            }, {} as any)
          : null;

      return {
        subscriptions: enrichedSubscriptions,
        groupedByTenant,
        groupedByBranch,
        availableBranches, // For dropdown filtering
        userRole: filters.userRole,
        accessSummary: {
          totalAccessibleBranches: availableBranches.length,
          canFilterByBranch: availableBranches.length > 1,
          canFilterByTenant: filters.userRole === 'SUPER_ADMIN',
        },
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / filters.limit),
          hasNext: filters.page * filters.limit < totalCount,
          hasPrev: filters.page > 1,
        },
        summary: {
          totalExpiring: totalCount,
          daysBefore,
          critical: enrichedSubscriptions.filter(
            (s) => s.urgency === 'critical',
          ).length,
          high: enrichedSubscriptions.filter((s) => s.urgency === 'high')
            .length,
          medium: enrichedSubscriptions.filter((s) => s.urgency === 'medium')
            .length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get expiring members overview: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to get expiring members overview',
      );
    }
  }

  private async createAuditLog(data: {
    memberId: string;
    action: string;
    reason?: string;
    notes?: string;
    previousState?: string;
    newState?: string;
    performedBy?: string;
    metadata?: any;
  }) {
    try {
      const result = await this.prisma.memberAuditLog.create({
        data: {
          memberId: data.memberId,
          action: data.action as any,
          reason: data.reason,
          notes: data.notes,
          previousState: data.previousState,
          newState: data.newState,
          performedBy: data.performedBy,
          metadata: data.metadata,
        },
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      throw error;
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
