import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getEmailSettings,
  updateEmailSettings,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailLogs,
  sendWelcomeEmail,
  sendAdminAlert,
  sendTenantNotification,
  type EmailSettings,
  type EmailTemplate,
  type EmailLog,
} from '@/lib/api/email'

// Email Settings
export const useEmailSettings = () => {
  return useQuery({
    queryKey: ['email-settings'],
    queryFn: getEmailSettings,
  })
}

export const useUpdateEmailSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] })
    },
  })
}

// Email Templates
export const useEmailTemplates = (tenantId?: string) => {
  return useQuery({
    queryKey: ['email-templates', tenantId],
    queryFn: () => getEmailTemplates({ tenantId }),
  })
}

export const useCreateEmailTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
  })
}

export const useUpdateEmailTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailTemplate> }) =>
      updateEmailTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
  })
}

export const useDeleteEmailTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
  })
}

// Email Logs
export const useEmailLogs = (params?: { tenantId?: string; status?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['email-logs', params],
    queryFn: () => getEmailLogs(params),
  })
}

// Send Emails
export const useSendWelcomeEmail = () => {
  return useMutation({
    mutationFn: sendWelcomeEmail,
  })
}

export const useSendAdminAlert = () => {
  return useMutation({
    mutationFn: sendAdminAlert,
  })
}

export const useSendTenantNotification = () => {
  return useMutation({
    mutationFn: sendTenantNotification,
  })
}