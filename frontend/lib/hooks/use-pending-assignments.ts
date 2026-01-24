import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi } from '@/lib/api/gym-members'
import { useProfile } from './use-gym-users'
import { useBranchesByTenant } from './use-branches'
import { toast } from 'react-toastify'

export interface PendingAssignment {
  gymId: string
  memberId: string
  memberName: string
  purpose: 'ONBOARD' | 'REPLACE' | 'RECLAIM'
  expiresAt: string
  isExpired: boolean
  expectedUidMasked?: string
  mismatch?: {
    expectedUidMasked?: string
    tappedUidMasked?: string
  }
}

export function usePendingAssignments() {
  const { data: profile } = useProfile()
  const { data: branches, isLoading: branchesLoading } = useBranchesByTenant(profile?.tenantId || '', {
    includeDeleted: false,
  })

  // Get accessible branches - for owners/super admins, all branches; for others, their assigned branches
  const accessibleBranchIds = (() => {
    if (!profile || !branches) return []
    
    // Owners and super admins can see all branches
    if (profile.role === 'OWNER' || profile.role === 'SUPER_ADMIN') {
      return branches.map((b: any) => b.id)
    }
    
    // For other roles, use their assigned branches from userBranches
    return profile.userBranches?.map(ub => ub.branchId) || []
  })()

  console.log('Pending assignments hook - Profile:', profile)
  console.log('Pending assignments hook - Branches:', branches)
  console.log('Pending assignments hook - Accessible branch IDs:', accessibleBranchIds)

  return useQuery<PendingAssignment[]>({
    queryKey: ['pending-assignments', profile?.id, accessibleBranchIds.join(',')],
    queryFn: async () => {
      if (!profile?.id || accessibleBranchIds.length === 0) {
        console.log('Skipping pending assignments fetch: no profile or branches')
        return []
      }

      const pendingAssignments: PendingAssignment[] = []

      // Check each accessible branch for pending assignments
      for (const branchId of accessibleBranchIds) {
        try {
          console.log(`Fetching pending assignment for branch: ${branchId}`)
          const pending = await membersApi.getPendingAssignment(branchId)
          console.log(`Branch ${branchId} pending:`, pending)
          if (pending) {
            pendingAssignments.push({
              ...pending,
              purpose: pending.purpose as 'ONBOARD' | 'REPLACE' | 'RECLAIM',
              isExpired: pending.isExpired || new Date(pending.expiresAt) < new Date(),
            })
          }
        } catch (error: any) {
          console.warn(`No pending assignment for branch ${branchId}:`, error.message)
        }
      }
      
      console.log(`Total pending assignments found: ${pendingAssignments.length}`)

      return pendingAssignments
    },
    enabled: !!profile?.id && !branchesLoading && accessibleBranchIds.length > 0,
    refetchInterval: 5000, // Poll every 5 seconds for testing
    refetchOnWindowFocus: true,
  })
}

export function useCancelPendingAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ gymId }: { gymId: string }) => {
      return membersApi.cancelPendingAssignment(gymId)
    },
    onSuccess: (_, { gymId }) => {
      toast.success('Pending assignment cancelled')
      // Invalidate all pending assignment queries
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['pending-assignment'] })
      queryClient.invalidateQueries({ queryKey: ['pending-assignment-dashboard'] })
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel: ${error.response?.data?.message || error.message}`)
    },
  })
}

export function useRestartPendingReclaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, gymId }: { memberId: string; gymId?: string }) => {
      return membersApi.restartPendingReclaim(memberId, gymId)
    },
    onSuccess: () => {
      toast.success('Reclaim timer restarted (10 minutes)')
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] })
    },
    onError: (error: any) => {
      toast.error(`Failed to restart: ${error.response?.data?.message || error.message}`)
    },
  })
}