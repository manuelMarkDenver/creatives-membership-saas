import { apiClient } from './client'

export interface ExpiringMember {
  id: string
  customerId: string
  gymMembershipPlanId: string
  tenantId: string
  branchId?: string
  status: string
  startDate: string
  endDate: string
  price: number
  daysUntilExpiry: number
  memberName: string
  isExpired: boolean
  urgency: 'critical' | 'high' | 'medium'
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string
    photoUrl?: string
  }
  gymMembershipPlan: {
    id: string
    name: string
    type: string
    price: number
  }
  tenant: {
    id: string
    name: string
    category: string
  }
  branch?: {
    id: string
    name: string
    address?: string
  }
}

export interface ExpiringMembersOverview {
  subscriptions: ExpiringMember[]
  groupedByTenant?: {
    [tenantName: string]: {
      tenant: {
        id: string
        name: string
        category: string
      }
      members: ExpiringMember[]
      count: number
    }
  }
  groupedByBranch?: {
    [branchName: string]: {
      branch: {
        id: string
        name: string
        address?: string
      }
      members: ExpiringMember[]
      count: number
    }
  }
  availableBranches?: Array<{
    id: string
    name: string
    address?: string
  }>
  userRole?: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF'
  accessSummary?: {
    totalAccessibleBranches: number
    canFilterByBranch: boolean
    canFilterByTenant: boolean
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  summary: {
    totalExpiring: number
    daysBefore: number
    critical: number
    high: number
    medium: number
  }
}

export interface ExpiringMembersFilters {
  daysBefore?: number
  tenantId?: string
  branchId?: string
  page?: number
  limit?: number
}

export const expiringMembersApi = {
  // Get count of expiring members for a tenant (via gym subscriptions count endpoint)
  async getExpiringCount(tenantId: string, daysBefore: number = 7) {
    const response = await apiClient.get('/gym/subscriptions/expiring/count', {
      params: { daysBefore }
    })
    return response.data
  },

  // Get expiring members overview (using gym subscriptions endpoint)
  async getExpiringOverview(filters: ExpiringMembersFilters = {}): Promise<ExpiringMembersOverview> {
    const response = await apiClient.get('/gym/subscriptions/expiring', {
      params: filters
    })
    return response.data
  },

  // Get expiring members for specific tenant (using gym subscriptions endpoint)
  async getExpiringMembers(tenantId: string, daysBefore: number = 7) {
    const response = await apiClient.get('/gym/subscriptions/expiring', {
      params: { daysBefore }
    })
    return response.data
  },

  // Get expiring members with notifications (for future email/SMS features)
  async getExpiringMembersWithNotifications(tenantId: string, daysBefore: number = 7) {
    // For now, this returns the same as expiring members
    // In the future, this could include notification-specific data
    const response = await apiClient.get('/gym/subscriptions/expiring', {
      params: { daysBefore }
    })
    return response.data
  }
}
