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

export interface TenantPlanGroup {
  id: string
  tenantId: string
  tenantName: string
  tenantCategory: string
  plans: MembershipPlan[]
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

// Get all membership plans for the current tenant
export const getMembershipPlans = async (): Promise<ApiResponse<MembershipPlan[]>> => {
  return fetchApi('/membership-plans')
}

// Get active membership plans for the current tenant
export const getActiveMembershipPlans = async (): Promise<ApiResponse<MembershipPlan[]>> => {
  return fetchApi('/membership-plans/active')
}

// Get all membership plans across all tenants (Super Admin only)
export const getAllTenantMembershipPlans = async (): Promise<ApiResponse<TenantPlanGroup[]>> => {
  return fetchApi('/membership-plans/system/all')
}

// Get membership plan statistics for the current tenant
export const getMembershipPlanStats = async (): Promise<ApiResponse<any>> => {
  return fetchApi('/membership-plans/stats')
}

// Get a specific membership plan
export const getMembershipPlan = async (id: string): Promise<ApiResponse<MembershipPlan>> => {
  return fetchApi(`/membership-plans/${id}`)
}

// Create a new membership plan
export const createMembershipPlan = async (data: CreateMembershipPlanData): Promise<ApiResponse<MembershipPlan>> => {
  return fetchApi('/membership-plans', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// Update a membership plan
export const updateMembershipPlan = async (id: string, data: UpdateMembershipPlanData): Promise<ApiResponse<MembershipPlan>> => {
  return fetchApi(`/membership-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

// Toggle membership plan status (active/inactive)
export const toggleMembershipPlanStatus = async (id: string): Promise<ApiResponse<MembershipPlan>> => {
  return fetchApi(`/membership-plans/${id}/toggle-status`, {
    method: 'PATCH'
  })
}

// Delete a membership plan
export const deleteMembershipPlan = async (id: string): Promise<ApiResponse<void>> => {
  return fetchApi(`/membership-plans/${id}`, {
    method: 'DELETE'
  })
}
