import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tenantSettingsApi } from '@/lib/api/tenant-settings'
import { useAuthValidation } from '@/lib/hooks/use-auth-validation'

export function useTenantSettings() {
  const { user } = useAuthValidation()

  return useQuery({
    queryKey: ['tenant-settings', user?.tenantId],
    queryFn: () => tenantSettingsApi.getSettings(),
    enabled: !!user?.tenantId,
  })
}

export function useUpdateTenantAdminEmails() {
  const queryClient = useQueryClient()
  const { user } = useAuthValidation()

  return useMutation({
    mutationFn: (data: {
      adminEmailRecipients: string[]
      emailNotificationsEnabled: boolean
    }) => tenantSettingsApi.updateAdminEmails(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tenant-settings', user?.tenantId]
      })
    },
  })
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient()
  const { user } = useAuthValidation()

  return useMutation({
    mutationFn: (data: {
      welcomeEmailEnabled?: boolean
      tenantSignupNotificationEnabled?: boolean
    }) => tenantSettingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tenant-settings', user?.tenantId]
      })
    },
  })
}