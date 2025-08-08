import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi } from '../api/members'
import { userKeys } from './use-users'
import type { 
  MemberActionRequest, 
  MemberRenewRequest, 
  MemberHistoryQuery 
} from '../api/members'

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
      
      // Invalidate customer subscription data
      queryClient.invalidateQueries({ 
        queryKey: ['customer-subscriptions', 'subscription', memberId] 
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
    onSuccess: (_, { memberId }) => {
      // Invalidate member status and history
      queryClient.invalidateQueries({ queryKey: memberKeys.status(memberId) })
      queryClient.invalidateQueries({ 
        queryKey: [...memberKeys.all, 'history', memberId]
      })
      
      // Invalidate user data to refresh member list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] })
      
      // Invalidate customer subscription data
      queryClient.invalidateQueries({ 
        queryKey: ['customer-subscriptions', 'subscription', memberId] 
      })
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
      
      // Invalidate customer subscription data
      queryClient.invalidateQueries({ 
        queryKey: ['customer-subscriptions', 'subscription', memberId] 
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
    onSuccess: (_, { memberId }) => {
      // Invalidate member status and history
      queryClient.invalidateQueries({ queryKey: memberKeys.status(memberId) })
      queryClient.invalidateQueries({ 
        queryKey: [...memberKeys.all, 'history', memberId]
      })
      
      // Invalidate user data to refresh member list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] })
      
      // Invalidate customer subscription data
      queryClient.invalidateQueries({ 
        queryKey: ['customer-subscriptions', 'subscription', memberId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['customer-subscriptions', 'history', memberId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['customer-subscriptions', 'transactions', memberId] 
      })
    },
  })
}
