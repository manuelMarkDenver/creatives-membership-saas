import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerSubscriptionsApi } from '@/lib/api'

export interface CustomerSubscriptionStats {
  total: number
  active: number
  expired: number
  cancelled: number
}

export interface CustomerSubscription {
  id: string
  customerId: string
  membershipPlanId: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'INACTIVE' | 'PENDING_ACTIVATION'
  startDate: string
  endDate: string
  price: number
  currency: string
  autoRenew: boolean
  customer: {
    id: string
    firstName: string
    lastName: string
    name?: string
    email: string
    photoUrl?: string
  }
  membershipPlan: {
    id: string
    name: string
    price: number
    duration: number
    type: string
  }
}

export interface CustomerTransaction {
  id: string
  customerId: string
  amount: number
  currency: string
  paymentMethod: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  transactionType: 'PAYMENT' | 'REFUND' | 'ADJUSTMENT'
  description: string
  createdAt: string
  customer: {
    firstName: string
    lastName: string
    email: string
  }
}

// Query keys
export const customerSubscriptionKeys = {
  all: ['customer-subscriptions'] as const,
  stats: () => [...customerSubscriptionKeys.all, 'stats'] as const,
  subscription: (customerId: string) => [...customerSubscriptionKeys.all, 'subscription', customerId] as const,
  history: (customerId: string) => [...customerSubscriptionKeys.all, 'history', customerId] as const,
  transactions: (customerId: string) => [...customerSubscriptionKeys.all, 'transactions', customerId] as const,
}

// Get customer subscription stats for current tenant
export function useCustomerSubscriptionStats() {
  return useQuery<CustomerSubscriptionStats>({
    queryKey: customerSubscriptionKeys.stats(),
    queryFn: () => customerSubscriptionsApi.getSubscriptionStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get current subscription for a customer
export function useCustomerSubscription(customerId?: string) {
  const query = useQuery<CustomerSubscription | null>({
    queryKey: customerSubscriptionKeys.subscription(customerId || ''),
    queryFn: async () => {
      const result = await customerSubscriptionsApi.getCurrentSubscription(customerId!)
      return result
    },
    enabled: !!customerId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
  
  if (query.error) {
    console.error(`[useCustomerSubscription] Error for ${customerId}:`, query.error)
  }
  
  return query
}

// Get subscription history for a customer
export function useCustomerSubscriptionHistory(customerId?: string) {
  return useQuery<CustomerSubscription[]>({
    queryKey: customerSubscriptionKeys.history(customerId || ''),
    queryFn: () => customerSubscriptionsApi.getSubscriptionHistory(customerId!),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get customer transactions
export function useCustomerTransactions(customerId?: string) {
  return useQuery<CustomerTransaction[]>({
    queryKey: customerSubscriptionKeys.transactions(customerId || ''),
    queryFn: () => customerSubscriptionsApi.getCustomerTransactions(customerId!),
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Renew membership mutation
export function useRenewMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerId,
      membershipPlanId,
      paymentMethod
    }: {
      customerId: string
      membershipPlanId: string
      paymentMethod?: string
    }) => customerSubscriptionsApi.renewMembership(customerId, {
      membershipPlanId,
      paymentMethod: paymentMethod || 'cash'
    }),
    onSuccess: (_, { customerId }) => {
      // Invalidate customer subscription data
      queryClient.invalidateQueries({
        queryKey: customerSubscriptionKeys.subscription(customerId)
      })
      queryClient.invalidateQueries({
        queryKey: customerSubscriptionKeys.history(customerId)
      })
      queryClient.invalidateQueries({
        queryKey: customerSubscriptionKeys.transactions(customerId)
      })
      queryClient.invalidateQueries({
        queryKey: customerSubscriptionKeys.stats()
      })
      
      // Also invalidate user data since subscription status affects members list
      queryClient.invalidateQueries({
        queryKey: ['users']
      })
    },
  })
}

// Cancel membership mutation
export function useCancelMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerId,
      cancellationReason,
      cancellationNotes
    }: {
      customerId: string
      cancellationReason: string
      cancellationNotes?: string
    }) => customerSubscriptionsApi.cancelMembership(customerId, {
      cancellationReason,
      cancellationNotes
    }),
    onSuccess: (_, { customerId }) => {
      // Invalidate customer subscription data
      queryClient.invalidateQueries({
        queryKey: customerSubscriptionKeys.subscription(customerId)
      })
      queryClient.invalidateQueries({
        queryKey: customerSubscriptionKeys.history(customerId)
      })
      queryClient.invalidateQueries({
        queryKey: customerSubscriptionKeys.stats()
      })
      
      // Also invalidate user data since subscription status affects members list
      queryClient.invalidateQueries({
        queryKey: ['users']
      })
    },
  })
}

// Helper function to determine if subscription is expired
export function isSubscriptionExpired(subscription?: CustomerSubscription | string | null): boolean {
  if (!subscription || typeof subscription !== 'object' || !subscription.id) return true
  
  const endDate = new Date(subscription.endDate)
  const now = new Date()
  
  return endDate < now || subscription.status === 'EXPIRED' || subscription.status === 'CANCELLED'
}

// Helper function to get days remaining in subscription
export function getSubscriptionDaysRemaining(subscription?: CustomerSubscription | string | null): number {
  if (!subscription || typeof subscription !== 'object' || !subscription.id || isSubscriptionExpired(subscription)) return 0
  
  const endDate = new Date(subscription.endDate)
  const now = new Date()
  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}
