export class RevenueMetricsDto {
  totalRevenue: number;
  previousPeriodRevenue: number;
  growthRate: number;
  growthAmount: number;
  averageRevenuePerMember: number;
  revenueByPlan: RevenueByPlanDto[];
  revenueByBranch: RevenueByBranchDto[];
  revenueTimeline: RevenueTimelineDto[];
  paymentMethodBreakdown: PaymentMethodBreakdownDto[];
}

export class RevenueByPlanDto {
  planId: string;
  planName: string;
  revenue: number;
  memberCount: number;
  percentage: number;
}

export class RevenueByBranchDto {
  branchId: string;
  branchName: string;
  revenue: number;
  memberCount: number;
  averageRevenuePerMember: number;
}

export class RevenueTimelineDto {
  date: string;
  revenue: number;
  transactionCount: number;
}

export class PaymentMethodBreakdownDto {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export class BranchPerformanceDto {
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

export class MemberGrowthStatsDto {
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
  timeline: MemberTimelineDto[];
}

export class MemberTimelineDto {
  date: string;
  newMembers: number;
  activeMembers: number;
  expiredMembers: number;
  cancelledMembers: number;
}

export class OwnerInsightsDto {
  collectionRate: number;
  averageSubscriptionValue: number;
  subscriptionRenewalRate: number;
  topPerformingPlans: TopPerformingPlanDto[];
  peakSignupPeriods: PeakPeriodDto[];
  revenueForecasts: RevenueForecastDto[];
}

export class TopPerformingPlanDto {
  planId: string;
  planName: string;
  revenue: number;
  memberCount: number;
  renewalRate: number;
  averageValue: number;
}

export class PeakPeriodDto {
  period: string;
  signupCount: number;
  revenue: number;
  type: 'day_of_week' | 'day_of_month' | 'month';
}

export class RevenueForecastDto {
  date: string;
  forecastedRevenue: number;
  activeSubscriptions: number;
  confidenceLevel: number;
}
