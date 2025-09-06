import { useQuery } from '@tanstack/react-query'
import { useUsersByTenant } from '@/lib/hooks/use-users'
import { gymSubscriptionsApi } from '@/lib/api'
import { User, Role } from '@/types'

export interface GymMemberWithSubscriptions extends User {
  gymSubscriptions?: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    cancelledAt?: string | null
    branchId?: string
    createdAt?: string
    price?: number
    currency?: string
    membershipPlan?: {
      id: string
      name: string
      price: number
      duration: number
      type: string
    }
  }>
}

// Query keys
export const gymMemberKeys = {
  all: ['gym-members'] as const,
  withSubscriptions: (tenantId: string) => [...gymMemberKeys.all, 'with-subscriptions', tenantId] as const,
}

/**
 * Custom hook to fetch gym members with their subscription data
 * This combines user data from the users API with subscription data from gym-subscriptions API
 */
export function useGymMembersWithSubscriptions(tenantId: string, options?: { enabled?: boolean }) {
  const { data: members, isLoading: isLoadingMembers, error: membersError } = useUsersByTenant(
    tenantId,
    { role: 'CLIENT' as Role }
  )

  return useQuery<GymMemberWithSubscriptions[]>({
    queryKey: gymMemberKeys.withSubscriptions(tenantId),
    queryFn: async () => {
      if (!members || members.length === 0) {
        return []
      }

      // Fetch subscription data for each member
      const membersWithSubscriptions = await Promise.all(
        members.map(async (member: User) => {
          try {
            // Get subscription history for this member (most recent first)
            const subscriptionHistory = await gymSubscriptionsApi.getSubscriptionHistory(member.id)
            
            // Transform the subscription data to match our expected structure
            const gymSubscriptions = subscriptionHistory.map((sub: any) => ({
              id: sub.id,
              status: sub.status,
              startDate: sub.startDate,
              endDate: sub.endDate,
              cancelledAt: sub.cancelledAt,
              branchId: sub.branchId,
              createdAt: sub.createdAt,
              price: sub.price,
              currency: sub.currency,
              membershipPlan: sub.membershipPlan ? {
                id: sub.membershipPlan.id,
                name: sub.membershipPlan.name,
                price: sub.membershipPlan.price,
                duration: sub.membershipPlan.duration,
                type: sub.membershipPlan.type,
              } : undefined
            }))

            return {
              ...member,
              gymSubscriptions
            } as GymMemberWithSubscriptions
          } catch (error) {
            console.error(`Failed to fetch subscriptions for member ${member.id}:`, error)
            // Return member without subscription data if fetch fails
            return {
              ...member,
              gymSubscriptions: []
            } as GymMemberWithSubscriptions
          }
        })
      )

      return membersWithSubscriptions
    },
    enabled: !!members && (options?.enabled ?? true),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
