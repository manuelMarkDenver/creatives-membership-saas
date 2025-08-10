import { apiClient } from './client'

export interface ExpiringMember {
  id: string
  customerId: string
  membershipPlanId: string
  tenantId: string
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
  membershipPlan: {
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
  // Get count of expiring members for a tenant
  async getExpiringCount(tenantId: string, daysBefore: number = 7) {
    const response = await apiClient.get(`/users/expiring-count/${tenantId}`, {
      params: { daysBefore }
    })
    return response.data
  },

  // Get expiring members overview (role-based filtering)
  async getExpiringOverview(filters: ExpiringMembersFilters = {}): Promise<ExpiringMembersOverview> {
    const response = await apiClient.get('/users/expiring-overview', {
      params: filters
    })
    return response.data
  },

  // Get expiring members for specific tenant
  async getExpiringMembers(tenantId: string, daysBefore: number = 7) {
    const response = await apiClient.get(`/users/expiring/${tenantId}`, {
      params: { daysBefore }
    })
    return response.data
  },

  // Get expiring members with notifications (for future email/SMS features)
  async getExpiringMembersWithNotifications(tenantId: string, daysBefore: number = 7) {
    const response = await apiClient.get(`/users/expiring/${tenantId}/notifications`, {
      params: { daysBefore }
    })
    return response.data
  }
}
