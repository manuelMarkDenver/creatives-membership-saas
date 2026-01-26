import { apiClient } from './client'

export interface GymMemberSubscriptionRenewalData {
  gymMembershipPlanId: string
  // v1: paymentMethod removed - always uses 'cash'
}

export interface GymMemberSubscriptionCancellationData {
  cancellationReason?: string
  cancellationNotes?: string
}

export interface GymMemberSubscriptionChangePlanData {
  gymMembershipPlanId: string
  paymentAmount: number
  // v1: paymentMethod removed - always uses 'cash'
}

export interface GymSubscriptionResponse {
  message: string
  subscription?: {
    id: string
    customerId: string
    gymMembershipPlanId: string
    status: string
    startDate: string
    endDate: string
    price: number
    currency: string
    gymMembershipPlan: {
      id: string
      name: string
      price: number
      duration: number
      type: string
    }
    customer: {
      id: string
      firstName: string
      lastName: string
      name: string
      email: string
    }
  }
  transaction?: {
    id: string
    amount: number
    type: string
    status: string
    paymentMethod: string
  }
}

export interface GymSubscriptionStats {
  total: number
  active: number
  expired: number
  cancelled: number
}

export interface GymTransaction {
  id: string
  amount: number
  type: string
  status: string
  paymentMethod: string
  createdAt: string
}

export const gymSubscriptionsApi = {
  // Get gym subscription stats for current tenant
  getSubscriptionStats: (): Promise<GymSubscriptionStats> =>
    apiClient.get('/gym/subscriptions/stats').then(res => res.data),

  // Get current subscription for a gym member
  getCurrentSubscription: (memberId: string): Promise<GymSubscriptionResponse> =>
    apiClient.get(`/gym/subscriptions/${memberId}`).then(res => res.data),

  // Get subscription history for a gym member
  getSubscriptionHistory: (memberId: string): Promise<GymSubscriptionResponse[]> =>
    apiClient.get(`/gym/subscriptions/${memberId}/history`).then(res => res.data),

  // Get gym member transactions
  getMemberTransactions: (memberId: string): Promise<GymTransaction[]> =>
    apiClient.get(`/gym/subscriptions/${memberId}/transactions`).then(res => res.data),

  // Renew gym member membership
  renewMembership: (memberId: string, data: GymMemberSubscriptionRenewalData): Promise<GymSubscriptionResponse> =>
    apiClient.post(`/gym/subscriptions/${memberId}/renew`, data).then(res => res.data),

  // Cancel gym member membership
  cancelMembership: (memberId: string, data: GymMemberSubscriptionCancellationData): Promise<GymSubscriptionResponse> =>
    apiClient.post(`/gym/subscriptions/${memberId}/cancel`, data).then(res => res.data),

  // Change gym member plan
  changePlan: (memberId: string, data: GymMemberSubscriptionChangePlanData): Promise<GymSubscriptionResponse> =>
    apiClient.post(`/gym/subscriptions/${memberId}/change-plan`, data).then(res => res.data),
}
