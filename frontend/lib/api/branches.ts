import { apiClient } from './client'
import { Branch } from '@/lib/types'

export interface CreateBranchDto {
  tenantId: string
  name: string
  address: string
  phone?: string
  email?: string
}

export interface UpdateBranchDto {
  name?: string
  address?: string
  phone?: string
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

  // Delete branch
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/branches/${id}`)
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
