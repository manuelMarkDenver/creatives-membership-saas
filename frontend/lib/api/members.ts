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
  // Update member
  async updateMember(memberId: string, data: any): Promise<MemberActionResponse> {
    const response = await apiClient.patch(`/members/${memberId}`, data)
    return response.data
  },

  // Activate member
  async activateMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/members/${memberId}/activate`, data)
    return response.data
  },

  // Cancel member
  async cancelMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/members/${memberId}/cancel`, data)
    return response.data
  },

  // Restore member
  async restoreMember(memberId: string, data: MemberActionRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/members/${memberId}/restore`, data)
    return response.data
  },

  // Renew member subscription
  async renewMemberSubscription(memberId: string, data: MemberRenewRequest): Promise<MemberActionResponse> {
    const response = await apiClient.post(`/members/${memberId}/renew`, data)
    return response.data
  },

  // Get member status
  async getMemberStatus(memberId: string): Promise<any> {
    const response = await apiClient.get(`/members/${memberId}/status`)
    return response.data
  },

  // Get member history
  async getMemberHistory(memberId: string, params?: MemberHistoryQuery): Promise<MemberHistoryResponse> {
    const response = await apiClient.get(`/members/${memberId}/history`, { params })
    return response.data
  },

  // Get action reasons
  async getActionReasons(): Promise<any> {
    const response = await apiClient.get('/members/action-reasons')
    return response.data
  }
}
