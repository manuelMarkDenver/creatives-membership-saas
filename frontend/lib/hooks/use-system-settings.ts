import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { systemSettingsApi, type PasswordSecurityLevel } from '../api/system-settings'
import { toast } from 'react-toastify'

export const systemSettingsKeys = {
  all: ['system-settings'] as const,
  settings: () => [...systemSettingsKeys.all, 'settings'] as const,
  passwordLevel: () => [...systemSettingsKeys.all, 'password-level'] as const,
}

export function useSystemSettings() {
  return useQuery({
    queryKey: systemSettingsKeys.settings(),
    queryFn: () => systemSettingsApi.getSettings(),
  })
}

export function usePasswordSecurityLevel() {
  return useQuery({
    queryKey: systemSettingsKeys.passwordLevel(),
    queryFn: () => systemSettingsApi.getPasswordSecurityLevel(),
  })
}

export function useUpdatePasswordSecurityLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (level: PasswordSecurityLevel) =>
      systemSettingsApi.updatePasswordSecurityLevel(level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemSettingsKeys.all })
      toast.success('Password security level updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update password security level')
    },
  })
}
