import { apiClient } from './client'

export interface BusinessUnit {
  id: string
  tenantId: string
  name: string
  unitType: 'LOCATION' | 'CHANNEL' | 'DEPARTMENT' | 'FRANCHISE'
  contactPhone?: string
  contactEmail?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  isActive: boolean
  isPaid: boolean
  trialEndsAt?: string
  subscriptionTier?: string
  monthlyPrice?: number
  businessUnitData?: Record<string, unknown>
  settings?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CreateBusinessUnitData {
  name: string
  unitType?: 'LOCATION' | 'CHANNEL' | 'DEPARTMENT' | 'FRANCHISE'
  contactPhone?: string
  contactEmail?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  subscriptionTier?: string
  monthlyPrice?: number
  businessUnitData?: Record<string, unknown>
  settings?: Record<string, unknown>
}

export interface UpdateBusinessUnitData {
  name?: string
  unitType?: 'LOCATION' | 'CHANNEL' | 'DEPARTMENT' | 'FRANCHISE'
  contactPhone?: string
  contactEmail?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  subscriptionTier?: string
  monthlyPrice?: number
  businessUnitData?: Record<string, unknown>
  settings?: Record<string, unknown>
}

export interface BusinessUnitStats {
  total: number
  active: number
  inactive: number
  paid: number
  trial: number
  expired: number
}

export interface PaidModeToggleData {
  enabled: boolean
}

export const businessUnitsApi = {
  // Get all business units for current tenant
  getBusinessUnits: (): Promise<BusinessUnit[]> =>
    apiClient.get('/business-units').then(res => res.data),

  // Get business unit by ID
  getBusinessUnit: (id: string): Promise<BusinessUnit> =>
    apiClient.get(`/business-units/${id}`).then(res => res.data),

  // Create new business unit
  createBusinessUnit: (data: CreateBusinessUnitData): Promise<BusinessUnit> =>
    apiClient.post('/business-units', data).then(res => res.data),

  // Update business unit
  updateBusinessUnit: (id: string, data: UpdateBusinessUnitData): Promise<BusinessUnit> =>
    apiClient.put(`/business-units/${id}`, data).then(res => res.data),

  // Delete business unit
  deleteBusinessUnit: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/business-units/${id}`).then(res => res.data),

  // Get business unit statistics
  getBusinessUnitStats: (): Promise<BusinessUnitStats> =>
    apiClient.get('/business-units/stats').then(res => res.data),

  // Toggle paid mode for tenant
  togglePaidMode: (data: PaidModeToggleData): Promise<{ message: string; enabled: boolean }> =>
    apiClient.post('/business-units/paid-mode/toggle', data).then(res => res.data),

  // Get paid mode status for tenant
  getPaidModeStatus: (): Promise<{ enabled: boolean; freeUnitsLimit: number }> =>
    apiClient.get('/business-units/paid-mode/status').then(res => res.data),

  // Activate business unit (move from trial to paid)
  activateBusinessUnit: (id: string): Promise<BusinessUnit> =>
    apiClient.post(`/business-units/${id}/activate`).then(res => res.data),

  // Deactivate business unit
  deactivateBusinessUnit: (id: string): Promise<BusinessUnit> =>
    apiClient.post(`/business-units/${id}/deactivate`).then(res => res.data),
}
