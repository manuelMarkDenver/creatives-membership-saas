import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AnalyticsQueryDto, TimePeriod } from './dto/analytics-query.dto';
import {
  RevenueMetricsDto,
  BranchPerformanceDto,
  MemberGrowthStatsDto,
  OwnerInsightsDto,
  RevenueByPlanDto,
  RevenueByBranchDto,
  RevenueTimelineDto,
  PaymentMethodBreakdownDto,
  MemberTimelineDto,
  TopPerformingPlanDto,
  PeakPeriodDto,
  RevenueForecastDto,
} from './dto/analytics-response.dto';

@Injectable()
export class GymAnalyticsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(period: TimePeriod, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case TimePeriod.TODAY:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case TimePeriod.THIS_WEEK:
        const dayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        break;
      case TimePeriod.THIS_MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case TimePeriod.THIS_YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case TimePeriod.CUSTOM:
        start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
        end = endDate ? new Date(endDate) : now;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
  }

  private getPreviousPeriodRange(start: Date, end: Date) {
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start.getTime() - duration);
    return { start: prevStart, end: prevEnd };
  }

  async getRevenueMetrics(tenantId: string, query: AnalyticsQueryDto): Promise<RevenueMetricsDto> {
    const { start, end } = this.getDateRange(query.period || TimePeriod.THIS_MONTH, query.startDate, query.endDate);
    const { start: prevStart, end: prevEnd } = this.getPreviousPeriodRange(start, end);

    const whereClause: any = {
      tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      status: 'COMPLETED',
    };

    const prevWhereClause: any = {
      tenantId,
      createdAt: {
        gte: prevStart,
        lte: prevEnd,
      },
      status: 'COMPLETED',
    };

    const [currentTransactions, previousTransactions, revenueByPlan, revenueByBranch, timeline, paymentMethods, memberCount] = await Promise.all([
      this.prisma.customerTransaction.aggregate({
        where: whereClause,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.customerTransaction.aggregate({
        where: prevWhereClause,
        _sum: { amount: true },
      }),
      this.getRevenueByPlan(tenantId, start, end, query.branchId),
      this.getRevenueByBranch(tenantId, start, end),
      this.getRevenueTimeline(tenantId, start, end, query.branchId),
      this.getPaymentMethodBreakdown(tenantId, start, end, query.branchId),
      this.getActiveMemberCount(tenantId, query.branchId),
    ]);

    const totalRevenue = currentTransactions._sum.amount?.toNumber() || 0;
    const previousPeriodRevenue = previousTransactions._sum.amount?.toNumber() || 0;
    const growthAmount = totalRevenue - previousPeriodRevenue;
    const growthRate = previousPeriodRevenue > 0 ? (growthAmount / previousPeriodRevenue) * 100 : 0;
    const averageRevenuePerMember = memberCount > 0 ? totalRevenue / memberCount : 0;

    return {
      totalRevenue,
      previousPeriodRevenue,
      growthRate,
      growthAmount,
      averageRevenuePerMember,
      revenueByPlan,
      revenueByBranch,
      revenueTimeline: timeline,
      paymentMethodBreakdown: paymentMethods,
    };
  }

  private async getRevenueByPlan(tenantId: string, start: Date, end: Date, branchId?: string): Promise<RevenueByPlanDto[]> {
    const subscriptions = await this.prisma.gymMemberSubscription.findMany({
      where: {
        tenantId,
        startDate: { gte: start, lte: end },
        ...(branchId ? { branchId } : {}),
      },
      include: {
        gymMembershipPlan: true,
      },
    });

    const planMap = new Map<string, { name: string; revenue: number; count: number }>();
    let totalRevenue = 0;

    subscriptions.forEach((sub) => {
      const plan = sub.gymMembershipPlan;
      const revenue = sub.price.toNumber();
      totalRevenue += revenue;

      const existing = planMap.get(plan.id);
      if (existing) {
        existing.revenue += revenue;
        existing.count += 1;
      } else {
        planMap.set(plan.id, { name: plan.name, revenue, count: 1 });
      }
    });

    return Array.from(planMap.entries()).map(([planId, data]) => ({
      planId,
      planName: data.name,
      revenue: data.revenue,
      memberCount: data.count,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }));
  }

  private async getRevenueByBranch(tenantId: string, start: Date, end: Date): Promise<RevenueByBranchDto[]> {
    const transactions = await this.prisma.customerTransaction.findMany({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
        status: 'COMPLETED',
        gymMemberSubscriptionId: { not: null },
      },
      include: {
        gymMemberSubscription: {
          include: {
            branch: true,
          },
        },
      },
    });

    const branchMap = new Map<string, { name: string; revenue: number; memberIds: Set<string> }>();

    transactions.forEach((t) => {
      if (t.gymMemberSubscription?.branch) {
        const branch = t.gymMemberSubscription.branch;
        const revenue = t.amount.toNumber();

        const existing = branchMap.get(branch.id);
        if (existing) {
          existing.revenue += revenue;
          existing.memberIds.add(t.customerId);
        } else {
          branchMap.set(branch.id, {
            name: branch.name,
            revenue,
            memberIds: new Set([t.customerId]),
          });
        }
      }
    });

    return Array.from(branchMap.entries()).map(([branchId, data]) => ({
      branchId,
      branchName: data.name,
      revenue: data.revenue,
      memberCount: data.memberIds.size,
      averageRevenuePerMember: data.memberIds.size > 0 ? data.revenue / data.memberIds.size : 0,
    }));
  }

  private async getRevenueTimeline(tenantId: string, start: Date, end: Date, branchId?: string): Promise<RevenueTimelineDto[]> {
    const whereClause: any = {
      tenantId,
      createdAt: { gte: start, lte: end },
      status: 'COMPLETED',
    };

    if (branchId) {
      whereClause.gymMemberSubscription = { branchId };
    }

    const transactions = await this.prisma.customerTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    const timelineMap = new Map<string, { revenue: number; count: number }>();

    transactions.forEach((t) => {
      const date = t.createdAt.toISOString().split('T')[0];
      const revenue = t.amount.toNumber();

      const existing = timelineMap.get(date);
      if (existing) {
        existing.revenue += revenue;
        existing.count += 1;
      } else {
        timelineMap.set(date, { revenue, count: 1 });
      }
    });

    return Array.from(timelineMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      transactionCount: data.count,
    }));
  }

  private async getPaymentMethodBreakdown(tenantId: string, start: Date, end: Date, branchId?: string): Promise<PaymentMethodBreakdownDto[]> {
    const whereClause: any = {
      tenantId,
      createdAt: { gte: start, lte: end },
      status: 'COMPLETED',
    };

    if (branchId) {
      whereClause.gymMemberSubscription = { branchId };
    }

    const transactions = await this.prisma.customerTransaction.findMany({
      where: whereClause,
    });

    const methodMap = new Map<string, { amount: number; count: number }>();
    let totalAmount = 0;

    transactions.forEach((t) => {
      const method = t.paymentMethod || 'UNKNOWN';
      const amount = t.amount.toNumber();
      totalAmount += amount;

      const existing = methodMap.get(method);
      if (existing) {
        existing.amount += amount;
        existing.count += 1;
      } else {
        methodMap.set(method, { amount, count: 1 });
      }
    });

    return Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }));
  }

  private async getActiveMemberCount(tenantId: string, branchId?: string): Promise<number> {
    const whereClause: any = {
      tenantId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    return this.prisma.gymMemberSubscription.count({ where: whereClause });
  }

  async getBranchPerformance(tenantId: string, query: AnalyticsQueryDto): Promise<BranchPerformanceDto[]> {
    const { start, end } = this.getDateRange(query.period || TimePeriod.THIS_MONTH, query.startDate, query.endDate);

    const branches = await this.prisma.branch.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        _count: {
          select: {
            gymUserBranches: true,
          },
        },
      },
    });

    const branchPerformancePromises = branches.map(async (branch) => {
      const [totalMembers, activeMembers, expiredMembers, newMembers, revenue] = await Promise.all([
        this.prisma.gymMemberSubscription.count({
          where: { branchId: branch.id, tenantId },
        }),
        this.prisma.gymMemberSubscription.count({
          where: {
            branchId: branch.id,
            tenantId,
            status: 'ACTIVE',
            endDate: { gte: new Date() },
          },
        }),
        this.prisma.gymMemberSubscription.count({
          where: {
            branchId: branch.id,
            tenantId,
            status: 'EXPIRED',
          },
        }),
        this.prisma.gymMemberSubscription.count({
          where: {
            branchId: branch.id,
            tenantId,
            startDate: { gte: start, lte: end },
          },
        }),
        this.prisma.customerTransaction.aggregate({
          where: {
            tenantId,
            createdAt: { gte: start, lte: end },
            status: 'COMPLETED',
            gymMemberSubscription: { branchId: branch.id },
          },
          _sum: { amount: true },
        }),
      ]);

      const totalRevenue = revenue._sum.amount?.toNumber() || 0;
      const averageRevenuePerMember = activeMembers > 0 ? totalRevenue / activeMembers : 0;
      const activeSubscriptionRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;
      const retentionRate = totalMembers > 0 ? ((totalMembers - expiredMembers) / totalMembers) * 100 : 0;

      const prevPeriod = this.getPreviousPeriodRange(start, end);
      const prevMembers = await this.prisma.gymMemberSubscription.count({
        where: {
          branchId: branch.id,
          tenantId,
          startDate: { gte: prevPeriod.start, lte: prevPeriod.end },
        },
      });

      const memberGrowthRate = prevMembers > 0 ? ((newMembers - prevMembers) / prevMembers) * 100 : 0;

      return {
        branchId: branch.id,
        branchName: branch.name,
        totalMembers,
        activeMembers,
        expiredMembers,
        newMembersThisPeriod: newMembers,
        totalRevenue,
        averageRevenuePerMember,
        activeSubscriptionRate,
        memberGrowthRate,
        retentionRate,
        rank: 0,
      };
    });

    const performances = await Promise.all(branchPerformancePromises);
    performances.sort((a, b) => b.totalRevenue - a.totalRevenue);
    performances.forEach((p, index) => (p.rank = index + 1));

    return performances;
  }

  async getMemberGrowthStats(tenantId: string, query: AnalyticsQueryDto): Promise<MemberGrowthStatsDto> {
    const { start, end } = this.getDateRange(query.period || TimePeriod.THIS_MONTH, query.startDate, query.endDate);

    const whereClause: any = { tenantId };
    if (query.branchId) {
      whereClause.branchId = query.branchId;
    }

    const [totalMembers, activeMembers, expiredMembers, cancelledMembers, newMembers, timeline] = await Promise.all([
      this.prisma.gymMemberSubscription.count({ where: whereClause }),
      this.prisma.gymMemberSubscription.count({
        where: { ...whereClause, status: 'ACTIVE', endDate: { gte: new Date() } },
      }),
      this.prisma.gymMemberSubscription.count({
        where: { ...whereClause, status: 'EXPIRED' },
      }),
      this.prisma.gymMemberSubscription.count({
        where: { ...whereClause, status: 'CANCELLED' },
      }),
      this.prisma.gymMemberSubscription.count({
        where: { ...whereClause, startDate: { gte: start, lte: end } },
      }),
      this.getMemberTimeline(tenantId, start, end, query.branchId),
    ]);

    const churnedMembers = expiredMembers + cancelledMembers;
    const churnRate = totalMembers > 0 ? (churnedMembers / totalMembers) * 100 : 0;
    const retentionRate = totalMembers > 0 ? ((totalMembers - churnedMembers) / totalMembers) * 100 : 0;

    const prevPeriod = this.getPreviousPeriodRange(start, end);
    const prevTotalMembers = await this.prisma.gymMemberSubscription.count({
      where: { ...whereClause, createdAt: { lte: prevPeriod.end } },
    });

    const growthRate = prevTotalMembers > 0 ? ((totalMembers - prevTotalMembers) / prevTotalMembers) * 100 : 0;

    const totalRevenue = await this.prisma.customerTransaction.aggregate({
      where: {
        tenantId,
        status: 'COMPLETED',
        gymMemberSubscription: query.branchId ? { branchId: query.branchId } : { isNot: null },
      },
      _sum: { amount: true },
    });

    const memberLifetimeValue = activeMembers > 0 ? (totalRevenue._sum.amount?.toNumber() || 0) / activeMembers : 0;

    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      cancelledMembers,
      newMembers,
      churnedMembers,
      churnRate,
      growthRate,
      retentionRate,
      memberLifetimeValue,
      timeline,
    };
  }

  private async getMemberTimeline(tenantId: string, start: Date, end: Date, branchId?: string): Promise<MemberTimelineDto[]> {
    const whereClause: any = { tenantId };
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const subscriptions = await this.prisma.gymMemberSubscription.findMany({
      where: {
        ...whereClause,
        startDate: { gte: start, lte: end },
      },
      orderBy: { startDate: 'asc' },
    });

    const timelineMap = new Map<string, { new: number; active: number; expired: number; cancelled: number }>();

    subscriptions.forEach((sub) => {
      const date = sub.startDate.toISOString().split('T')[0];
      const existing = timelineMap.get(date) || { new: 0, active: 0, expired: 0, cancelled: 0 };

      existing.new += 1;
      if (sub.status === 'ACTIVE') existing.active += 1;
      if (sub.status === 'EXPIRED') existing.expired += 1;
      if (sub.status === 'CANCELLED') existing.cancelled += 1;

      timelineMap.set(date, existing);
    });

    return Array.from(timelineMap.entries()).map(([date, data]) => ({
      date,
      newMembers: data.new,
      activeMembers: data.active,
      expiredMembers: data.expired,
      cancelledMembers: data.cancelled,
    }));
  }

  async getOwnerInsights(tenantId: string, query: AnalyticsQueryDto): Promise<OwnerInsightsDto> {
    const { start, end } = this.getDateRange(query.period || TimePeriod.THIS_MONTH, query.startDate, query.endDate);

    const [collectionRate, avgSubscriptionValue, renewalRate, topPlans, peakPeriods, forecasts] = await Promise.all([
      this.calculateCollectionRate(tenantId, start, end, query.branchId),
      this.calculateAverageSubscriptionValue(tenantId, query.branchId),
      this.calculateRenewalRate(tenantId, start, end, query.branchId),
      this.getTopPerformingPlans(tenantId, start, end, query.branchId),
      this.getPeakSignupPeriods(tenantId, start, end, query.branchId),
      this.getRevenueForecasts(tenantId, query.branchId),
    ]);

    return {
      collectionRate,
      averageSubscriptionValue: avgSubscriptionValue,
      subscriptionRenewalRate: renewalRate,
      topPerformingPlans: topPlans,
      peakSignupPeriods: peakPeriods,
      revenueForecasts: forecasts,
    };
  }

  private async calculateCollectionRate(tenantId: string, start: Date, end: Date, branchId?: string): Promise<number> {
    const whereClause: any = {
      tenantId,
      startDate: { gte: start, lte: end },
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    const [expectedRevenue, actualRevenue] = await Promise.all([
      this.prisma.gymMemberSubscription.aggregate({
        where: whereClause,
        _sum: { price: true },
      }),
      this.prisma.customerTransaction.aggregate({
        where: {
          tenantId,
          createdAt: { gte: start, lte: end },
          status: 'COMPLETED',
          gymMemberSubscriptionId: branchId ? undefined : { not: null },
          ...(branchId ? { gymMemberSubscription: { branchId } } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    const expected = expectedRevenue._sum.price?.toNumber() || 0;
    const actual = actualRevenue._sum.amount?.toNumber() || 0;

    return expected > 0 ? (actual / expected) * 100 : 0;
  }

  private async calculateAverageSubscriptionValue(tenantId: string, branchId?: string): Promise<number> {
    const whereClause: any = {
      tenantId,
      status: 'ACTIVE',
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    const result = await this.prisma.gymMemberSubscription.aggregate({
      where: whereClause,
      _avg: { price: true },
    });

    return result._avg.price?.toNumber() || 0;
  }

  private async calculateRenewalRate(tenantId: string, start: Date, end: Date, branchId?: string): Promise<number> {
    const whereClause: any = {
      tenantId,
      endDate: { gte: start, lte: end },
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    const expiredSubs = await this.prisma.gymMemberSubscription.findMany({
      where: whereClause,
    });

    const totalExpired = expiredSubs.length;
    
    const memberIds = expiredSubs.map(sub => sub.memberId);
    const renewedSubs = await this.prisma.gymMemberSubscription.count({
      where: {
        memberId: { in: memberIds },
        startDate: { gt: end },
      },
    });

    return totalExpired > 0 ? (renewedSubs / totalExpired) * 100 : 0;
  }

  private async getTopPerformingPlans(tenantId: string, start: Date, end: Date, branchId?: string): Promise<TopPerformingPlanDto[]> {
    const whereClause: any = {
      tenantId,
      createdAt: { gte: start, lte: end },
      status: 'COMPLETED',
      gymMemberSubscriptionId: { not: null },
    };

    if (branchId) {
      whereClause.gymMemberSubscription = { branchId };
    }

    const transactions = await this.prisma.customerTransaction.findMany({
      where: whereClause,
      include: {
        gymMemberSubscription: {
          include: {
            gymMembershipPlan: true,
          },
        },
      },
    });

    const planMap = new Map<string, { name: string; revenue: number; count: number; renewals: number }>();

    transactions.forEach((t) => {
      if (t.gymMemberSubscription?.gymMembershipPlan) {
        const plan = t.gymMemberSubscription.gymMembershipPlan;
        const revenue = t.amount.toNumber();

        const existing = planMap.get(plan.id);
        if (existing) {
          existing.revenue += revenue;
          existing.count += 1;
        } else {
          planMap.set(plan.id, { name: plan.name, revenue, count: 1, renewals: 0 });
        }
      }
    });

    return Array.from(planMap.entries())
      .map(([planId, data]) => ({
        planId,
        planName: data.name,
        revenue: data.revenue,
        memberCount: data.count,
        renewalRate: 0,
        averageValue: data.count > 0 ? data.revenue / data.count : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  private async getPeakSignupPeriods(tenantId: string, start: Date, end: Date, branchId?: string): Promise<PeakPeriodDto[]> {
    const whereClause: any = {
      tenantId,
      startDate: { gte: start, lte: end },
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    const subscriptions = await this.prisma.gymMemberSubscription.findMany({
      where: whereClause,
      include: {
        customerTransactions: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    const dayOfWeekMap = new Map<string, { count: number; revenue: number }>();
    const dayOfMonthMap = new Map<string, { count: number; revenue: number }>();

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    subscriptions.forEach((sub) => {
      const date = new Date(sub.startDate);
      const dayOfWeek = daysOfWeek[date.getDay()];
      const dayOfMonth = date.getDate().toString();
      const revenue = sub.customerTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);

      const existingDayOfWeek = dayOfWeekMap.get(dayOfWeek) || { count: 0, revenue: 0 };
      existingDayOfWeek.count += 1;
      existingDayOfWeek.revenue += revenue;
      dayOfWeekMap.set(dayOfWeek, existingDayOfWeek);

      const existingDayOfMonth = dayOfMonthMap.get(dayOfMonth) || { count: 0, revenue: 0 };
      existingDayOfMonth.count += 1;
      existingDayOfMonth.revenue += revenue;
      dayOfMonthMap.set(dayOfMonth, existingDayOfMonth);
    });

    const dayOfWeekPeaks = Array.from(dayOfWeekMap.entries())
      .map(([period, data]) => ({
        period,
        signupCount: data.count,
        revenue: data.revenue,
        type: 'day_of_week' as const,
      }))
      .sort((a, b) => b.signupCount - a.signupCount)
      .slice(0, 3);

    const dayOfMonthPeaks = Array.from(dayOfMonthMap.entries())
      .map(([period, data]) => ({
        period: `Day ${period}`,
        signupCount: data.count,
        revenue: data.revenue,
        type: 'day_of_month' as const,
      }))
      .sort((a, b) => b.signupCount - a.signupCount)
      .slice(0, 3);

    return [...dayOfWeekPeaks, ...dayOfMonthPeaks];
  }

  private async getRevenueForecasts(tenantId: string, branchId?: string): Promise<RevenueForecastDto[]> {
    const whereClause: any = {
      tenantId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    const activeSubs = await this.prisma.gymMemberSubscription.findMany({
      where: whereClause,
      orderBy: { endDate: 'asc' },
    });

    const forecastMap = new Map<string, { revenue: number; count: number }>();

    activeSubs.forEach((sub) => {
      const endDate = sub.endDate.toISOString().split('T')[0];
      const revenue = sub.price.toNumber();

      const existing = forecastMap.get(endDate);
      if (existing) {
        existing.revenue += revenue;
        existing.count += 1;
      } else {
        forecastMap.set(endDate, { revenue, count: 1 });
      }
    });

    return Array.from(forecastMap.entries())
      .map(([date, data]) => ({
        date,
        forecastedRevenue: data.revenue,
        activeSubscriptions: data.count,
        confidenceLevel: 85,
      }))
      .slice(0, 30);
  }
}
