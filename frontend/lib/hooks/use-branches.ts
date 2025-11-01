import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { branchesApi, CreateBranchDto, UpdateBranchDto, BranchQueryParams } from '@/lib/api'
import { Branch } from '@/types'

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
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

// Get all branches system-wide (Super Admin only)
export function useBranchesSystemWide(enabled: boolean = true, includeDeleted?: boolean) {
  return useQuery({
    queryKey: [...branchKeys.systemWide(), { includeDeleted }],
    queryFn: () => branchesApi.getSystemWide(includeDeleted),
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
      // Don't remove from cache since it's soft delete - just invalidate lists
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...branchKeys.all, 'tenant'] })
      queryClient.invalidateQueries({ queryKey: branchKeys.detail(deletedId) })
    },
  })
}

// Restore branch mutation
export function useRestoreBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => branchesApi.restore(id),
    onSuccess: (restoredBranch: Branch) => {
      // Update cached branch
      queryClient.setQueryData(branchKeys.detail(restoredBranch.id), restoredBranch)
      
      // Invalidate lists to show restored branch
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...branchKeys.all, 'tenant', restoredBranch.tenantId] })
    },
  })
}

// Get branch users query
export function useBranchUsers(branchId: string) {
  return useQuery({
    queryKey: [...branchKeys.all, 'users', branchId],
    queryFn: () => branchesApi.getBranchUsers(branchId),
    enabled: !!branchId,
  })
}

// Bulk reassign users mutation
export function useBulkReassignUsers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fromBranchId, data }: {
      fromBranchId: string
      data: { userIds: string[]; toBranchId: string; reason?: string }
    }) => branchesApi.bulkReassignUsers(fromBranchId, data),
    onSuccess: (result, { fromBranchId, data }) => {
      // Invalidate branch user lists for both source and target branches
      queryClient.invalidateQueries({ queryKey: [...branchKeys.all, 'users', fromBranchId] })
      queryClient.invalidateQueries({ queryKey: [...branchKeys.all, 'users', data.toBranchId] })
      
      // Invalidate branch lists to update user counts
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
    },
  })
}

// Force delete branch mutation
export function useForceDeleteBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ branchId, data }: {
      branchId: string
      data: { reason: string; confirmationText: string }
    }) => branchesApi.forceDelete(branchId, data),
    onSuccess: (_, { branchId }) => {
      // Invalidate all branch-related queries
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...branchKeys.all, 'tenant'] })
      queryClient.invalidateQueries({ queryKey: branchKeys.detail(branchId) })
    },
  })
}
