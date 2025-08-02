import { apiClient } from './client'
import { Tenant, BusinessCategory } from '@/types'

export interface CreateTenantDto {
  // Basic tenant info
  name: string
  category: BusinessCategory
  description?: string

  // Owner details - required
  ownerFirstName: string
  ownerLastName: string
  ownerEmail: string
  ownerPhoneNumber?: string

  // Super admin options
  freeBranchOverride?: number

  // Optional tenant details
  logoUrl?: string
  address?: string
  phoneNumber?: string
  email?: string
  websiteUrl?: string
  primaryColor?: string
  secondaryColor?: string
}

export interface UpdateTenantDto {
  name?: string
  businessCategory?: BusinessCategory
  description?: string
}

export interface TenantQueryParams {
  page?: number
  limit?: number
  search?: string
  businessCategory?: BusinessCategory
}

export const tenantsApi = {
  // Get all tenants (paginated)
  getAll: async (params?: TenantQueryParams) => {
    const response = await apiClient.get('/tenants', { params })
    return response.data
  },

  // Get tenant by ID
  getById: async (id: string): Promise<Tenant> => {
    const response = await apiClient.get(`/tenants/${id}`)
    return response.data
  },

  // Create tenant
  create: async (data: CreateTenantDto): Promise<Tenant> => {
    const response = await apiClient.post('/tenants', data)
    return response.data
  },

  // Update tenant
  update: async (id: string, data: UpdateTenantDto): Promise<Tenant> => {
    const response = await apiClient.put(`/tenants/${id}`, data)
    return response.data
  },

  // Delete tenant
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenants/${id}`)
  },

  // Get tenant stats/analytics
  getStats: async (id: string) => {
    const response = await apiClient.get(`/tenants/${id}/stats`)
    return response.data
  },

  // Get system-wide statistics (Super Admin only)
  getSystemStats: async () => {
    const response = await apiClient.get('/tenants/system/stats')
    return response.data
  },
}
