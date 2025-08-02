import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { branchesApi, CreateBranchDto, UpdateBranchDto, BranchQueryParams } from '@/lib/api'
import { Branch } from '@/lib/types'

// Query keys
export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (params?: BranchQueryParams) => [...branchKeys.lists(), params] as const,
  systemWide: () => [...branchKeys.all, 'system-wide'] as const,
  byTenant: (tenantId: string, params?: Omit<BranchQueryParams, 'tenantId'>) => 
    [...branchKeys.all, 'tenant', tenantId, params] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
  stats: (id: string) => [...branchKeys.all, 'stats', id] as const,
}

// Get all branches
export function useBranches(params?: BranchQueryParams) {
  return useQuery({
    queryKey: branchKeys.list(params),
    queryFn: () => branchesApi.getAll(params),
    enabled: true,
  })
}

// Get branches by tenant
export function useBranchesByTenant(
  tenantId: string, 
  params?: Omit<BranchQueryParams, 'tenantId'>
) {
  return useQuery({
    queryKey: branchKeys.byTenant(tenantId, params),
    queryFn: () => branchesApi.getByTenant(tenantId, params),
    enabled: !!tenantId,
  })
}

// Get all branches system-wide (Super Admin only)
export function useBranchesSystemWide(enabled: boolean = true) {
  return useQuery({
    queryKey: branchKeys.systemWide(),
    queryFn: () => branchesApi.getSystemWide(),
    enabled,
  })
}

// Get branch by ID
export function useBranch(id: string) {
  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: () => branchesApi.getById(id),
    enabled: !!id,
  })
}

// Get branch stats
export function useBranchStats(id: string) {
  return useQuery({
    queryKey: branchKeys.stats(id),
    queryFn: () => branchesApi.getStats(id),
    enabled: !!id,
  })
}

// Create branch mutation
export function useCreateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBranchDto) => branchesApi.create(data),
    onSuccess: (newBranch: Branch) => {
      // Invalidate branch lists
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: [...branchKeys.all, 'tenant', newBranch.tenantId] 
      })
      
      // Add new branch to cache
      queryClient.setQueryData(branchKeys.detail(newBranch.id), newBranch)
    },
  })
}

// Update branch mutation
export function useUpdateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchDto }) =>
      branchesApi.update(id, data),
    onSuccess: (updatedBranch: Branch) => {
      // Update cached branch
      queryClient.setQueryData(branchKeys.detail(updatedBranch.id), updatedBranch)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: [...branchKeys.all, 'tenant', updatedBranch.tenantId] 
      })
    },
  })
}

// Delete branch mutation
export function useDeleteBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => branchesApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: branchKeys.detail(deletedId) })
      queryClient.removeQueries({ queryKey: branchKeys.stats(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...branchKeys.all, 'tenant'] })
    },
  })
}
