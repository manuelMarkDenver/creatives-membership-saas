import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantsApi, CreateTenantDto, UpdateTenantDto, TenantQueryParams } from '@/lib/api'
import { Tenant } from '@/types'

// Query keys
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (params?: TenantQueryParams) => [...tenantKeys.lists(), params] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
  stats: (id: string) => [...tenantKeys.all, 'stats', id] as const,
}

// Get all tenants
export function useTenants(params?: TenantQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: () => tenantsApi.getAll(params),
    enabled: options?.enabled ?? true,
  })
}

// Get tenant by ID
export function useTenant(id: string) {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => tenantsApi.getById(id),
    enabled: !!id,
  })
}

// Get tenant stats
export function useTenantStats(id: string) {
  return useQuery({
    queryKey: tenantKeys.stats(id),
    queryFn: () => tenantsApi.getStats(id),
    enabled: !!id,
  })
}

// Get system stats (Super Admin only)
export function useSystemStats(enabled: boolean = true) {
  return useQuery({
    queryKey: [...tenantKeys.all, 'system-stats'],
    queryFn: () => tenantsApi.getSystemStats(),
    enabled,
  })
}

// Create tenant mutation
export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTenantDto) => tenantsApi.create(data),
    onSuccess: (newTenant: Tenant) => {
      // Invalidate and refetch tenant lists
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      
      // Add new tenant to cache
      queryClient.setQueryData(tenantKeys.detail(newTenant.id), newTenant)
    },
  })
}

// Update tenant mutation
export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantDto }) =>
      tenantsApi.update(id, data),
    onSuccess: (updatedTenant: Tenant) => {
      // Update cached tenant
      queryClient.setQueryData(tenantKeys.detail(updatedTenant.id), updatedTenant)
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
  })
}

// Delete tenant mutation
export function useDeleteTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: tenantKeys.detail(deletedId) })
      queryClient.removeQueries({ queryKey: tenantKeys.stats(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
  })
}

// Get tenant owner details
export function useTenantOwner(tenantId: string) {
  return useQuery({
    queryKey: ['tenant-owner', tenantId],
    queryFn: async () => {
      console.log('Fetching owner data for tenant:', tenantId)
      const { apiClient } = await import('../api/client')
      console.log('API client baseURL:', apiClient.defaults.baseURL)
      const url = `/tenants/${tenantId}/owner`
      console.log('Making request to:', url)
      const response = await apiClient.get(url)
      console.log('Owner data response:', response.data)
      return response.data
    },
    enabled: !!tenantId,
  })
}

// Update tenant owner mutation
export function useUpdateTenantOwner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tenantId, data }: { 
      tenantId: string; 
      data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phoneNumber?: string;
      } 
    }) => {
      console.log('Updating owner data for tenant:', tenantId, 'with data:', data)
      const { apiClient } = await import('../api/client')
      console.log('API client baseURL for update:', apiClient.defaults.baseURL)
      const url = `/tenants/${tenantId}/owner`
      console.log('Making PUT request to:', url)
      const response = await apiClient.put(url, data)
      console.log('Owner update response:', response.data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['tenant-owner'] })
    },
  })
}

// Reset tenant owner password mutation
export function useResetTenantOwnerPassword() {
  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { apiClient } = await import('../api/client')
      const response = await apiClient.post(`/tenants/${tenantId}/owner/reset-password`)
      return response.data
    },
  })
}
