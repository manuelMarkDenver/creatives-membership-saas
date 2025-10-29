import { apiClient } from './client'

export interface OnboardingStatus {
  tenantId: string
  tenantName: string
  isOnboardingComplete: boolean
  hasChangedPassword: boolean
  hasMembershipPlans: boolean
  hasMembers: boolean
  onboardingCompletedAt: string | null
  nextSteps: string[]
}

export interface MarkPasswordChangedResponse {
  id: string
  name: string
  ownerPasswordChanged: boolean
  updatedAt: string
}

export interface CompleteOnboardingResponse {
  id: string
  name: string
  onboardingCompletedAt: string
  updatedAt: string
}

export const onboardingApi = {
  /**
   * Get onboarding status for a tenant
   */
  getStatus: async (tenantId: string): Promise<OnboardingStatus> => {
    const response = await apiClient.get(`/tenants/${tenantId}/onboarding-status`)
    return response.data
  },

  /**
   * Mark owner password as changed (called after initial password setup)
   */
  markPasswordChanged: async (tenantId: string): Promise<MarkPasswordChangedResponse> => {
    const response = await apiClient.post(`/tenants/${tenantId}/mark-password-changed`)
    return response.data
  },

  /**
   * Mark onboarding as complete (called after all required steps are done)
   */
  completeOnboarding: async (tenantId: string): Promise<CompleteOnboardingResponse> => {
    const response = await apiClient.post(`/tenants/${tenantId}/complete-onboarding`)
    return response.data
  },
}
