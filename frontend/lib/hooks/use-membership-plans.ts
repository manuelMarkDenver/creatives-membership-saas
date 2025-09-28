import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getMembershipPlans,
  getActiveMembershipPlans,
  getMembershipPlanStats,
  getMembershipPlan,
  createMembershipPlan,
  updateMembershipPlan,
  toggleMembershipPlanStatus,
  deleteMembershipPlan,
  type CreateMembershipPlanData,
  type UpdateMembershipPlanData,
  type MembershipPlan
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
      try {
        const response = await getActiveMembershipPlans()
        return response.success ? response.data : []
      } catch (error) {
        console.warn('API not available, using fallback mock data:', error)
        // Fallback mock data when API is not available
        return [
          {
            id: 'mock-1',
            tenantId: 'tenant-1',
            name: 'Day Pass',
            description: 'Single day gym access',
            price: 150,
            duration: 1,
            type: 'DAY_PASS',
            benefits: ['Full gym access for 1 day', 'Use of all equipment', 'Locker access'],
            isActive: true,
            memberCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'mock-2',
            tenantId: 'tenant-1', 
            name: 'Student Monthly',
            description: 'Discounted membership for students',
            price: 800,
            duration: 30,
            type: 'STUDENT',
            benefits: ['Unlimited gym access', 'Group classes included', 'Student discount'],
            isActive: true,
            memberCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
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
    mutationFn: async (data: CreateMembershipPlanData) => {
      const response = await createMembershipPlan(data)
      return response
    },
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
    mutationFn: async (id: string) => {
      const response = await toggleMembershipPlanStatus(id)
      return response
    },
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
    mutationFn: async (id: string) => {
      const response = await deleteMembershipPlan(id)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] })
    }
  })
}
