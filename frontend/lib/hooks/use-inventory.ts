import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export function useInventorySummary(params: { branchId?: string } = {}) {
  return useQuery({
    queryKey: ['inventory', 'summary', params.branchId || null],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/summary', {
        params: {
          ...(params.branchId ? { branchId: params.branchId } : {}),
        },
      })
      return res.data
    },
  })
}

export function useAssignedInventory(params: {
  branchId?: string
  q?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: [
      'inventory',
      'assigned',
      params.branchId || null,
      params.q || '',
      params.page || 1,
      params.pageSize || 25,
    ],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/assigned', {
        params: {
          ...(params.branchId ? { branchId: params.branchId } : {}),
          ...(params.q ? { q: params.q } : {}),
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? 25),
        },
      })
      return res.data
    },
    enabled: true,
  })
}

export function useAvailableInventory(params: {
  branchId?: string
  q?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: [
      'inventory',
      'available',
      params.branchId || null,
      params.q || '',
      params.page || 1,
      params.pageSize || 25,
    ],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/available', {
        params: {
          ...(params.branchId ? { branchId: params.branchId } : {}),
          ...(params.q ? { q: params.q } : {}),
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? 25),
        },
      })
      return res.data
    },
  })
}

export function useDailyCards(params: {
  branchId?: string
  q?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: [
      'inventory',
      'daily',
      params.branchId || null,
      params.q || '',
      params.page || 1,
      params.pageSize || 25,
    ],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/daily', {
        params: {
          ...(params.branchId ? { branchId: params.branchId } : {}),
          ...(params.q ? { q: params.q } : {}),
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? 25),
        },
      })
      return res.data
    },
  })
}
