'use client'

import { useOnboardingFlow } from '@/lib/hooks/use-onboarding'
import SetPasswordModal from '@/components/modals/onboarding/set-password-modal'
import CustomizeBranchModal from '@/components/modals/onboarding/customize-branch-modal'
import CreateMembershipPlanModal from '@/components/modals/onboarding/create-membership-plan-modal'
import OnboardingProgress, { createOnboardingSteps } from '@/components/onboarding-progress'

interface OnboardingWrapperProps {
  tenantId: string | null
  children: React.ReactNode
}

/**
 * OnboardingWrapper component
 * 
 * This component wraps your main app layout and manages the onboarding flow.
 * It automatically shows the appropriate onboarding modals based on the tenant's
 * onboarding status and prevents access to the main app until onboarding is complete.
 * 
 * Usage:
 * ```tsx
 * <OnboardingWrapper tenantId={user.tenantId}>
 *   <YourMainAppContent />
 * </OnboardingWrapper>
 * ```
 */
export default function OnboardingWrapper({ tenantId, children }: OnboardingWrapperProps) {
  const {
    status,
    isLoading,
    isOnboardingComplete,
    showPasswordModal,
    showBranchModal,
    showPlanModal,
    mainBranch,
    handlePasswordSet,
    handleBranchCustomized,
    handlePlanCreated,
  } = useOnboardingFlow(tenantId)

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    )
  }

  // If onboarding is complete, render the main app
  if (isOnboardingComplete) {
    return <>{children}</>
  }

  // Show onboarding UI with progress and modals
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Let&apos;s get your account set up in just a few steps
          </p>
        </div>

        {/* Progress Indicator */}
        {status && (
          <div className="max-w-3xl mx-auto mb-8">
            <OnboardingProgress
              steps={createOnboardingSteps({
                hasChangedPassword: status.hasChangedPassword,
                hasMembershipPlans: status.hasMembershipPlans,
                hasMembers: false, // No longer used
                isOnboardingComplete: status.isOnboardingComplete,
              })}
            />
          </div>
        )}

        {/* Onboarding Modals */}
        <SetPasswordModal
          open={showPasswordModal}
          onPasswordSet={handlePasswordSet}
        />

        <CustomizeBranchModal
          open={showBranchModal}
          branch={mainBranch}
          onBranchCustomized={handleBranchCustomized}
        />

        <CreateMembershipPlanModal
          open={showPlanModal}
          onPlanCreated={handlePlanCreated}
        />
      </div>
    </div>
  )
}
