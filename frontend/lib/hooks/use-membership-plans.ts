import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getMembershipPlans,
  getActiveMembershipPlans,
  getAllTenantMembershipPlans,
  getMembershipPlanStats,
  getMembershipPlan,
  createMembershipPlan,
  updateMembershipPlan,
  toggleMembershipPlanStatus,
  deleteMembershipPlan,
  type CreateMembershipPlanData,
  type UpdateMembershipPlanData,
  type MembershipPlan,
  type TenantPlanGroup
} from '../api/membership-plans'

// Get all membership plans for current tenant
export const useMembershipPlans = () => {
  return useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const response = await getMembershipPlans()
      return response.success ? response.data : []
    }
  })
}

// Get active membership plans for current tenant
export const useActiveMembershipPlans = () => {
  return useQuery({
    queryKey: ['membership-plans', 'active'],
    queryFn: async () => {
      const response = await getActiveMembershipPlans()
      return response.success ? response.data : []
    }
  })
}

// Get all tenant membership plans (Super Admin only)
export const useAllTenantMembershipPlans = () => {
  return useQuery({
    queryKey: ['membership-plans', 'all-tenants'],
    queryFn: async () => {
      const response = await getAllTenantMembershipPlans()
      return response.success ? response.data : []
    }
  })
}

// Get membership plan statistics for current tenant
export const useMembershipPlanStats = () => {
  return useQuery({
    queryKey: ['membership-plans', 'stats'],
    queryFn: async () => {
      const response = await getMembershipPlanStats()
      return response.success ? response.data : null
    }
  })
}

// Get a specific membership plan
export const useMembershipPlan = (id: string) => {
  return useQuery({
    queryKey: ['membership-plans', id],
    queryFn: async () => {
      const response = await getMembershipPlan(id)
      return response.success ? response.data : null
    },
    enabled: !!id
  })
}

// Create membership plan mutation
export const useCreateMembershipPlan = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateMembershipPlanData) => createMembershipPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] })
    }
  })
}

// Update membership plan mutation
export const useUpdateMembershipPlan = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMembershipPlanData }) => 
      updateMembershipPlan(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] })
      queryClient.invalidateQueries({ queryKey: ['membership-plans', id] })
    }
  })
}

// Toggle membership plan status mutation
export const useToggleMembershipPlanStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => toggleMembershipPlanStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] })
      queryClient.invalidateQueries({ queryKey: ['membership-plans', id] })
    }
  })
}

// Delete membership plan mutation
export const useDeleteMembershipPlan = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteMembershipPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] })
    }
  })
}
