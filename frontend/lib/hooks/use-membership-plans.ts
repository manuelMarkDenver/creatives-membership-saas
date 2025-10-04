import React from 'react'
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
  const queryResult = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      try {
        const response = await getMembershipPlans()
        
        // Handle nested response structure
        let result
        if (response && (response as any).success === true) {
          const responseData = (response as any).data
          if (Array.isArray(responseData?.data)) {
            result = responseData.data
          } else if (Array.isArray(responseData)) {
            result = responseData
          } else {
            result = []
          }
        } else if (response && Array.isArray(response)) {
          result = response
        } else {
          result = []
        }
        
        return [...result]
      } catch (error) {
        return []
      }
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
    retry: false, // Disable retry for debugging
    refetchOnWindowFocus: false, // Disable to avoid confusion during debugging
    refetchOnMount: true,
    refetchInterval: false
  })
  
  
  return queryResult
}

// Get active membership plans for current tenant
export const useActiveMembershipPlans = () => {
  return useQuery({
    queryKey: ['membership-plans', 'active'],
    queryFn: async () => {
      try {
        const response = await getActiveMembershipPlans()
        
        // Debug logging - remove after fixing
        console.log('🔍 useActiveMembershipPlans response:', response)
        
        // Handle nested response structure where fetchApi wraps the API response
        // API returns: {success: true, data: [...]}
        // fetchApi returns: {success: true, data: {success: true, data: [...]}}
        if (response.success) {
          const actualData = response.data
          
          // Check if it's double-wrapped (fetchApi wrapped the API response)
          if (actualData && typeof actualData === 'object' && 'success' in actualData && 'data' in actualData) {
            if (actualData.success && Array.isArray(actualData.data)) {
              return actualData.data
            }
          }
          // Check if it's direct array (in case API structure changes)
          else if (Array.isArray(actualData)) {
            return actualData
          }
        }
        
        // Return empty array if API call succeeds but no data
        return []
      } catch (error) {
        // Return empty array when API fails - this allows proper UX flow
        // for new tenants who haven't created plans yet
        return []
      }
    },
    staleTime: 0, // Always refetch during debugging
    gcTime: 0, // Don't cache during debugging
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
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
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await deleteMembershipPlan(id, reason)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] })
    }
  })
}
