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
