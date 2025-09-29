import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expiringMembersApi, type ExpiringMembersFilters } from '@/lib/api/expiring-members'
import { toast } from 'react-toastify'

// Hook to get expiring members count
export function useExpiringMembersCount(tenantId: string, daysBefore: number = 7, options: any = {}) {
  return useQuery({
    queryKey: ['expiring-members-count', tenantId, daysBefore],
    queryFn: () => expiringMembersApi.getExpiringCount(tenantId, daysBefore),
    enabled: !!tenantId && options.enabled !== false,
    refetchInterval: options.refetchInterval ?? 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    ...options
  })
}

// Hook to get expiring members overview with filters
export function useExpiringMembersOverview(filters: ExpiringMembersFilters = {}) {
  return useQuery({
    queryKey: ['expiring-members-overview', filters],
    queryFn: () => expiringMembersApi.getExpiringOverview(filters),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  })
}

// Hook to get expiring members for specific tenant
export function useExpiringMembers(tenantId: string, daysBefore: number = 7) {
  return useQuery({
    queryKey: ['expiring-members', tenantId, daysBefore],
    queryFn: () => expiringMembersApi.getExpiringMembers(tenantId, daysBefore),
    enabled: !!tenantId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  })
}

// Hook to get expiring members with notifications
export function useExpiringMembersWithNotifications(tenantId: string, daysBefore: number = 7) {
  return useQuery({
    queryKey: ['expiring-members-notifications', tenantId, daysBefore],
    queryFn: () => expiringMembersApi.getExpiringMembersWithNotifications(tenantId, daysBefore),
    enabled: !!tenantId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  })
}

// Hook to refresh expiring members data
export function useRefreshExpiringMembers() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      // Invalidate all expiring members queries
      await queryClient.invalidateQueries({
        queryKey: ['expiring-members'],
        type: 'all'
      })
      await queryClient.invalidateQueries({
        queryKey: ['expiring-members-count'],
        type: 'all'
      })
      await queryClient.invalidateQueries({
        queryKey: ['expiring-members-overview'],
        type: 'all'
      })
      await queryClient.invalidateQueries({
        queryKey: ['expiring-members-notifications'],
        type: 'all'
      })
    },
    onSuccess: () => {
      toast.success('Expiring members data refreshed')
    },
    onError: () => {
      toast.error('Failed to refresh data')
    }
  })
}
