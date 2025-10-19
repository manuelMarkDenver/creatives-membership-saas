import { apiClient } from './client'
import { Branch } from '@/types'

export interface CreateBranchDto {
  tenantId: string
  name: string
  address: string
  phoneNumber?: string
  email?: string
}

export interface UpdateBranchDto {
  name?: string
  address?: string
  phoneNumber?: string
  email?: string
}

export interface BranchQueryParams {
  page?: number
  limit?: number
  search?: string
  tenantId?: string
}

export const branchesApi = {
  // Get all branches (paginated, optionally filtered by tenant)
  getAll: async (params?: BranchQueryParams) => {
    const response = await apiClient.get('/branches', { params })
    return response.data
  },

  // Get branches for a specific tenant
  getByTenant: async (tenantId: string, params?: Omit<BranchQueryParams, 'tenantId'>) => {
    // Ensure tenantId is available via both query param and header for backend flexibility
    const response = await apiClient.get('/branches', {
      params: { ...params },
      headers: { 'x-tenant-id': tenantId }
    })
    return response.data
  },

  // Get branch by ID
  getById: async (id: string): Promise<Branch> => {
    const response = await apiClient.get(`/branches/${id}`)
    return response.data
  },

  // Create branch
  create: async (data: CreateBranchDto): Promise<Branch> => {
    const response = await apiClient.post('/branches', data)
    return response.data
  },

  // Update branch
  update: async (id: string, data: UpdateBranchDto): Promise<Branch> => {
    const response = await apiClient.put(`/branches/${id}`, data)
    return response.data
  },

  // Delete branch (soft delete)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/branches/${id}`)
  },

  // Restore branch
  restore: async (id: string): Promise<Branch> => {
    const response = await apiClient.put(`/branches/${id}/restore`)
    return response.data
  },

  // Get users assigned to a branch
  getBranchUsers: async (id: string) => {
    const response = await apiClient.get(`/branches/${id}/users`)
    return response.data
  },

  // Bulk reassign users
  bulkReassignUsers: async (fromBranchId: string, data: {
    userIds: string[]
    toBranchId: string
    reason?: string
  }) => {
    const response = await apiClient.post(`/branches/${fromBranchId}/users/bulk-reassign`, data)
    return response.data
  },

  // Force delete branch (admin override)
  forceDelete: async (id: string, data: {
    reason: string
    confirmationText: string
  }) => {
    const response = await apiClient.delete(`/branches/${id}/force`, { data })
    return response.data
  },

  // Get branch stats/analytics
  getStats: async (id: string) => {
    const response = await apiClient.get(`/branches/${id}/stats`)
    return response.data
  },

  // Get all branches system-wide (Super Admin only)
  getSystemWide: async () => {
    const response = await apiClient.get('/branches/system/all')
    return response.data
  },
}
