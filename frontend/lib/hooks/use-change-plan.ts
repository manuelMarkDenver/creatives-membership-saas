import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gymSubscriptionsApi } from '../api/gym-subscriptions'
import { userKeys } from './use-gym-users'
import { gymMemberKeys } from './use-gym-members'
import { useProfile } from './use-gym-users'

interface ChangePlanRequest {
  memberId: string
  data: {
    gymMembershipPlanId: string
    paymentAmount: number
    // v1: paymentMethod removed - always uses 'cash'
  }
}

export function useChangePlan() {
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()

  return useMutation({
    mutationFn: ({ memberId, data }: ChangePlanRequest) =>
      gymSubscriptionsApi.changePlan(memberId, data),
    onSuccess: (result, { memberId }) => {
      console.log('✅ CHANGE PLAN SUCCESS:', { result, memberId })

      // Invalidate member data
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] })

      // Invalidate gym member data
      queryClient.invalidateQueries({ queryKey: gymMemberKeys.all })
      if (profile?.tenantId) {
        queryClient.invalidateQueries({ queryKey: gymMemberKeys.withSubscriptions(profile.tenantId) })
      }

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
      console.error('❌ CHANGE PLAN ERROR:', { error, memberId })
    },
  })
}