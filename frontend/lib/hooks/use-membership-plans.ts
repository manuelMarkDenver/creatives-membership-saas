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
    queryKey: ['membership-plans-v4'], // Completely fresh cache key
    queryFn: async () => {
      try {
        console.log('🔄 Fetching membership plans...')
        const response = await getMembershipPlans()
        console.log('📥 Membership plans response:', response)
        console.log('📥 Raw response data:', response?.data)
        console.log('📥 Response success:', response?.success)
        
        // Ensure we extract the actual data array from the API response
        let result
        if (response && (response.success === true || response.success === 'true')) {
          // Handle nested response structure: response.data.data
          if (Array.isArray(response.data?.data)) {
            result = response.data.data
            console.log('✅ Using response.data.data (nested success path):', result)
          } else if (Array.isArray(response.data)) {
            result = response.data
            console.log('✅ Using response.data (direct success path):', result)
          } else {
            result = []
            console.log('⚠️ Success response but no valid data array found')
          }
        } else if (response && Array.isArray(response)) {
          result = response
          console.log('✅ Using direct response (array path):', result)
        } else {
          result = []
          console.log('⚠️ Using empty array fallback')
        }
        
        console.log('✅ Final result being returned:', result, 'Type:', typeof result, 'IsArray:', Array.isArray(result), 'Length:', result.length)
        
        // Force the return with explicit logging
        const finalResult = [...result] // Create new array reference
        console.log('🚀 Spreading result for React Query:', finalResult)
        return finalResult
      } catch (error) {
        console.error('❌ Failed to fetch membership plans:', error)
        return []
      }
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
    cacheTime: 0, // Legacy cache time
    retry: false, // Disable retry for debugging
    refetchOnWindowFocus: false, // Disable to avoid confusion during debugging
    refetchOnMount: true,
    refetchInterval: false
  })
  
  // More detailed debugging
  console.log('🎯 Hook detailed debug:', {
    'queryResult.data': queryResult.data,
    'queryResult.data type': typeof queryResult.data,
    'queryResult.data isArray': Array.isArray(queryResult.data),
    'queryResult.data length': queryResult.data?.length,
    'queryResult.data JSON': JSON.stringify(queryResult.data),
    'queryResult.status': queryResult.status,
    'queryResult.isLoading': queryResult.isLoading,
    'queryResult.isFetching': queryResult.isFetching,
    'queryResult.isSuccess': queryResult.isSuccess,
    'queryResult.error': queryResult.error,
    'queryResult.dataUpdatedAt': queryResult.dataUpdatedAt,
    'entire queryResult': queryResult
  })
  
  return queryResult
}

// TEMPORARY: Bypass React Query entirely for debugging
export const useMembershipPlansBypass = () => {
  const [data, setData] = React.useState([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        console.log('🚀 BYPASS: Fetching directly...')
        const response = await getMembershipPlans()
        console.log('🚀 BYPASS: Response:', response)
        
        if (response && (response.success === true || response.success === 'true')) {
          // Handle nested response structure: response.data.data
          if (Array.isArray(response.data?.data)) {
            setData(response.data.data)
            console.log('🚀 BYPASS: Setting data from nested structure:', response.data.data)
          } else if (Array.isArray(response.data)) {
            setData(response.data)
            console.log('🚀 BYPASS: Setting data from direct structure:', response.data)
          } else {
            setData([])
            console.log('🚀 BYPASS: Success response but no valid data array')
          }
        } else {
          // Debug why the condition failed
          console.log('🚀 BYPASS: Condition check failed:')
          console.log('  - response exists:', !!response)
          console.log('  - response.success:', response?.success, typeof response?.success)
          console.log('  - response.success === true:', response?.success === true)
          console.log('  - response.data is array:', Array.isArray(response?.data))
          console.log('  - response.data:', response?.data)
          
          setData([])
          console.log('🚀 BYPASS: No valid data, setting empty array')
        }
      } catch (err) {
        console.error('🚀 BYPASS: Error:', err)
        setError(err)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  return { data, isLoading, error, refetch: () => {} }
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
