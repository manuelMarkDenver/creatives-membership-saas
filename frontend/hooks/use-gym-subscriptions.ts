import { useEffect, useCallback } from 'react'
import { useGymSubscriptionsStore } from '../lib/stores/gym-subscriptions-store'
import { GymSubscription, GymTransaction, GymSubscriptionResponse } from '../lib/api/gym-subscriptions'

interface UseGymSubscriptionsOptions {
  autoLoadStats?: boolean
}

export const useGymSubscriptions = (options: UseGymSubscriptionsOptions = {}) => {
  const {
    autoLoadStats = true,
  } = options

  const {
    // Data
    subscriptionStats,
    currentSubscriptions,
    memberTransactions,
    subscriptionHistory,
    
    // Loading states
    isLoadingStats,
    isLoadingSubscription,
    isLoadingTransactions,
    isLoadingHistory,
    isProcessingRenewal,
    isProcessingCancellation,
    
    // Error states
    statsError,
    subscriptionError,
    transactionsError,
    historyError,
    renewalError,
    cancellationError,
    
    // Actions
    loadSubscriptionStats,
    loadCurrentSubscription,
    loadMemberTransactions,
    loadSubscriptionHistory,
    renewMembership,
    cancelMembership,
    
    // Getters
    getCurrentSubscription,
    getMemberTransactions,
    getSubscriptionHistory,
    clearMemberData,
  } = useGymSubscriptionsStore()

  // Auto-load stats on mount
  useEffect(() => {
    if (autoLoadStats && !subscriptionStats && !isLoadingStats) {
      loadSubscriptionStats()
    }
  }, [autoLoadStats, subscriptionStats, isLoadingStats, loadSubscriptionStats])

  // Helper functions
  const refreshStats = useCallback(async () => {
    await loadSubscriptionStats()
  }, [loadSubscriptionStats])

  const loadMemberData = useCallback(async (memberId: string) => {
    const promises = [
      loadCurrentSubscription(memberId),
      loadMemberTransactions(memberId),
      loadSubscriptionHistory(memberId),
    ]
    
    await Promise.all(promises)
  }, [loadCurrentSubscription, loadMemberTransactions, loadSubscriptionHistory])

  const renewMembershipWithRefresh = useCallback(async (
    memberId: string, 
    membershipPlanId: string, 
    paymentMethod: string
  ): Promise<GymSubscriptionResponse | null> => {
    const result = await renewMembership(memberId, membershipPlanId, paymentMethod)
    
    if (result) {
      // Refresh stats and member data after successful renewal
      await refreshStats()
      await loadMemberTransactions(memberId)
      await loadSubscriptionHistory(memberId)
    }
    
    return result
  }, [renewMembership, refreshStats, loadMemberTransactions, loadSubscriptionHistory])

  const cancelMembershipWithRefresh = useCallback(async (
    memberId: string, 
    reason?: string, 
    notes?: string
  ): Promise<GymSubscriptionResponse | null> => {
    const result = await cancelMembership(memberId, reason, notes)
    
    if (result) {
      // Refresh stats and member data after successful cancellation
      await refreshStats()
      await loadMemberTransactions(memberId)
      await loadSubscriptionHistory(memberId)
    }
    
    return result
  }, [cancelMembership, refreshStats, loadMemberTransactions, loadSubscriptionHistory])

  // Computed values
  const totalActiveSubscriptions = subscriptionStats?.active || 0
  const totalExpiredSubscriptions = subscriptionStats?.expired || 0
  const totalCancelledSubscriptions = subscriptionStats?.cancelled || 0
  const totalSubscriptions = subscriptionStats?.total || 0

  // Status helpers
  const getMemberSubscriptionStatus = useCallback((memberId: string): 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | 'NONE' => {
    const subscription = getCurrentSubscription(memberId)
    return subscription?.status || 'NONE'
  }, [getCurrentSubscription])

  const isMemberActive = useCallback((memberId: string): boolean => {
    const status = getMemberSubscriptionStatus(memberId)
    return status === 'ACTIVE'
  }, [getMemberSubscriptionStatus])

  const getMemberLastTransaction = useCallback((memberId: string): GymTransaction | null => {
    const transactions = getMemberTransactions(memberId)
    if (!transactions || transactions.length === 0) return null
    
    return transactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  }, [getMemberTransactions])

  return {
    // Data
    subscriptionStats,
    totalActiveSubscriptions,
    totalExpiredSubscriptions,
    totalCancelledSubscriptions,
    totalSubscriptions,
    
    // Loading states
    isLoadingStats,
    isLoadingSubscription,
    isLoadingTransactions,
    isLoadingHistory,
    isProcessingRenewal,
    isProcessingCancellation,
    isLoading: isLoadingStats || isLoadingSubscription || isLoadingTransactions || isLoadingHistory,
    isProcessing: isProcessingRenewal || isProcessingCancellation,
    
    // Error states
    statsError,
    subscriptionError,
    transactionsError,
    historyError,
    renewalError,
    cancellationError,
    hasError: !!(statsError || subscriptionError || transactionsError || historyError || renewalError || cancellationError),
    
    // Actions
    refreshStats,
    loadMemberData,
    renewMembershipWithRefresh,
    cancelMembershipWithRefresh,
    clearMemberData,
    
    // Member-specific getters
    getCurrentSubscription,
    getMemberTransactions,
    getSubscriptionHistory,
    getMemberSubscriptionStatus,
    isMemberActive,
    getMemberLastTransaction,
  }
}
