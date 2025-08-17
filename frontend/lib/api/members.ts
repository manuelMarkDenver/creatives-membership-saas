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
  // Update member - use users service directly since users are business agnostic
  // (GYM_MEMBER, ECOM_CUSTOMER, COFFEE_CUSTOMER are all user roles)
  async updateMember(memberId: string, data: any): Promise<MemberActionResponse> {
    const response = await apiClient.patch(`/users/${memberId}`, data)
    return {
      success: true,
      message: 'Member updated successfully',
      member: response.data
    }
  },

  // Activate member
  async activateMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/users/${memberId}/activate`, data)
    return response.data
  },

  // Cancel member
  async cancelMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    console.log('🔥 API CALL: POST /users/' + memberId + '/cancel', data)
    try {
      const response = await apiClient.post(`/users/${memberId}/cancel`, data)
      console.log('✅ API SUCCESS: cancelMember response:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ API ERROR: cancelMember failed:', error)
      throw error
    }
  },

  // Restore member
  async restoreMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/users/${memberId}/restore`, data)
    return response.data
  },

  // Delete member (soft delete)
  async deleteMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/users/${memberId}/soft-delete`, data)
    return response.data
  },

  // Renew member subscription
  async renewMemberSubscription(memberId: string, data: MemberRenewRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/users/${memberId}/renew`, data)
    return response.data
  },

  // Get member status
  async getMemberStatus(memberId: string): Promise<any> {
    const response = await apiClient.get(`/users/${memberId}/status`)
    return response.data
  },

  // Get member history
  async getMemberHistory(memberId: string, params?: MemberHistoryQuery): Promise<MemberHistoryResponse> {
    const response = await apiClient.get(`/users/${memberId}/history`, { params })
    return response.data
  },

  // Get action reasons
  async getActionReasons(): Promise<any> {
    const response = await apiClient.get('/users/action-reasons')
    return response.data
  }
}
