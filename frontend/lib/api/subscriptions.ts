import { apiClient } from './client'

export interface Subscription {
  id: string
  status: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  plan: {
    id: string
    name: string
    price: number
    billingCycle: string
    description?: string
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
  payments?: Array<{
    id: string
    amount: number
    paymentDate: string
    status: string
    paymentMethod?: string
    transactionId?: string
  }>
}

export interface CreateSubscriptionData {
  branchId: string
  planId: string
  startDate: string
  endDate: string
  status?: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'
}

export interface UpdateSubscriptionData {
  planId?: string
  startDate?: string
  endDate?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'
}

export interface SubscriptionFilters {
  status?: string
  planId?: string
  tenantId?: string
}

export interface AllSubscriptionsResponse {
  subscriptions: Subscription[]
  summary: {
    total: number
    active: number
    expired: number
    totalRevenue: number
  }
}

export interface TenantSubscriptionStatus {
  tenant: {
    id: string
    name: string
    freeBranchOverride: number
  }
  branches: Array<{
    branchId: string
    branchName: string
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
    }
    status: string
    daysRemaining: number
  }>
  canCreateBranch: {
    canCreate: boolean
    reason?: string
    freeBranchesRemaining: number
    trialBranchesActive: number
  }
}

export interface ExpiringSoonResponse {
  subscriptions: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
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
        email?: string
      }
    }
    daysRemaining: number
  }>
  summary: {
    total: number
    averageDaysRemaining: number
  }
}

export const subscriptionsApi = {
  // Tenant subscription status
  getTenantSubscriptionStatus: (): Promise<TenantSubscriptionStatus> =>
    apiClient.get('/subscriptions/tenant/status').then(res => res.data),

  // Check if tenant can create branch
  canCreateBranch: (tenantId: string): Promise<{
    canCreate: boolean
    reason?: string
    freeBranchesRemaining: number
    trialBranchesActive: number
  }> =>
    apiClient.get(`/subscriptions/tenant/${tenantId}/can-create-branch`).then(res => res.data),

  // Super Admin CRUD operations
  getAllSubscriptions: (filters?: SubscriptionFilters): Promise<AllSubscriptionsResponse> => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.planId) params.append('planId', filters.planId)
    if (filters?.tenantId) params.append('tenantId', filters.tenantId)
    
    const queryString = params.toString()
    const url = queryString ? `/subscriptions/system/all?${queryString}` : '/subscriptions/system/all'
    
    return apiClient.get(url).then(res => res.data)
  },

  getSubscriptionById: (id: string): Promise<Subscription> =>
    apiClient.get(`/subscriptions/${id}`).then(res => res.data),

  createSubscription: (data: CreateSubscriptionData): Promise<Subscription> =>
    apiClient.post('/subscriptions', data).then(res => res.data),

  updateSubscription: (id: string, data: UpdateSubscriptionData): Promise<Subscription> =>
    apiClient.put(`/subscriptions/${id}`, data).then(res => res.data),

  deleteSubscription: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/subscriptions/${id}`).then(res => res.data),

  updateSubscriptionStatus: (id: string, status: string): Promise<Subscription & { message: string }> =>
    apiClient.put(`/subscriptions/${id}/status`, { status }).then(res => res.data),

  extendSubscription: (id: string, days: number): Promise<Subscription & { message: string; daysRemaining: number }> =>
    apiClient.post(`/subscriptions/${id}/extend`, { days }).then(res => res.data),

  getExpiringSoon: (days?: number): Promise<ExpiringSoonResponse> => {
    const url = days ? `/subscriptions/expiring/soon?days=${days}` : '/subscriptions/expiring/soon'
    return apiClient.get(url).then(res => res.data)
  },
}
