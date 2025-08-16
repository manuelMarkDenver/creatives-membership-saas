import { apiClient } from './client'
import { Location } from '@/types'

export interface CreateLocationDto {
  tenantId: string
  name: string
  address: string
  phone?: string
  email?: string
}

export interface UpdateLocationDto {
  name?: string
  address?: string
  phone?: string
  email?: string
}

export interface LocationQueryParams {
  page?: number
  limit?: number
  search?: string
  tenantId?: string
}

export const locationsApi = {
  // Get all gym locations (paginated, optionally filtered by tenant)
  getAll: async (params?: LocationQueryParams) => {
    const response = await apiClient.get('/gym/locations', { params })
    return response.data
  },

  // Get locations for a specific tenant
  getByTenant: async (tenantId: string, params?: Omit<LocationQueryParams, 'tenantId'>) => {
    // Ensure tenantId is available via both query param and header for backend flexibility
    const response = await apiClient.get('/gym/locations', { 
      params: { ...params },
      headers: { 'x-tenant-id': tenantId }
    })
    return response.data
  },

  // Get location by ID
  getById: async (id: string): Promise<Location> => {
    const response = await apiClient.get(`/gym/locations/${id}`)
    return response.data
  },

  // Create location
  create: async (data: CreateLocationDto): Promise<Location> => {
    const response = await apiClient.post('/gym/locations', data)
    return response.data
  },

  // Update location
  update: async (id: string, data: UpdateLocationDto): Promise<Location> => {
    const response = await apiClient.put(`/gym/locations/${id}`, data)
    return response.data
  },

  // Delete location
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/gym/locations/${id}`)
  },

  // Get location stats/analytics
  getStats: async (id: string) => {
    const response = await apiClient.get(`/gym/locations/${id}/stats`)
    return response.data
  },

  // Assign staff to location
  assignStaff: async (locationId: string, data: { userId: string; accessLevel: string }) => {
    const response = await apiClient.post(`/gym/locations/${locationId}/staff`, data)
    return response.data
  },

  // Update staff location access
  updateStaffAccess: async (locationId: string, userId: string, data: { accessLevel: string }) => {
    const response = await apiClient.put(`/gym/locations/${locationId}/staff/${userId}`, data)
    return response.data
  },
}
