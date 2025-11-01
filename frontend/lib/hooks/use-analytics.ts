import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export type TimePeriod = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

export interface AnalyticsQueryParams {
  branchId?: string;
  period?: TimePeriod;
  startDate?: string;
  endDate?: string;
}

export interface RevenueMetrics {
  totalRevenue: number;
  previousPeriodRevenue: number;
  growthRate: number;
  growthAmount: number;
  averageRevenuePerMember: number;
  revenueByPlan: {
    planId: string;
    planName: string;
    revenue: number;
    memberCount: number;
    percentage: number;
  }[];
  revenueByBranch: {
    branchId: string;
    branchName: string;
    revenue: number;
    memberCount: number;
    averageRevenuePerMember: number;
  }[];
  revenueTimeline: {
    date: string;
    revenue: number;
    transactionCount: number;
  }[];
  paymentMethodBreakdown: {
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  newMembersThisPeriod: number;
  totalRevenue: number;
  averageRevenuePerMember: number;
  activeSubscriptionRate: number;
  memberGrowthRate: number;
  retentionRate: number;
  rank: number;
}

export interface MemberGrowthStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  cancelledMembers: number;
  newMembers: number;
  churnedMembers: number;
  churnRate: number;
  growthRate: number;
  retentionRate: number;
  memberLifetimeValue: number;
  timeline: {
    date: string;
    newMembers: number;
    activeMembers: number;
    expiredMembers: number;
    cancelledMembers: number;
  }[];
}

export interface OwnerInsights {
  collectionRate: number;
  averageSubscriptionValue: number;
  subscriptionRenewalRate: number;
  topPerformingPlans: {
    planId: string;
    planName: string;
    revenue: number;
    memberCount: number;
    renewalRate: number;
    averageValue: number;
  }[];
  peakSignupPeriods: {
    period: string;
    signupCount: number;
    revenue: number;
    type: 'day_of_week' | 'day_of_month' | 'month';
  }[];
  revenueForecasts: {
    date: string;
    forecastedRevenue: number;
    activeSubscriptions: number;
    confidenceLevel: number;
  }[];
}

export const analyticsKeys = {
  all: ['analytics'] as const,
  revenue: (params: AnalyticsQueryParams) => [...analyticsKeys.all, 'revenue', params] as const,
  branchPerformance: (params: AnalyticsQueryParams) => [...analyticsKeys.all, 'branch-performance', params] as const,
  memberGrowth: (params: AnalyticsQueryParams) => [...analyticsKeys.all, 'member-growth', params] as const,
  ownerInsights: (params: AnalyticsQueryParams) => [...analyticsKeys.all, 'owner-insights', params] as const,
};

export function useRevenueMetrics(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: analyticsKeys.revenue(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.branchId) searchParams.append('branchId', params.branchId);
      if (params.period) searchParams.append('period', params.period);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);

      const response = await apiClient.get<RevenueMetrics>(
        `/gym/analytics/revenue-metrics?${searchParams.toString()}`
      );
      return response.data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useBranchPerformance(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: analyticsKeys.branchPerformance(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.period) searchParams.append('period', params.period);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);

      const response = await apiClient.get<BranchPerformance[]>(
        `/gym/analytics/branch-performance?${searchParams.toString()}`
      );
      return response.data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useMemberGrowthStats(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: analyticsKeys.memberGrowth(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.branchId) searchParams.append('branchId', params.branchId);
      if (params.period) searchParams.append('period', params.period);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);

      const response = await apiClient.get<MemberGrowthStats>(
        `/gym/analytics/member-growth?${searchParams.toString()}`
      );
      return response.data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useOwnerInsights(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: analyticsKeys.ownerInsights(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.branchId) searchParams.append('branchId', params.branchId);
      if (params.period) searchParams.append('period', params.period);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);

      const response = await apiClient.get<OwnerInsights>(
        `/gym/analytics/owner-insights?${searchParams.toString()}`
      );
      return response.data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
