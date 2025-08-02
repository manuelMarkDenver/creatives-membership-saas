import { apiClient } from './client'

export interface Plan {
  id: string
  name: string
  price: number
  billingCycle: 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'ONE_TIME'
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  activeSubscriptions?: number
  totalSubscriptions?: number
}

export interface PlanDetails extends Plan {
  subscriptions: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    createdAt: string
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
  }>
}

export interface CreatePlanData {
  name: string
  price: number
  billingCycle: 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'ONE_TIME'
  description?: string
  isActive?: boolean
}

export interface UpdatePlanData {
  name?: string
  price?: number
  billingCycle?: 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'ONE_TIME'
  description?: string
  isActive?: boolean
}

export interface PlanSubscriptions {
  plan: Plan
  subscriptions: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    createdAt: string
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
  }>
  summary: {
    totalSubscriptions: number
    activeSubscriptions: number
    expiredSubscriptions: number
    totalRevenue: number
    averageSubscriptionDuration: number
  }
}

export const plansApi = {
  // Get all plans
  getAllPlans: (): Promise<{ plans: Plan[] }> =>
    apiClient.get('/plans').then(res => res.data),

  // Get only active plans
  getActivePlans: (): Promise<{ plans: Plan[] }> =>
    apiClient.get('/plans/active').then(res => res.data),

  // Get plan by ID
  getPlanById: (id: string): Promise<PlanDetails> =>
    apiClient.get(`/plans/${id}`).then(res => res.data),

  // Create new plan (Super Admin only)
  createPlan: (data: CreatePlanData): Promise<Plan> =>
    apiClient.post('/plans', data).then(res => res.data),

  // Update plan (Super Admin only)
  updatePlan: (id: string, data: UpdatePlanData): Promise<Plan> =>
    apiClient.put(`/plans/${id}`, data).then(res => res.data),

  // Delete plan (Super Admin only)
  deletePlan: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/plans/${id}`).then(res => res.data),

  // Toggle plan status (Super Admin only)
  togglePlanStatus: (id: string): Promise<Plan & { message: string }> =>
    apiClient.put(`/plans/${id}/toggle-status`).then(res => res.data),

  // Get plan subscriptions (Super Admin only)
  getPlanSubscriptions: (id: string): Promise<PlanSubscriptions> =>
    apiClient.get(`/plans/${id}/subscriptions`).then(res => res.data),
}
