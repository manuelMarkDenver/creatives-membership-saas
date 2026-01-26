import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gymSubscriptionsApi } from '@/lib/api'
import { GymTransaction as ApiGymTransaction } from '@/lib/api/gym-subscriptions'

export interface GymSubscriptionStats {
  total: number
  active: number
  expired: number
  cancelled: number
}

export interface GymSubscription {
  id: string
  customerId: string
  gymMembershipPlanId: string
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
  gymMembershipPlan: {
    id: string
    name: string
    price: number
    duration: number
    type: string
  }
}

export interface GymTransaction {
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
export const gymSubscriptionKeys = {
  all: ['gym-subscriptions'] as const,
  stats: () => [...gymSubscriptionKeys.all, 'stats'] as const,
  subscription: (memberId: string) => [...gymSubscriptionKeys.all, 'subscription', memberId] as const,
  history: (memberId: string) => [...gymSubscriptionKeys.all, 'history', memberId] as const,
  transactions: (memberId: string) => [...gymSubscriptionKeys.all, 'transactions', memberId] as const,
}

// Get gym subscription stats for current tenant
export function useGymSubscriptionStats(options?: { enabled?: boolean }) {
  return useQuery<GymSubscriptionStats>({
    queryKey: gymSubscriptionKeys.stats(),
    queryFn: () => gymSubscriptionsApi.getSubscriptionStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: options?.enabled ?? true,
  })
}

// Get current subscription for a gym member
export function useGymMemberSubscription(memberId?: string) {
  const query = useQuery<GymSubscription | null>({
    queryKey: gymSubscriptionKeys.subscription(memberId || ''),
    queryFn: async () => {
      const result = await gymSubscriptionsApi.getCurrentSubscription(memberId!)
      // Extract the subscription from the response or return null
      return result.subscription ? {
        ...result.subscription,
        autoRenew: false, // Default value since it's not in the API response
      } as GymSubscription : null
    },
    enabled: !!memberId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
  
  if (query.error) {
    console.error(`[useGymMemberSubscription] Error for ${memberId}:`, query.error)
  }
  
  return query
}

// Get subscription history for a gym member
export function useGymMemberSubscriptionHistory(memberId?: string) {
  return useQuery<GymSubscription[]>({
    queryKey: gymSubscriptionKeys.history(memberId || ''),
    queryFn: async () => {
      const results = await gymSubscriptionsApi.getSubscriptionHistory(memberId!)
      // Transform each response item to extract subscription data
      return results.map(result => ({
        ...result.subscription,
        autoRenew: false, // Default value since it's not in the API response
      })).filter(Boolean) as GymSubscription[]
    },
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get gym member transactions
export function useGymMemberTransactions(memberId?: string) {
  return useQuery<ApiGymTransaction[]>({
    queryKey: gymSubscriptionKeys.transactions(memberId || ''),
    queryFn: () => gymSubscriptionsApi.getMemberTransactions(memberId!),
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Renew gym membership mutation
export function useRenewGymMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn:     ({
      memberId,
      gymMembershipPlanId
    }: {
      memberId: string
      gymMembershipPlanId: string
    }) => gymSubscriptionsApi.renewMembership(memberId, {
      gymMembershipPlanId
      // v1: paymentMethod removed - always uses 'cash'
    }),
    onSuccess: (_, { memberId }) => {
      // Invalidate gym member subscription data
      queryClient.invalidateQueries({
        queryKey: gymSubscriptionKeys.subscription(memberId)
      })
      queryClient.invalidateQueries({
        queryKey: gymSubscriptionKeys.history(memberId)
      })
      queryClient.invalidateQueries({
        queryKey: gymSubscriptionKeys.transactions(memberId)
      })
      queryClient.invalidateQueries({
        queryKey: gymSubscriptionKeys.stats()
      })
      
      // Also invalidate user data since subscription status affects members list
      queryClient.invalidateQueries({
        queryKey: ['users']
      })
    },
  })
}

// Cancel gym membership mutation
export function useCancelGymMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      memberId,
      cancellationReason,
      cancellationNotes
    }: {
      memberId: string
      cancellationReason: string
      cancellationNotes?: string
    }) => gymSubscriptionsApi.cancelMembership(memberId, {
      cancellationReason,
      cancellationNotes
    }),
    onSuccess: (_, { memberId }) => {
      // Invalidate gym member subscription data
      queryClient.invalidateQueries({
        queryKey: gymSubscriptionKeys.subscription(memberId)
      })
      queryClient.invalidateQueries({
        queryKey: gymSubscriptionKeys.history(memberId)
      })
      queryClient.invalidateQueries({
        queryKey: gymSubscriptionKeys.stats()
      })
      
      // Also invalidate user data since subscription status affects members list
      queryClient.invalidateQueries({
        queryKey: ['users']
      })
    },
  })
}

// Helper function to determine if subscription is expired
export function isGymSubscriptionExpired(subscription?: GymSubscription | string | null): boolean {
  if (!subscription || typeof subscription !== 'object' || !subscription.id) return true
  
  const endDate = new Date(subscription.endDate)
  const now = new Date()
  
  return endDate < now || subscription.status === 'EXPIRED' || subscription.status === 'CANCELLED'
}

// Helper function to get days remaining in subscription
export function getGymSubscriptionDaysRemaining(subscription?: GymSubscription | null): number {
  if (!subscription || !subscription.endDate) return 0
  
  const endDate = new Date(subscription.endDate)
  const now = new Date()
  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}
