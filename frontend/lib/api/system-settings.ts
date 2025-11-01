import { apiClient } from './client'

export type PasswordSecurityLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface SystemSettings {
  id: string
  passwordSecurityLevel: PasswordSecurityLevel
  // Global admin notifications
  globalAdminEmails?: string[]
  newTenantAlertsEnabled?: boolean
  systemAlertsEnabled?: boolean
  securityAlertsEnabled?: boolean
  updatedAt: string
  updatedBy?: string
}

export const systemSettingsApi = {
  // Get all system settings (SUPER_ADMIN only)
  getSettings: async (): Promise<SystemSettings> => {
    const response = await apiClient.get('/system-settings')
    return response.data
  },

  // Get current password security level (public)
  getPasswordSecurityLevel: async (): Promise<PasswordSecurityLevel> => {
    const response = await apiClient.get('/system-settings/password-security-level')
    return response.data.passwordSecurityLevel
  },

  // Update password security level (SUPER_ADMIN only)
  updatePasswordSecurityLevel: async (level: PasswordSecurityLevel): Promise<SystemSettings> => {
    const response = await apiClient.put('/system-settings/password-security-level', {
      passwordSecurityLevel: level,
    })
    return response.data
  },

  // Update global admin settings (SUPER_ADMIN only)
  updateGlobalAdminSettings: async (data: {
    globalAdminEmails?: string[]
    newTenantAlertsEnabled?: boolean
    systemAlertsEnabled?: boolean
    securityAlertsEnabled?: boolean
  }): Promise<SystemSettings> => {
    const response = await apiClient.put('/system-settings/global-admin', data)
    return response.data
  },

  // Get global admin emails (SUPER_ADMIN only)
  getGlobalAdminEmails: async (): Promise<string[]> => {
    const response = await apiClient.get('/system-settings/global-admin-emails')
    return response.data.globalAdminEmails || []
  },
}
