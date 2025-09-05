import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SubscriptionStatus, BillingCycle, Role } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get system-wide overview stats for Super Admins
   */
  async getSystemOverview() {
    const [
      totalTenants,
      totalBranches,
      totalUsers,
      totalActiveSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.branch.count(),
      this.prisma.user.count({
        where: { role: { not: Role.SUPER_ADMIN } },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESSFUL' },
        _sum: { amount: true },
      }),
    ]);

    // Get growth stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [newTenantsThisMonth, newBranchesThisMonth, newUsersThisMonth] =
      await Promise.all([
        this.prisma.tenant.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.branch.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.user.count({
          where: {
            createdAt: { gte: thirtyDaysAgo },
            role: { not: Role.SUPER_ADMIN },
          },
        }),
      ]);

    return {
      overview: {
        totalTenants,
        totalBranches,
        totalUsers,
        totalActiveSubscriptions,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      growth: {
        newTenantsThisMonth,
        newBranchesThisMonth,
        newUsersThisMonth,
      },
    };
  }

  /**
   * Get detailed branch statistics across all tenants
   */
  async getSystemBranchStats() {
    const branches = await this.prisma.branch.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
          },
        },
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          include: { plan: true },
        },
        _count: {
          select: {
            gymUserBranches: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const branchStats = branches.map((branch) => {
      const activeSubscription = branch.subscriptions[0];
      return {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        isActive: branch.isActive,
        createdAt: branch.createdAt,
        tenant: branch.tenant,
        memberCount: branch._count.gymUserBranches,
        subscription: activeSubscription
          ? {
              id: activeSubscription.id,
              plan: activeSubscription.plan,
              startDate: activeSubscription.startDate,
              endDate: activeSubscription.endDate,
              status: activeSubscription.status,
              daysRemaining: Math.max(
                0,
                Math.ceil(
                  (activeSubscription.endDate.getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              ),
            }
          : null,
      };
    });

    // Group by tenant category
    const byCategory = branchStats.reduce(
      (acc, branch) => {
        const category = branch.tenant.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(branch);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Get subscription status breakdown
    const subscriptionStatusBreakdown = {
      active: branchStats.filter(
        (b) => b.subscription?.status === SubscriptionStatus.ACTIVE,
      ).length,
      trial: branchStats.filter(
        (b) => b.subscription?.plan.billingCycle === BillingCycle.TRIAL,
      ).length,
      paid: branchStats.filter(
        (b) =>
          b.subscription?.plan.billingCycle !== BillingCycle.TRIAL &&
          b.subscription?.status === SubscriptionStatus.ACTIVE,
      ).length,
      noSubscription: branchStats.filter((b) => !b.subscription).length,
    };

    return {
      branches: branchStats,
      summary: {
        totalBranches: branchStats.length,
        activeBranches: branchStats.filter((b) => b.isActive).length,
        totalMembers: branchStats.reduce((sum, b) => sum + b.memberCount, 0),
        subscriptionBreakdown: subscriptionStatusBreakdown,
        byCategory,
      },
    };
  }

  /**
   * Get detailed member statistics across all tenants
   */
  async getSystemMemberStats() {
    const users = await this.prisma.user.findMany({
      where: {
        role: { not: Role.SUPER_ADMIN },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
          },
        },
        gymUserBranches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const memberStats = users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role || 'GYM_MEMBER',
      isActive: user.isActive,
      createdAt: user.createdAt,
      tenant: user.tenant,
      branches: user.gymUserBranches.map((ub) => ub.branch),
      branchCount: user.gymUserBranches.length,
    }));

    // Group by role
    const byRole = memberStats.reduce(
      (acc, user) => {
        const role = user.role;
        if (!acc[role]) {
          acc[role] = [];
        }
        acc[role].push(user);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Group by tenant category
    const byCategory = memberStats.reduce(
      (acc, user) => {
        if (user.tenant) {
          const category = user.tenant.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(user);
        }
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Get activity stats
    const activityStats = {
      totalUsers: memberStats.length,
      activeUsers: memberStats.filter((u) => u.isActive).length,
      inactiveUsers: memberStats.filter((u) => !u.isActive).length,
    };

    return {
      members: memberStats,
      summary: {
        ...activityStats,
        byRole: Object.entries(byRole).map(([role, users]) => ({
          role,
          count: users.length,
          active: users.filter((u) => u.isActive).length,
        })),
        byCategory: Object.entries(byCategory).map(([category, users]) => ({
          category,
          count: users.length,
          active: users.filter((u) => u.isActive).length,
        })),
      },
    };
  }

  /**
   * Get detailed staff statistics across all tenants (Super Admin only)
   */
  async getSystemStaffStats() {
    // Staff roles: OWNER, MANAGER, STAFF, and other non-member roles
    const staffRoles = [
      Role.OWNER,
      Role.MANAGER,
      Role.STAFF,
    ];

    const staff = await this.prisma.user.findMany({
      where: {
        role: { in: staffRoles },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
          },
        },
        gymUserBranches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const staffStats = staff.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role || 'GYM_MEMBER',
      isActive: user.isActive,
      createdAt: user.createdAt,
      tenant: user.tenant,
      branches: user.gymUserBranches.map((ub) => ub.branch),
      branchCount: user.gymUserBranches.length,
    }));

    // Group by role
    const byRole = staffStats.reduce(
      (acc, user) => {
        const role = user.role;
        if (!acc[role]) {
          acc[role] = [];
        }
        acc[role].push(user);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Group by tenant category
    const byCategory = staffStats.reduce(
      (acc, user) => {
        if (user.tenant) {
          const category = user.tenant.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(user);
        }
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Get activity stats
    const activityStats = {
      totalStaff: staffStats.length,
      activeStaff: staffStats.filter((u) => u.isActive).length,
      inactiveStaff: staffStats.filter((u) => !u.isActive).length,
    };

    return {
      staff: staffStats,
      summary: {
        ...activityStats,
        byRole: Object.entries(byRole).map(([role, users]) => ({
          role,
          count: users.length,
          active: users.filter((u) => u.isActive).length,
        })),
        byCategory: Object.entries(byCategory).map(([category, users]) => ({
          category,
          count: users.length,
          active: users.filter((u) => u.isActive).length,
        })),
      },
    };
  }

  /**
   * Get detailed subscription statistics across all tenants
   */
  async getSystemSubscriptionStats() {
    const subscriptions = await this.prisma.subscription.findMany({
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

    // Revenue breakdown
    const revenueByPlan = subscriptionStats.reduce(
      (acc, sub) => {
        const planName = sub.plan.name;
        if (!acc[planName]) {
          acc[planName] = { count: 0, revenue: 0 };
        }
        acc[planName].count += 1;
        acc[planName].revenue += sub.totalPayments;
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>,
    );

    // Status breakdown
    const statusBreakdown = subscriptions.reduce(
      (acc, sub) => {
        const status = sub.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Plan type breakdown
    const planBreakdown = subscriptions.reduce(
      (acc, sub) => {
        const cycle = sub.plan.billingCycle;
        acc[cycle] = (acc[cycle] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      subscriptions: subscriptionStats,
      summary: {
        totalSubscriptions: subscriptionStats.length,
        activeSubscriptions: subscriptionStats.filter(
          (s) => s.status === SubscriptionStatus.ACTIVE,
        ).length,
        totalRevenue: subscriptionStats.reduce(
          (sum, s) => sum + s.totalPayments,
          0,
        ),
        statusBreakdown,
        planBreakdown,
        revenueByPlan: Object.entries(revenueByPlan).map(([plan, data]) => ({
          plan,
          ...data,
        })),
      },
    };
  }

  /**
   * Get tenant-specific dashboard stats for Owners/Managers
   */
  async getTenantDashboard(tenantId: string) {
    const [tenant, branchCount, userCount, activeSubscriptions] =
      await Promise.all([
        this.prisma.tenant.findUnique({
          where: { id: tenantId },
          include: {
            branches: {
              include: {
                subscriptions: {
                  where: { status: SubscriptionStatus.ACTIVE },
                  include: { plan: true },
                },
                _count: {
                  select: { gymUserBranches: true },
                },
              },
            },
          },
        }),
        this.prisma.branch.count({ where: { tenantId } }),
        this.prisma.user.count({
          where: {
            tenantId,
            role: { not: Role.SUPER_ADMIN },
          },
        }),
        this.prisma.subscription.count({
          where: {
            branch: { tenantId },
            status: SubscriptionStatus.ACTIVE,
          },
        }),
      ]);

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const branchStats = tenant.branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      isActive: branch.isActive,
      memberCount: branch._count.gymUserBranches,
      subscription: branch.subscriptions[0] || null,
    }));

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        category: tenant.category,
        freeBranchOverride: tenant.freeBranchOverride,
      },
      summary: {
        totalBranches: branchCount,
        totalUsers: userCount,
        activeSubscriptions,
        totalMembers: branchStats.reduce((sum, b) => sum + b.memberCount, 0),
      },
      branches: branchStats,
    };
  }
}
