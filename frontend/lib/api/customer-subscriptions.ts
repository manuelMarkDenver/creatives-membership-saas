import { apiClient } from './client'

export interface CustomerSubscriptionRenewalData {
  membershipPlanId: string
  paymentMethod: string
}

export interface CustomerSubscriptionCancellationData {
  cancellationReason?: string
  cancellationNotes?: string
}

export interface CustomerSubscriptionResponse {
  message: string
  subscription?: {
    id: string
    customerId: string
    membershipPlanId: string
    status: string
    startDate: string
    endDate: string
  }
  transaction?: {
    id: string
    amount: number
    type: string
    status: string
    paymentMethod: string
  }
}

export const customerSubscriptionsApi = {
  // Get subscription stats for current tenant
  getSubscriptionStats: (): Promise<{
    total: number
    active: number
    expired: number
    cancelled: number
  }> =>
    apiClient.get('/customer-subscriptions/stats').then(res => res.data),

  // Get current subscription for a customer
  getCurrentSubscription: (customerId: string): Promise<any> =>
    apiClient.get(`/customer-subscriptions/${customerId}`).then(res => res.data),

  // Get subscription history for a customer
  getSubscriptionHistory: (customerId: string): Promise<any[]> =>
    apiClient.get(`/customer-subscriptions/${customerId}/history`).then(res => res.data),

  // Get customer transactions
  getCustomerTransactions: (customerId: string): Promise<any[]> =>
    apiClient.get(`/customer-subscriptions/${customerId}/transactions`).then(res => res.data),

  // Renew customer membership
  renewMembership: (customerId: string, data: CustomerSubscriptionRenewalData): Promise<CustomerSubscriptionResponse> =>
    apiClient.post(`/customer-subscriptions/${customerId}/renew`, data).then(res => res.data),

  // Cancel customer membership
  cancelMembership: (customerId: string, data: CustomerSubscriptionCancellationData): Promise<CustomerSubscriptionResponse> =>
    apiClient.post(`/customer-subscriptions/${customerId}/cancel`, data).then(res => res.data),
}
