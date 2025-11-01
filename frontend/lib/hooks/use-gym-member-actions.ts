import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi } from '../api/gym-members'
import { userKeys } from './use-gym-users'
import type {
  MemberActionRequest,
  MemberRenewRequest,
  MemberHistoryQuery
} from '../api/gym-members'

// Query keys
export const memberKeys = {
  all: ['members'] as const,
  status: (memberId: string) => [...memberKeys.all, 'status', memberId] as const,
  history: (memberId: string, query?: MemberHistoryQuery) => [...memberKeys.all, 'history', memberId, query] as const,
  actionReasons: () => [...memberKeys.all, 'action-reasons'] as const,
}

// Get member status
export function useMemberStatus(memberId: string) {
  return useQuery({
    queryKey: memberKeys.status(memberId),
    queryFn: () => membersApi.getMemberStatus(memberId),
    enabled: !!memberId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get member history
export function useMemberHistory(memberId: string, query?: MemberHistoryQuery) {
  return useQuery({
    queryKey: memberKeys.history(memberId, query),
    queryFn: () => membersApi.getMemberHistory(memberId, query),
    enabled: !!memberId,
    staleTime: 60 * 1000, // 1 minute
  })
}

// Get action reasons
export function useActionReasons() {
  return useQuery({
    queryKey: memberKeys.actionReasons(),
    queryFn: () => membersApi.getActionReasons(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Activate member mutation
export function useActivateMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: MemberActionRequest }) =>
      membersApi.activateMember(memberId, data),
    onSuccess: (_, { memberId }) => {
      // Invalidate member status and history
      queryClient.invalidateQueries({ queryKey: memberKeys.status(memberId) })
      queryClient.invalidateQueries({ 
        queryKey: [...memberKeys.all, 'history', memberId]
      })
      
      // Invalidate user data to refresh member list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] })
      
      // Invalidate gym subscription data
      queryClient.invalidateQueries({ 
        queryKey: ['gym-subscriptions', 'subscription', memberId] 
      })
    },
  })
}

// Cancel member mutation
export function useCancelMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: MemberActionRequest }) =>
      membersApi.cancelMember(memberId, data),
    onSuccess: (result, { memberId }) => {
      // Invalidate member status and history
      queryClient.invalidateQueries({ queryKey: memberKeys.status(memberId) })
      queryClient.invalidateQueries({ 
        queryKey: [...memberKeys.all, 'history', memberId]
      })
      
      // Invalidate user data to refresh member list - be more comprehensive
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'list'] })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] })
      
      // Force invalidation of all user queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
    onError: (error, { memberId }) => {
      console.error('❌ CANCEL MEMBER ERROR:', { error, memberId })
    },
  })
}

// Restore member mutation
export function useRestoreMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: MemberActionRequest }) =>
      membersApi.restoreMember(memberId, data),
    onSuccess: (_, { memberId }) => {
      // Invalidate member status and history
      queryClient.invalidateQueries({ queryKey: memberKeys.status(memberId) })
      queryClient.invalidateQueries({ 
        queryKey: [...memberKeys.all, 'history', memberId]
      })
      
      // Invalidate user data to refresh member list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] })
      
      // Invalidate gym subscription data
      queryClient.invalidateQueries({ 
        queryKey: ['gym-subscriptions', 'subscription', memberId] 
      })
    },
  })
}

// Renew member subscription mutation
export function useRenewMemberSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: MemberRenewRequest }) =>
      membersApi.renewMemberSubscription(memberId, data),
    onSuccess: (result, { memberId }) => {
      console.log('✅ RENEW MEMBER SUCCESS:', { result, memberId })
      
      // Invalidate member status and history
      queryClient.invalidateQueries({ queryKey: memberKeys.status(memberId) })
      queryClient.invalidateQueries({ 
        queryKey: [...memberKeys.all, 'history', memberId]
      })
      
      // Invalidate user data to refresh member list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] })
      
      // Invalidate gym subscription data
      queryClient.invalidateQueries({ 
        queryKey: ['gym-subscriptions', 'subscription', memberId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['gym-subscriptions', 'history', memberId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['gym-subscriptions', 'transactions', memberId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['gym-subscriptions', 'stats'] 
      })
    },
    onError: (error: any, { memberId }) => {
      // Since component onError is not being triggered, handle it here
      // Import toast dynamically to avoid import issues
      import('react-toastify').then(({ toast }) => {
        let errorMessage = 'Failed to renew membership'
        
        // Extract error message from the response - try multiple paths
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error?.data?.message) {
          errorMessage = error.data.message
        } else if (error?.message) {
          errorMessage = error.message
        }
        
        toast.error(errorMessage, {
          position: 'top-center',
          autoClose: 6000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      })
    },
  })
}

// Assign membership plan mutation
export function useAssignMembershipPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, membershipPlanId }: { memberId: string; membershipPlanId: string }) =>
      membersApi.assignMembershipPlan(memberId, membershipPlanId),
    onSuccess: (_, { memberId }) => {
      // Invalidate member status and history
      queryClient.invalidateQueries({ queryKey: memberKeys.status(memberId) })
      queryClient.invalidateQueries({
        queryKey: [...memberKeys.all, 'history', memberId]
      })

      // Invalidate user data to refresh member list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] })

      // Invalidate gym subscription data
      queryClient.invalidateQueries({
        queryKey: ['gym-subscriptions', 'subscription', memberId]
      })
      queryClient.invalidateQueries({
        queryKey: ['gym-subscriptions', 'history', memberId]
      })
      queryClient.invalidateQueries({
        queryKey: ['gym-subscriptions', 'transactions', memberId]
      })
      queryClient.invalidateQueries({
        queryKey: ['gym-subscriptions', 'stats']
      })
    },
    onError: (error: any, { memberId }) => {
      // Handle error with toast
      import('react-toastify').then(({ toast }) => {
        let errorMessage = 'Failed to assign membership plan'

        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error?.data?.message) {
          errorMessage = error.data.message
        } else if (error?.message) {
          errorMessage = error.message
        }

        toast.error(errorMessage, {
          position: 'top-center',
          autoClose: 6000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      })
    },
  })
}
