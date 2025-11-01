import { apiClient } from './client'

export interface EmailSettings {
  id: string
  smtpHost: string
  smtpPort: number
  smtpUser: string | null
  smtpPassword: string | null
  fromEmail: string
  fromName: string
  brevoApiKey: string | null
  mailpitEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface EmailTemplate {
  id: string
  tenantId: string | null
  templateType: string
  name: string
  subject: string
  htmlContent: string
  textContent: string | null
  variables: Record<string, any> | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EmailLog {
  id: string
  tenantId: string | null
  recipientEmail: string
  recipientName: string | null
  templateType: string
  templateId: string | null
  subject: string
  status: string
  errorMessage: string | null
  sentAt: string | null
  provider: string
  metadata: Record<string, any> | null
  createdAt: string
  template?: EmailTemplate
}

// Email Settings
export const getEmailSettings = () =>
  apiClient.get<EmailSettings>('/admin/email-settings').then(res => res.data)

export const updateEmailSettings = (data: Partial<EmailSettings>) =>
  apiClient.put<EmailSettings>('/admin/email-settings', data).then(res => res.data)

// Email Templates
export const getEmailTemplates = (params?: { tenantId?: string }) =>
  apiClient.get<EmailTemplate[]>('/email/templates', { params }).then(res => res.data)

export const createEmailTemplate = (data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) =>
  apiClient.post<EmailTemplate>('/email/templates', data).then(res => res.data)

export const updateEmailTemplate = (id: string, data: Partial<EmailTemplate>) =>
  apiClient.put<EmailTemplate>(`/email/templates/${id}`, data).then(res => res.data)

export const deleteEmailTemplate = (id: string) =>
  apiClient.delete(`/email/templates/${id}`)

// Email Logs
export const getEmailLogs = (params?: { tenantId?: string; status?: string; limit?: number }) =>
  apiClient.get<EmailLog[]>('/email/logs', { params }).then(res => res.data)

// Send Emails
export const sendWelcomeEmail = (data: {
  email: string
  name: string
  tenantId: string
  membershipPlanName?: string
  registrationDate?: string
  startDate?: string
  endDate?: string
}) =>
  apiClient.post('/email/send-welcome', data).then(res => res.data)

export const sendAdminAlert = (data: {
  tenantName: string
  ownerEmail: string
  tenantId: string
}) =>
  apiClient.post('/email/send-admin-alert', data).then(res => res.data)

export const sendTenantNotification = (data: {
  tenantId: string
  memberName: string
  memberEmail: string
  membershipPlanName?: string
}) =>
  apiClient.post('/email/send-tenant-notification', data).then(res => res.data)