import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
} from '../../membership-plans/dto/membership-plan.dto';

@Injectable()
export class GymMembershipPlansService {
  constructor(private prisma: PrismaService) {}

  async createMembershipPlan(createDto: CreateMembershipPlanDto) {
    try {
      // Check if plan name already exists for this gym tenant
      const existingPlan = await this.prisma.membershipPlan.findUnique({
        where: {
          tenantId_name: {
            tenantId: createDto.tenantId!,
            name: createDto.name,
          },
        },
      });

      if (existingPlan) {
        throw new ConflictException(
          'A gym membership plan with this name already exists for this gym',
        );
      }

      // Verify tenant exists and is a gym business
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: createDto.tenantId! },
      });

      if (!tenant) {
        throw new NotFoundException('Gym tenant not found');
      }

      // TODO: Add business type validation when implemented
      // if (tenant.businessType !== 'gym') {
      //   throw new ForbiddenException('This endpoint is only for gym businesses');
      // }

      const createdPlan = await this.prisma.membershipPlan.create({
        data: {
          name: createDto.name,
          description: createDto.description,
          price: createDto.price,
          duration: createDto.duration,
          type: createDto.type,
          isActive: createDto.isActive ?? true,
          tenantId: createDto.tenantId!,
          benefits: createDto.benefits
            ? JSON.stringify(createDto.benefits)
            : undefined,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        ...createdPlan,
        benefits: createdPlan.benefits
          ? JSON.parse(createdPlan.benefits as string)
          : [],
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new ConflictException('Failed to create gym membership plan');
    }
  }

  async findAllByTenant(tenantId: string) {
    // TODO: Add business type validation
    const plans = await this.prisma.membershipPlan.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get member counts for each plan from both modern subscriptions and legacy users
    const planIds = plans.map(plan => plan.id);
    
    // Count from modern gym member subscriptions
    const modernSubscriptionCounts = await this.prisma.gymMemberSubscription.groupBy({
      by: ['membershipPlanId'],
      where: {
        membershipPlanId: { in: planIds },
        tenantId,
        status: 'ACTIVE',
        cancelledAt: null,
      },
      _count: {
        membershipPlanId: true,
      },
    });

    // Count from legacy user businessData (for backward compatibility)
    const usersWithMemberships = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: 'CLIENT',
        businessData: {
          path: ['membership'],
          not: Prisma.DbNull,
        },
      },
      select: {
        businessData: true,
      },
    });

    // Create a map of plan ID to member count
    const memberCountMap = new Map<string, number>();
    
    // Add modern subscription counts
    modernSubscriptionCounts.forEach((count) => {
      memberCountMap.set(count.membershipPlanId, count._count.membershipPlanId);
    });
    
    // Add legacy user counts
    usersWithMemberships.forEach((user) => {
      const membership = user.businessData as any;
      if (membership?.membership?.planId && planIds.includes(membership.membership.planId)) {
        const planId = membership.membership.planId;
        const currentCount = memberCountMap.get(planId) || 0;
        memberCountMap.set(planId, currentCount + 1);
      }
    });

    return plans.map((plan) => ({
      ...plan,
      benefits: plan.benefits ? JSON.parse(plan.benefits as string) : [],
      memberCount: memberCountMap.get(plan.id) || 0,
    }));
  }

  async findAllActive(tenantId: string) {
    const plans = await this.prisma.membershipPlan.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { price: 'asc' },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get member counts for each plan
    const planIds = plans.map(plan => plan.id);
    
    // Count from modern gym member subscriptions
    const modernSubscriptionCounts = await this.prisma.gymMemberSubscription.groupBy({
      by: ['membershipPlanId'],
      where: {
        membershipPlanId: { in: planIds },
        tenantId,
        status: 'ACTIVE',
        cancelledAt: null,
      },
      _count: {
        membershipPlanId: true,
      },
    });

    // Count from legacy user businessData
    const usersWithMemberships = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: 'CLIENT',
        businessData: {
          path: ['membership'],
          not: Prisma.DbNull,
        },
      },
      select: {
        businessData: true,
      },
    });

    // Create member count map
    const memberCountMap = new Map<string, number>();
    modernSubscriptionCounts.forEach((count) => {
      memberCountMap.set(count.membershipPlanId, count._count.membershipPlanId);
    });
    usersWithMemberships.forEach((user) => {
      const membership = user.businessData as any;
      if (membership?.membership?.planId && planIds.includes(membership.membership.planId)) {
        const planId = membership.membership.planId;
        const currentCount = memberCountMap.get(planId) || 0;
        memberCountMap.set(planId, currentCount + 1);
      }
    });

    return plans.map((plan) => ({
      ...plan,
      benefits: plan.benefits ? JSON.parse(plan.benefits as string) : [],
      memberCount: memberCountMap.get(plan.id) || 0,
    }));
  }

  async findOne(id: string, tenantId: string) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Gym membership plan not found');
    }

    return {
      ...plan,
      benefits: plan.benefits ? JSON.parse(plan.benefits as string) : [],
    };
  }

  async update(
    id: string,
    tenantId: string,
    updateDto: UpdateMembershipPlanDto,
  ) {
    // Verify the plan exists and belongs to the gym tenant
    const existingPlan = await this.findOne(id, tenantId);

    // Check for name conflicts if name is being updated
    if (updateDto.name && updateDto.name !== existingPlan.name) {
      const conflictingPlan = await this.prisma.membershipPlan.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: updateDto.name,
          },
        },
      });

      if (conflictingPlan) {
        throw new ConflictException(
          'A gym membership plan with this name already exists for this gym',
        );
      }
    }

    const updatedPlan = await this.prisma.membershipPlan.update({
      where: { id },
      data: {
        ...updateDto,
        benefits: updateDto.benefits
          ? JSON.stringify(updateDto.benefits)
          : undefined,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ...updatedPlan,
      benefits: updatedPlan.benefits
        ? JSON.parse(updatedPlan.benefits as string)
        : [],
    };
  }

  async toggleStatus(id: string, tenantId: string) {
    const plan = await this.findOne(id, tenantId);

    const updatedPlan = await this.prisma.membershipPlan.update({
      where: { id },
      data: { isActive: !plan.isActive },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ...updatedPlan,
      benefits: updatedPlan.benefits
        ? JSON.parse(updatedPlan.benefits as string)
        : [],
    };
  }

  async remove(id: string, tenantId: string) {
    // Verify the plan exists and belongs to the gym tenant
    await this.findOne(id, tenantId);

    // Check if any gym members have active subscriptions using this plan
    const activeSubscriptions = await this.prisma.gymMemberSubscription.findFirst({
      where: {
        membershipPlanId: id,
        tenantId,
        status: 'ACTIVE',
        // Exclude cancelled subscriptions
        cancelledAt: null,
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (activeSubscriptions) {
      throw new ConflictException(
        `Cannot delete gym membership plan that has active subscriptions. Member: ${activeSubscriptions.member.firstName} ${activeSubscriptions.member.lastName} (${activeSubscriptions.member.email}) has an active subscription using this plan.`,
      );
    }

    return this.prisma.membershipPlan.delete({
      where: { id },
    });
  }

  async getStats(tenantId: string) {
    const [total, active, inactive] = await Promise.all([
      this.prisma.membershipPlan.count({ where: { tenantId } }),
      this.prisma.membershipPlan.count({ where: { tenantId, isActive: true } }),
      this.prisma.membershipPlan.count({
        where: { tenantId, isActive: false },
      }),
    ]);

    // Get usage stats from GymMemberSubscription table (modern approach)
    const modernUsageCount = await this.prisma.gymMemberSubscription.groupBy({
      by: ['membershipPlanId'],
      where: {
        tenantId,
        member: {
          role: 'CLIENT',
        },
      },
      _count: {
        membershipPlanId: true,
      },
    });

    // Get usage stats from legacy User businessData for backward compatibility
    const legacyMembershipUsage = await this.prisma.user.groupBy({
      by: ['businessData'],
      where: {
        tenantId,
        role: 'CLIENT',
        businessData: {
          path: ['membership'],
          not: Prisma.DbNull,
        },
      },
      _count: {
        id: true,
      },
    });

    return {
      total,
      active,
      inactive,
      usageCount: modernUsageCount.length,
      legacyUsageCount: legacyMembershipUsage.length,
    };
  }
}
