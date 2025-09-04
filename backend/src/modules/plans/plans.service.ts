import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async getAllPlans() {
    const plans = await this.prisma.plan.findMany({
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: SubscriptionStatus.ACTIVE },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      plans: plans.map((plan) => ({
        ...plan,
        activeSubscriptions: plan._count.subscriptions,
      })),
    };
  }

  async getActivePlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: SubscriptionStatus.ACTIVE },
            },
          },
        },
      },
      orderBy: { price: 'asc' },
    });

    return {
      plans: plans.map((plan) => ({
        ...plan,
        activeSubscriptions: plan._count.subscriptions,
      })),
    };
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
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
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to recent subscriptions
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return {
      ...plan,
      totalSubscriptions: plan._count.subscriptions,
      activeSubscriptions: plan.subscriptions.filter(
        (s) => s.status === SubscriptionStatus.ACTIVE,
      ).length,
    };
  }

  async createPlan(createPlanDto: CreatePlanDto) {
    // Check if plan with same name already exists
    const existingPlan = await this.prisma.plan.findUnique({
      where: { name: createPlanDto.name },
    });

    if (existingPlan) {
      throw new ConflictException('A plan with this name already exists');
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: createPlanDto.name,
        price: createPlanDto.price,
        billingCycle: createPlanDto.billingCycle,
        description: createPlanDto.description || '',
        isActive:
          createPlanDto.isActive !== undefined ? createPlanDto.isActive : true,
      },
    });

    return plan;
  }

  async updatePlan(id: string, updatePlanDto: UpdatePlanDto) {
    const existingPlan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      throw new NotFoundException('Plan not found');
    }

    // Check if updating name would cause conflict
    if (updatePlanDto.name && updatePlanDto.name !== existingPlan.name) {
      const conflictingPlan = await this.prisma.plan.findUnique({
        where: { name: updatePlanDto.name },
      });

      if (conflictingPlan) {
        throw new ConflictException('A plan with this name already exists');
      }
    }

    const updatedPlan = await this.prisma.plan.update({
      where: { id },
      data: updatePlanDto,
    });

    return updatedPlan;
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Prevent deletion if there are active subscriptions
    if (plan.subscriptions.length > 0) {
      throw new BadRequestException(
        `Cannot delete plan with ${plan.subscriptions.length} active subscription(s). ` +
          'Please deactivate the plan instead or wait for subscriptions to expire.',
      );
    }

    await this.prisma.plan.delete({
      where: { id },
    });

    return { message: 'Plan deleted successfully' };
  }

  async togglePlanStatus(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const updatedPlan = await this.prisma.plan.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });

    return {
      ...updatedPlan,
      message: `Plan ${updatedPlan.isActive ? 'activated' : 'deactivated'} successfully`,
    };
  }

  async getPlanSubscriptions(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where: { planId: id },
      include: {
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

    // Calculate summary stats
    const summary = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(
        (s) => s.status === SubscriptionStatus.ACTIVE,
      ).length,
      expiredSubscriptions: subscriptions.filter((s) => s.endDate <= new Date())
        .length,
      totalRevenue: subscriptionStats.reduce(
        (sum, s) => sum + s.totalPayments,
        0,
      ),
      averageSubscriptionDuration:
        subscriptions.length > 0
          ? Math.round(
              subscriptions.reduce((sum, s) => {
                const duration = Math.ceil(
                  (s.endDate.getTime() - s.startDate.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                return sum + duration;
              }, 0) / subscriptions.length,
            )
          : 0,
    };

    return {
      plan,
      subscriptions: subscriptionStats,
      summary,
    };
  }
}
