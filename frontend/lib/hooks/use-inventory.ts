import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/summary')
      return res.data
    },
  })
}

export function useAssignedInventory(params: { branchId?: string; limit?: number }) {
  return useQuery({
    queryKey: ['inventory', 'assigned', params.branchId || null, params.limit || 200],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/assigned', {
        params: {
          ...(params.branchId ? { branchId: params.branchId } : {}),
          limit: String(params.limit ?? 200),
        },
      })
      return res.data
    },
    enabled: true,
  })
}
