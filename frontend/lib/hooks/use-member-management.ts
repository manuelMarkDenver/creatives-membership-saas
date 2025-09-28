'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// Types for the member management API
export interface MemberActionRequest {
  reason: string
  notes?: string
}

export interface MemberHistoryQuery {
  page?: number
  limit?: number
  category?: string
  startDate?: string
  endDate?: string
}

export interface MemberAuditLogEntry {
  id: string
  action: string
  reason?: string
  notes?: string
  previousState?: string
  newState?: string
  performedBy?: string
  performedAt: string
  metadata?: any
  performer?: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface MemberHistoryResponse {
  logs: MemberAuditLogEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface MemberWithStatus {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  deletedAt?: string
  // businessData removed - using separate profile tables
  currentStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'DELETED' | 'NO_SUBSCRIPTION'
  subscription?: {
    id: string
    status: string
    startDate: string
    endDate: string
    gymMembershipPlan: {
      id: string
      name: string
      price: number
      duration: number
    }
  }
}

export interface ActionReason {
  category: string
  reasons: string[]
}

// Query keys for React Query
export const memberManagementKeys = {
  all: ['member-management'] as const,
  status: (memberId: string) => [...memberManagementKeys.all, 'status', memberId] as const,
  history: (memberId: string, query?: MemberHistoryQuery) => [...memberManagementKeys.all, 'history', memberId, query] as const,
  actionReasons: () => [...memberManagementKeys.all, 'action-reasons'] as const,
}

// API functions
const memberManagementApi = {
  // Get member with status
  getMemberWithStatus: async (memberId: string): Promise<MemberWithStatus> => {
    const response = await apiClient.get(`/members/${memberId}/status`)
    return response.data
  },

  // Get member history
  getMemberHistory: async (memberId: string, query: MemberHistoryQuery = {}): Promise<MemberHistoryResponse> => {
    const params = new URLSearchParams()
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.category) params.append('category', query.category)
    if (query.startDate) params.append('startDate', query.startDate)
    if (query.endDate) params.append('endDate', query.endDate)
    
    const response = await apiClient.get(`/members/${memberId}/history?${params.toString()}`)
    return response.data
  },

  // Get action reasons
  getActionReasons: async (): Promise<ActionReason[]> => {
    const response = await apiClient.get('/members/action-reasons')
    return response.data
  },

  // Activate member
  activateMember: async (memberId: string, request: MemberActionRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/members/${memberId}/activate`, request)
    return response.data
  },

  // Cancel member
  cancelMember: async (memberId: string, request: MemberActionRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/members/${memberId}/cancel`, request)
    return response.data
  },

  // Restore member
  restoreMember: async (memberId: string, request: MemberActionRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/members/${memberId}/restore`, request)
    return response.data
  },

  // Delete member (soft delete)
  deleteMember: async (memberId: string, request: MemberActionRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/members/${memberId}/delete`, request)
    return response.data
  },

  // Renew member subscription
  renewMemberSubscription: async (memberId: string, gymMembershipPlanId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/members/${memberId}/renew`, { gymMembershipPlanId })
    return response.data
  },
}

// React Query hooks

// Get member with status
export function useMemberWithStatus(memberId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: memberManagementKeys.status(memberId),
    queryFn: () => memberManagementApi.getMemberWithStatus(memberId),
    enabled: options?.enabled ?? !!memberId,
  })
}

// Get member history
export function useMemberHistory(memberId: string, query: MemberHistoryQuery = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: memberManagementKeys.history(memberId, query),
    queryFn: () => memberManagementApi.getMemberHistory(memberId, query),
    enabled: options?.enabled ?? !!memberId,
  })
}

// Get action reasons
export function useActionReasons() {
  return useQuery({
    queryKey: memberManagementKeys.actionReasons(),
    queryFn: memberManagementApi.getActionReasons,
  })
}

// Member action mutations
export function useActivateMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ memberId, request }: { memberId: string; request: MemberActionRequest }) =>
      memberManagementApi.activateMember(memberId, request),
    onSuccess: (data, { memberId }) => {
      // Invalidate member status
      queryClient.invalidateQueries({ queryKey: memberManagementKeys.status(memberId) })
      // Invalidate all member history queries for this member
      queryClient.invalidateQueries({ queryKey: [...memberManagementKeys.all, 'history', memberId] })
      // Invalidate members lists
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useCancelMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ memberId, request }: { memberId: string; request: MemberActionRequest }) =>
      memberManagementApi.cancelMember(memberId, request),
    onSuccess: (data, { memberId }) => {
      // Invalidate member status
      queryClient.invalidateQueries({ queryKey: memberManagementKeys.status(memberId) })
      // Invalidate all member history queries for this member
      queryClient.invalidateQueries({ queryKey: [...memberManagementKeys.all, 'history', memberId] })
      // Invalidate members lists
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useRestoreMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ memberId, request }: { memberId: string; request: MemberActionRequest }) =>
      memberManagementApi.restoreMember(memberId, request),
    onSuccess: (data, { memberId }) => {
      // Invalidate member status
      queryClient.invalidateQueries({ queryKey: memberManagementKeys.status(memberId) })
      // Invalidate all member history queries for this member
      queryClient.invalidateQueries({ queryKey: [...memberManagementKeys.all, 'history', memberId] })
      // Invalidate members lists
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ memberId, request }: { memberId: string; request: MemberActionRequest }) =>
      memberManagementApi.deleteMember(memberId, request),
    onSuccess: (data, { memberId }) => {
      // Invalidate member status
      queryClient.invalidateQueries({ queryKey: memberManagementKeys.status(memberId) })
      // Invalidate all member history queries for this member
      queryClient.invalidateQueries({ queryKey: [...memberManagementKeys.all, 'history', memberId] })
      // Invalidate members lists
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useRenewMemberSubscription() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ memberId, gymMembershipPlanId }: { memberId: string; gymMembershipPlanId: string }) =>
      memberManagementApi.renewMemberSubscription(memberId, gymMembershipPlanId),
    onSuccess: (data, { memberId }) => {
      // Invalidate member status
      queryClient.invalidateQueries({ queryKey: memberManagementKeys.status(memberId) })
      // Invalidate all member history queries for this member
      queryClient.invalidateQueries({ queryKey: [...memberManagementKeys.all, 'history', memberId] })
      // Invalidate members lists
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // Invalidate gym subscription data
      queryClient.invalidateQueries({ queryKey: ['gym-subscriptions'] })
    },
  })
}
