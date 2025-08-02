import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient as api } from '@/lib/api/client'

export interface SubscriptionStatus {
  tenant: {
    id: string
    name: string
    freeBranchOverride: number
  }
  branches: {
    branchId: string
    branchName: string
    subscription: {
      id: string
      planId: string
      plan: {
        name: string
        price: string
        billingCycle: string
      }
      startDate: string
      endDate: string
      status: string
    }
    status: 'ACTIVE' | 'EXPIRED' | 'NO_SUBSCRIPTION'
    daysRemaining: number
  }[]
  canCreateBranch: {
    canCreate: boolean
    reason?: string
    freeBranchesRemaining: number
    trialBranchesActive: number
  }
}

// Query keys
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  status: (tenantId?: string) => [...subscriptionKeys.all, 'status', tenantId] as const,
  canCreateBranch: (tenantId: string) => [...subscriptionKeys.all, 'can-create', tenantId] as const,
}

// Get tenant subscription status
export function useSubscriptionStatus(tenantId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: subscriptionKeys.status(tenantId),
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!tenantId) {
        throw new Error('Tenant ID is required')
      }
      const response = await api.get('/subscriptions/tenant/status', {
        headers: { 'x-tenant-id': tenantId },
      })
      return response.data
    },
    enabled: options?.enabled ?? !!tenantId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// Check if tenant can create branch (super admin)
export function useCanCreateBranch(tenantId: string) {
  return useQuery({
    queryKey: subscriptionKeys.canCreateBranch(tenantId),
    queryFn: async () => {
      const response = await api.get(`/subscriptions/tenant/${tenantId}/can-create-branch`)
      return response.data
    },
    enabled: !!tenantId,
  })
}

// Super admin: Update free branch override
export function useUpdateFreeBranchOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tenantId, override }: { tenantId: string; override: number }) => {
      const response = await api.patch(`/tenants/${tenantId}/free-branch-override`, { override })
      return response.data
    },
    onSuccess: (_, { tenantId }) => {
      // Invalidate subscription status for this tenant
      queryClient.invalidateQueries({ 
        queryKey: subscriptionKeys.status(tenantId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: subscriptionKeys.canCreateBranch(tenantId) 
      })
      // Also invalidate tenants list
      queryClient.invalidateQueries({ 
        queryKey: ['tenants'] 
      })
    },
  })
}

// Utility functions for subscription status
export function getTrialDaysRemaining(branches: SubscriptionStatus['branches']) {
  const trialBranches = branches.filter(branch => 
    branch.subscription?.plan?.billingCycle === 'TRIAL' && 
    branch.status === 'ACTIVE'
  )
  
  if (trialBranches.length === 0) return 0
  return Math.min(...trialBranches.map(branch => branch.daysRemaining))
}

export function hasActiveTrialBranches(branches: SubscriptionStatus['branches']) {
  return branches.some(branch => 
    branch.subscription?.plan?.billingCycle === 'TRIAL' &&
    branch.status === 'ACTIVE' &&
    branch.daysRemaining > 0
  )
}

export function hasExpiredBranches(branches: SubscriptionStatus['branches']) {
  return branches.some(branch => branch.status === 'EXPIRED')
}
