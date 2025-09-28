import { ApiResponse, fetchApi } from './base'

export interface MembershipPlan {
  id: string
  tenantId: string
  name: string
  description?: string
  price: number
  duration: number
  type: string
  benefits: string[]
  isActive: boolean
  memberCount?: number
  createdAt: string
  updatedAt: string
  tenant?: {
    id: string
    name: string
    category: string
  }
}


export interface CreateMembershipPlanData {
  name: string
  description?: string
  price: number
  duration: number
  type: string
  benefits?: string[]
  isActive?: boolean
}

export interface UpdateMembershipPlanData {
  name?: string
  description?: string
  price?: number
  duration?: number
  type?: string
  benefits?: string[]
  isActive?: boolean
}

// Get all gym membership plans for the current tenant
export const getMembershipPlans = async (): Promise<ApiResponse<MembershipPlan[]>> => {
  return fetchApi('/gym/membership-plans')
}

// Get active gym membership plans for the current tenant
export const getActiveMembershipPlans = async (): Promise<ApiResponse<MembershipPlan[]>> => {
  return fetchApi('/gym/membership-plans/active')
}

// Get gym membership plan statistics for the current tenant
export const getMembershipPlanStats = async (): Promise<ApiResponse<any>> => {
  return fetchApi('/gym/membership-plans/stats')
}

// Get a specific gym membership plan
export const getMembershipPlan = async (id: string): Promise<ApiResponse<MembershipPlan>> => {
  return fetchApi(`/gym/membership-plans/${id}`)
}

// Create a new gym membership plan
export const createMembershipPlan = async (data: CreateMembershipPlanData): Promise<ApiResponse<MembershipPlan>> => {
  return fetchApi('/gym/membership-plans', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// Update a gym membership plan
export const updateMembershipPlan = async (id: string, data: UpdateMembershipPlanData): Promise<ApiResponse<MembershipPlan>> => {
  return fetchApi(`/gym/membership-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

// Toggle gym membership plan status (active/inactive)
export const toggleMembershipPlanStatus = async (id: string): Promise<ApiResponse<MembershipPlan>> => {
  return fetchApi(`/gym/membership-plans/${id}/toggle-status`, {
    method: 'PATCH'
  })
}

// Delete a gym membership plan
export const deleteMembershipPlan = async (id: string): Promise<ApiResponse<void>> => {
  return fetchApi(`/gym/membership-plans/${id}`, {
    method: 'DELETE'
  })
}
