import { apiClient } from './client'

export interface SystemOverviewStats {
  overview: {
    totalTenants: number
    totalBranches: number
    totalUsers: number
    totalActiveSubscriptions: number
    totalRevenue: number
  }
  growth: {
    newTenantsThisMonth: number
    newBranchesThisMonth: number
    newUsersThisMonth: number
  }
}

export interface BranchStats {
  id: string
  name: string
  address?: string
  isActive: boolean
  createdAt: string
  tenant: {
    id: string
    name: string
    slug: string
    category: string
  }
  memberCount: number
  subscription?: {
    id: string
    plan: {
      id: string
      name: string
      price: number
      billingCycle: string
    }
    startDate: string
    endDate: string
    status: string
    daysRemaining: number
  }
}

export interface SystemBranchStats {
  branches: BranchStats[]
  summary: {
    totalBranches: number
    activeBranches: number
    totalMembers: number
    subscriptionBreakdown: {
      active: number
      trial: number
      paid: number
      noSubscription: number
    }
    byCategory: Record<string, BranchStats[]>
  }
}

export interface MemberStats {
  id: string
  name: string
  email?: string
  role: string
  isActive: boolean
  createdAt: string
  tenant?: {
    id: string
    name: string
    slug: string
    category: string
  }
  branches: Array<{
    id: string
    name: string
  }>
  branchCount: number
}

export interface SystemMemberStats {
  members: MemberStats[]
  summary: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    byRole: Array<{
      role: string
      count: number
      active: number
    }>
    byCategory: Array<{
      category: string
      count: number
      active: number
    }>
  }
}

export interface StaffStats {
  id: string
  name: string
  email?: string
  role: string
  isActive: boolean
  createdAt: string
  tenant?: {
    id: string
    name: string
    slug: string
    category: string
  }
  branches: Array<{
    id: string
    name: string
  }>
  branchCount: number
}

export interface SystemStaffStats {
  staff: StaffStats[]
  summary: {
    totalStaff: number
    activeStaff: number
    inactiveStaff: number
    byRole: Array<{
      role: string
      count: number
      active: number
    }>
    byCategory: Array<{
      category: string
      count: number
      active: number
    }>
  }
}

export interface SubscriptionStats {
  id: string
  status: string
  startDate: string
  endDate: string
  createdAt: string
  plan: {
    id: string
    name: string
    price: number
    billingCycle: string
  }
  branch: {
    id: string
    name: string
    tenant: {
      id: string
      name: string
      slug: string
      category: string
    }
  }
  totalPayments: number
  paymentCount: number
  daysRemaining: number
  isExpired: boolean
}

export interface SystemSubscriptionStats {
  subscriptions: SubscriptionStats[]
  summary: {
    totalSubscriptions: number
    activeSubscriptions: number
    totalRevenue: number
    statusBreakdown: Record<string, number>
    planBreakdown: Record<string, number>
    revenueByPlan: Array<{
      plan: string
      count: number
      revenue: number
    }>
  }
}

export interface TenantDashboard {
  tenant: {
    id: string
    name: string
    slug: string
    category: string
    freeBranchOverride: number
  }
  summary: {
    totalBranches: number
    totalUsers: number
    activeSubscriptions: number
    totalMembers: number
  }
  // Gym subscription stats (for gym businesses)
  gymSubscriptionStats?: {
    total: number
    active: number
    expired: number
    cancelled: number
    expiring: number
  }
  branches: Array<{
    id: string
    name: string
    address?: string
    isActive: boolean
    memberCount: number
    subscription?: {
      id: string
      plan: {
        id: string
        name: string
        price: number
      }
      startDate: string
      endDate: string
      status: string
    }
  }>
}

export interface GymSubscriptionStats {
  total: number
  active: number
  expired: number
  cancelled: number
  expiring: number
}

export const statsApi = {
  // Super Admin system-wide stats
  getSystemOverview: (): Promise<SystemOverviewStats> =>
    apiClient.get('/stats/system/overview').then(res => res.data),

  getSystemBranchStats: (): Promise<SystemBranchStats> =>
    apiClient.get('/stats/system/branches').then(res => res.data),

  getSystemMemberStats: (): Promise<SystemMemberStats> =>
    apiClient.get('/stats/system/members').then(res => res.data),

  getSystemStaffStats: (): Promise<SystemStaffStats> =>
    apiClient.get('/stats/system/staff').then(res => res.data),

  getSystemSubscriptionStats: (): Promise<SystemSubscriptionStats> =>
    apiClient.get('/stats/system/subscriptions').then(res => res.data),

  // Tenant-specific dashboard
  getTenantDashboard: (): Promise<TenantDashboard> =>
    apiClient.get('/stats/tenant/dashboard').then(res => res.data),

  // Gym subscription stats (for gym businesses)
  getGymSubscriptionStats: (): Promise<GymSubscriptionStats> =>
    apiClient.get('/gym/subscriptions/stats').then(res => res.data),
}
