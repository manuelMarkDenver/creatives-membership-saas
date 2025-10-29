import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { onboardingApi, OnboardingStatus } from '@/lib/api/onboarding'
import { branchesApi } from '@/lib/api/branches'
import { createMembershipPlan } from '@/lib/api/membership-plans'
import { membersApi } from '@/lib/api/gym-members'
import { usersApi } from '@/lib/api/gym-users'

// Query keys
export const onboardingKeys = {
  all: ['onboarding'] as const,
  status: (tenantId: string) => [...onboardingKeys.all, 'status', tenantId] as const,
}

/**
 * Hook to get onboarding status for a tenant
 */
export function useOnboardingStatus(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: onboardingKeys.status(tenantId || ''),
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required')
      return onboardingApi.getStatus(tenantId)
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to mark password as changed
 */
export function useMarkPasswordChanged() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => onboardingApi.markPasswordChanged(tenantId),
    onSuccess: (_, tenantId) => {
      // Invalidate onboarding status to refresh
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status(tenantId) })
    },
  })
}

/**
 * Hook to mark onboarding as complete
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => onboardingApi.completeOnboarding(tenantId),
    onSuccess: (_, tenantId) => {
      // Invalidate onboarding status
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status(tenantId) })
      // Also invalidate tenant data as it might have changed
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

/**
 * Main onboarding orchestration hook
 * Manages the entire onboarding flow and modal states
 */
export function useOnboardingFlow(tenantId: string | null | undefined) {
  const { data: status, isLoading, refetch } = useOnboardingStatus(tenantId)
  const markPasswordChanged = useMarkPasswordChanged()
  const completeOnboarding = useCompleteOnboarding()

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)

  // Track current main branch for customization
  const [mainBranch, setMainBranch] = useState<any>(null)

  // Determine which modal should be shown based on onboarding status
  useEffect(() => {
    if (!status || isLoading) return

    // Close all modals first
    setShowPasswordModal(false)
    setShowBranchModal(false)
    setShowPlanModal(false)
    setShowMemberModal(false)

    // If onboarding is complete, don't show any modals
    if (status.isOnboardingComplete) return

    // Show modals in sequence based on what's been completed
    if (!status.hasChangedPassword) {
      setShowPasswordModal(true)
    } else if (!status.hasMembershipPlans) {
      // After password is set, show branch modal, then plan modal
      setShowBranchModal(true)
    } else if (!status.hasMembers) {
      // After plans are created, optionally show member modal
      setShowMemberModal(true)
    }
  }, [status, isLoading])

  /**
   * Handle password setup
   */
  const handlePasswordSet = useCallback(
    async (tempPassword: string, newPassword: string) => {
      if (!tenantId) throw new Error('Tenant ID is required')

      // Call the password change endpoint (assumes you have this in usersApi)
      await usersApi.changePassword({ currentPassword: tempPassword, newPassword })

      // Mark password as changed in onboarding
      await markPasswordChanged.mutateAsync(tenantId)

      // Close password modal and refresh status
      setShowPasswordModal(false)
      await refetch()
    },
    [tenantId, markPasswordChanged, refetch]
  )

  /**
   * Handle branch customization
   */
  const handleBranchCustomized = useCallback(
    async (data: { name: string; address: string; phoneNumber?: string; email?: string }) => {
      if (!mainBranch) throw new Error('Branch not found')

      // Update the branch
      await branchesApi.update(mainBranch.id, data)

      // Close branch modal and move to next step
      setShowBranchModal(false)
      setShowPlanModal(true)
      await refetch()
    },
    [mainBranch, refetch]
  )

  /**
   * Handle membership plan creation
   */
  const handlePlanCreated = useCallback(
    async (data: {
      name: string
      description?: string
      price: number
      duration: number
      type: string
      accessLevel: string
    }) => {
      // Create the membership plan
      await createMembershipPlan(data)

      // Close plan modal and refresh status
      setShowPlanModal(false)
      await refetch()
    },
    [refetch]
  )

  /**
   * Handle first member addition
   */
  const handleMemberAdded = useCallback(
    async (data: {
      firstName: string
      lastName: string
      email: string
      phoneNumber?: string
      gender?: string
    }) => {
      // Add the member
      await membersApi.createGymMember(data)

      // Close member modal and complete onboarding
      setShowMemberModal(false)
      if (tenantId) {
        await completeOnboarding.mutateAsync(tenantId)
      }
      await refetch()
    },
    [tenantId, completeOnboarding, refetch]
  )

  /**
   * Handle skipping member addition
   */
  const handleSkipMember = useCallback(async () => {
    setShowMemberModal(false)
    if (tenantId) {
      await completeOnboarding.mutateAsync(tenantId)
    }
    await refetch()
  }, [tenantId, completeOnboarding, refetch])

  /**
   * Fetch main branch for customization
   */
  useEffect(() => {
    const fetchMainBranch = async () => {
      if (!tenantId || !status) return
      if (status.hasMembershipPlans) return // Already past this step

      try {
        const branches = await branchesApi.getByTenant(tenantId)
        const main = branches.find((b: any) => b.name === 'Main Branch' || b.isMainBranch)
        if (main) {
          setMainBranch(main)
        }
      } catch (error) {
        console.error('Failed to fetch main branch:', error)
      }
    }

    fetchMainBranch()
  }, [tenantId, status])

  return {
    // Status
    status,
    isLoading,
    isOnboardingComplete: status?.isOnboardingComplete || false,

    // Modal states
    showPasswordModal,
    showBranchModal,
    showPlanModal,
    showMemberModal,

    // Data
    mainBranch,

    // Handlers
    handlePasswordSet,
    handleBranchCustomized,
    handlePlanCreated,
    handleMemberAdded,
    handleSkipMember,

    // Utils
    refetchStatus: refetch,
  }
}
