import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

interface SubscriptionStatus {
  canCreate: boolean
  reason?: string
  freeBranchesRemaining: number
  trialBranchesActive: number
}

export function useSubscriptionStatus(tenantId: string | undefined) {
  return useQuery<SubscriptionStatus>({
    queryKey: ['subscriptionStatus', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('No tenant ID')
      }
      try {
        const response = await apiClient.get(`/api/v1/subscriptions/tenant/${tenantId}/can-create-branch`)
        return response.data
      } catch (error) {
        // Silently fail and use placeholder data
        console.warn('Failed to fetch subscription status, using defaults')
        throw error
      }
    },
    enabled: !!tenantId,
    staleTime: 30000, // 30 seconds
    retry: false, // Don't retry on error to avoid multiple failed requests
    // Provide default optimistic state - allow creation unless API says otherwise
    placeholderData: {
      canCreate: true,
      freeBranchesRemaining: 1,
      trialBranchesActive: 0,
    },
  })
}
