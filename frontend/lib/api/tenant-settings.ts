import { apiClient } from './client'

export interface TenantSettings {
  id: string
  name: string
  adminEmailRecipients: string[]
  emailNotificationsEnabled: boolean
  welcomeEmailEnabled: boolean
  adminAlertEmailEnabled: boolean
}

export const tenantSettingsApi = {
  getSettings: async (): Promise<TenantSettings> => {
    const response = await apiClient.get('/tenants/current/settings')
    return response.data
  },

  updateAdminEmails: async (data: {
    adminEmailRecipients: string[]
    emailNotificationsEnabled: boolean
  }): Promise<TenantSettings> => {
    const response = await apiClient.put('/tenants/current/admin-emails', data)
    return response.data
  },
}