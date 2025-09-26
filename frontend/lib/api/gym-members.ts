import { apiClient } from './client'

export interface MemberActionRequest {
  reason: string
  notes?: string
}

export interface MemberRenewRequest {
  membershipPlanId: string
}

export interface MemberHistoryQuery {
  page?: number
  limit?: number
  category?: 'ACCOUNT' | 'SUBSCRIPTION' | 'PAYMENT' | 'ACCESS' | 'PROFILE' | 'LOGIN'
  startDate?: string
  endDate?: string
}

export interface MemberHistoryItem {
  id: string
  memberId: string
  action: string
  reason?: string
  notes?: string
  previousState?: string
  newState?: string
  performedAt: string
  performer?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  metadata?: any
}

export interface MemberHistoryResponse {
  logs: MemberHistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface MemberActionResponse {
  success: boolean
  message: string
  member?: any
}

export const membersApi = {
  // Update member - use gym-specific endpoint for gym members
  async updateMember(memberId: string, data: any): Promise<MemberActionResponse> {
    const response = await apiClient.patch(`/gym/users/${memberId}`, data)
    return {
      success: true,
      message: 'Member updated successfully',
      member: response.data
    }
  },

  // Activate member
  async activateMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/gym/members/${memberId}/activate`, data)
    return response.data
  },

  // Cancel member
  async cancelMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    console.log('🔥 API CALL: POST /gym/members/' + memberId + '/cancel', data)
    try {
      const response = await apiClient.post(`/gym/members/${memberId}/cancel`, data)
      console.log('✅ API SUCCESS: cancelMember response:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API ERROR: cancelMember failed:', error)
      throw error
    }
  },

  // Restore member
  async restoreMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/gym/members/${memberId}/restore`, data)
    return response.data
  },

  // Delete member (soft delete)
  async deleteMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/gym/members/${memberId}/soft-delete`, data)
    return response.data
  },

  // Renew member subscription
  async renewMemberSubscription(memberId: string, data: MemberRenewRequest): Promise<MemberActionResponse> {
    try {
      const response = await apiClient.post(`/gym/members/${memberId}/renew`, data)
      return response.data
    } catch (error: any) {
      // Enhanced error handling for renewal restrictions
      console.log('renewMemberSubscription API Error:', error)

      // Create a more comprehensive error object that React Query can handle
      if (error.response?.data?.message) {
        // Create an error that preserves the original structure but enhances the message
        const enhancedError = Object.assign(new Error(error.response.data.message), {
          name: 'RenewalError',
          response: error.response,
          status: error.response.status,
          data: error.response.data,
          // Preserve original axios error properties that React Query might expect
          config: error.config,
          request: error.request,
          code: error.code
        })

        console.log('🚀 Throwing enhanced renewal error:', enhancedError)
        throw enhancedError
      }

      // For other errors, just rethrow as-is
      throw error
    }
  },

  // Get member status
  async getMemberStatus(memberId: string): Promise<any> {
    const response = await apiClient.get(`/gym/members/${memberId}/status`)
    return response.data
  },

  // Get member history
  async getMemberHistory(memberId: string, params?: MemberHistoryQuery): Promise<MemberHistoryResponse> {
    try {
      const response = await apiClient.get(`/gym/members/${memberId}/history`, { params })
      return response.data
    } catch (error: any) {
      // If the endpoint doesn't exist (404), return empty history
      if (error.response?.status === 404) {
        return {
          logs: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      }

      throw error
    }
  },

  // Get action reasons
  async getActionReasons(): Promise<any> {
    const response = await apiClient.get('/gym/members/action-reasons')
    return response.data
  }
}
