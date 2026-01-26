import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { onboardingApi, OnboardingStatus } from '@/lib/api/onboarding'
import { branchesApi } from '@/lib/api/branches'
import { createMembershipPlan, getActiveMembershipPlans } from '@/lib/api/membership-plans'
import { membersApi } from '@/lib/api/gym-members'
import { apiClient, authApi } from '@/lib/api/client'
import { tenantsApi } from '@/lib/api/tenants'
import { usersApi } from '@/lib/api/gym-users'
import { BusinessCategory } from '@/types'

// Query keys
export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
}

// Query keys
export const onboardingKeys = {
  all: ['onboarding'] as const,
  status: (tenantId: string) => [...onboardingKeys.all, 'status', tenantId] as const,
}

/**
 * Hook to get current user info
 */
export function useUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: async () => {
      const response = await apiClient.get('/auth/me')
      return response.data?.user
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
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
  const { data: user } = useUser()
  const markPasswordChanged = useMarkPasswordChanged()
  const completeOnboarding = useCompleteOnboarding()

  // Modal states
  const [showBusinessModal, setShowBusinessModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)

  // Track current main branch for customization
  const [mainBranch, setMainBranch] = useState<any>(null)

  // Track if we've already handled Google OAuth password skip
  const [googlePasswordSkipped, setGooglePasswordSkipped] = useState(false)

  // Track if business details have been set
  const [businessDetailsSet, setBusinessDetailsSet] = useState(false)

  // Track if branch has been customized
  const [branchCustomized, setBranchCustomized] = useState(false)

  // Reset flags when tenantId changes
  useEffect(() => {
    setGooglePasswordSkipped(false)
    setBusinessDetailsSet(false)
    setBranchCustomized(false)
  }, [tenantId])

  // Determine which modal should be shown based on onboarding status
  useEffect(() => {
    if (!status || isLoading || !user) return

    // Close all modals first
    setShowBusinessModal(false)
    setShowPasswordModal(false)
    setShowBranchModal(false)
    setShowPlanModal(false)

    // If onboarding is complete, don't show any modals
    if (status.isOnboardingComplete) return

    // For Google OAuth users, skip password setup and mark as changed (only once)
    if (!status.hasChangedPassword && user.authProvider === 'GOOGLE' && !googlePasswordSkipped) {
      // Automatically mark password as changed for Google OAuth users
      setGooglePasswordSkipped(true)
      markPasswordChanged.mutateAsync(tenantId!).catch((error) => {
        console.error('Failed to mark password as changed for Google OAuth user:', error)
        setGooglePasswordSkipped(false) // Reset on error to allow retry
      })
      // Don't return - allow the flow to continue and show business modal after password is marked changed
    }

    // Show modals in sequence based on what's been completed
    if (!status.hasChangedPassword) {
      setShowPasswordModal(true)
    } else if (user.authProvider === 'GOOGLE' && !businessDetailsSet) {
      // For Google OAuth users, show business details modal first
      setShowBusinessModal(true)
    } else if (!branchCustomized) {
      // After business details or password is set, show branch modal for customization
      setShowBranchModal(true)
    } else if (!status.hasMembershipPlans) {
      // Skip plan modal for v1 - automatically complete onboarding
      // After branch is customized, complete onboarding without plan
      if (tenantId) {
        completeOnboarding.mutateAsync(tenantId).catch((error) => {
          console.error('Failed to complete onboarding without plan:', error)
        })
      }
    }
  }, [status, isLoading, user, tenantId, markPasswordChanged, businessDetailsSet])

  /**
    * Handle business details setup
    */
  const handleBusinessDetailsSet = useCallback(
    async (data: { name: string; category: BusinessCategory; phoneNumber?: string; address?: string }) => {
      if (!tenantId) throw new Error('Tenant ID is required')
      if (!user) throw new Error('User information not available')

      // Update tenant name, category, address, and phone
      await tenantsApi.updateCurrent({
        name: data.name,
        category: data.category,
        address: data.address,
        phoneNumber: data.phoneNumber,
      })

      // Mark business details as set
      setBusinessDetailsSet(true)
      setShowBusinessModal(false)
      await refetch()
    },
    [tenantId, user, refetch]
  )

  /**
    * Handle password setup
    */
  const handlePasswordSet = useCallback(
    async (newPassword: string) => {
      if (!tenantId) throw new Error('Tenant ID is required')
      if (!user) throw new Error('User information not available')

      // Check if user is Google OAuth user
      if (user.authProvider === 'GOOGLE') {
        // Use Google OAuth password endpoint (no token required)
        await apiClient.post('/auth/set-google-password', {
          password: newPassword,
        })
      } else {
        // Use regular email verification flow
        // Try to get verification token from localStorage first
        let verificationToken = localStorage.getItem('verification_token')

        // If token not found, try to get it from the user record in the database
        if (!verificationToken && user.emailVerificationToken) {
          verificationToken = user.emailVerificationToken
        }

        if (!verificationToken) {
          throw new Error('Verification token not found. Please contact support or try registering again.')
        }

        // Call the set initial password endpoint
        await apiClient.post('/auth/set-initial-password', {
          token: verificationToken,
          password: newPassword,
        })

        // Clear the verification token after use
        localStorage.removeItem('verification_token')
      }

      // Mark password as changed in onboarding
      await markPasswordChanged.mutateAsync(tenantId)

      // Close password modal and refresh status
      setShowPasswordModal(false)
      await refetch()
    },
    [tenantId, user, markPasswordChanged, refetch]
  )

  /**
   * Handle branch customization
   */
  const handleBranchCustomized = useCallback(
    async (data: { name: string; address: string; phoneNumber?: string; email?: string }) => {
      if (!mainBranch) throw new Error('Branch not found')

      // Update the branch
      await branchesApi.update(mainBranch.id, data)

      // Mark branch as customized and complete onboarding (skip plan step)
      setBranchCustomized(true)
      setShowBranchModal(false)
      if (tenantId) {
        await completeOnboarding.mutateAsync(tenantId)
      }
      await refetch()
    },
    [mainBranch, refetch]
  )





  /**
   * Fetch main branch for customization
   */
  useEffect(() => {
    const fetchMainBranch = async () => {
      if (!tenantId || !status) return
      if (status.hasMembershipPlans || branchCustomized) return // Already past this step

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
  }, [tenantId, status, branchCustomized])

  return {
    // Status
    status,
    isLoading,
    isOnboardingComplete: status?.isOnboardingComplete || false,

    // Modal states
    showBusinessModal,
    showPasswordModal,
    showBranchModal,
    showPlanModal,

    // Data
    mainBranch,

    // Handlers
    handleBusinessDetailsSet,
    handlePasswordSet,
    handleBranchCustomized,

    // Utils
    refetchStatus: refetch,
  }
}
