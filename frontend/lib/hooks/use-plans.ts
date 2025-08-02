import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { plansApi, Plan, CreatePlanData, UpdatePlanData } from '@/lib/api/plans'

// Query keys
export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  list: (filters: string) => [...planKeys.lists(), { filters }] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (id: string) => [...planKeys.details(), id] as const,
  subscriptions: (id: string) => [...planKeys.all, 'subscriptions', id] as const,
}

// Get all plans
export function usePlans() {
  return useQuery({
    queryKey: planKeys.list('all'),
    queryFn: () => plansApi.getAllPlans(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get active plans only
export function useActivePlans() {
  return useQuery({
    queryKey: planKeys.list('active'),
    queryFn: () => plansApi.getActivePlans(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get plan by ID
export function usePlan(id: string) {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: () => plansApi.getPlanById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get plan subscriptions
export function usePlanSubscriptions(id: string) {
  return useQuery({
    queryKey: planKeys.subscriptions(id),
    queryFn: () => plansApi.getPlanSubscriptions(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Create plan mutation
export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePlanData) => plansApi.createPlan(data),
    onSuccess: () => {
      // Invalidate plan lists
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
    },
  })
}

// Update plan mutation
export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanData }) => 
      plansApi.updatePlan(id, data),
    onSuccess: (updatedPlan) => {
      // Update the specific plan in the cache
      queryClient.setQueryData(planKeys.detail(updatedPlan.id), updatedPlan)
      
      // Invalidate plan lists
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
    },
  })
}

// Delete plan mutation
export function useDeletePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => plansApi.deletePlan(id),
    onSuccess: (_, id) => {
      // Remove the plan from cache
      queryClient.removeQueries({ queryKey: planKeys.detail(id) })
      
      // Invalidate plan lists
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
    },
  })
}

// Toggle plan status mutation
export function useTogglePlanStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => plansApi.togglePlanStatus(id),
    onSuccess: (updatedPlan) => {
      // Update the specific plan in the cache
      queryClient.setQueryData(planKeys.detail(updatedPlan.id), updatedPlan)
      
      // Invalidate plan lists
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
    },
  })
}
