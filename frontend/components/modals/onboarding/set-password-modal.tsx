'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Key, Lock, Shield } from 'lucide-react'
import { toast } from 'react-toastify'
import { usePasswordSecurityLevel } from '@/lib/hooks/use-system-settings'
import { getPasswordRequirements, validatePassword, PASSWORD_REQUIREMENTS_CONFIG } from '@/lib/utils/password-validator'

interface SetPasswordModalProps {
  open: boolean
  onPasswordSet: (newPassword: string) => Promise<void>
  isLoading?: boolean
}

export default function SetPasswordModal({
  open,
  onPasswordSet,
  isLoading = false,
}: SetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch current password security level
  const { data: securityLevel, isLoading: isLoadingLevel } = usePasswordSecurityLevel()
  const requirements = securityLevel ? getPasswordRequirements(securityLevel) : []

  // Get minimum length from security level
  const minLength = securityLevel ? PASSWORD_REQUIREMENTS_CONFIG[securityLevel].minLength : 8

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }

    // Validate password against current security level
    if (securityLevel) {
      const validation = validatePassword(newPassword, securityLevel)
      if (!validation.valid) {
        setError(validation.errors.join(', '))
        return
      }
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      await onPasswordSet(newPassword)
      toast.success('Password set successfully! Welcome to your dashboard.')
    } catch (error: any) {
      console.error('Failed to set password:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to set password'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Set Your Password
          </DialogTitle>
          <DialogDescription className="text-center">
            Welcome! Before you can access your dashboard, please create a secure password for your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="pr-10"
                required
                minLength={minLength}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="pr-10"
                required
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {newPassword && requirements.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password Requirements</span>
              </div>
              <div className="space-y-1 text-xs">
                {requirements.map((req) => {
                  const isMet = req.test(newPassword)
                  return (
                    <div
                      key={req.value}
                      className={`flex items-center gap-2 ${isMet ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isMet ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      {req.label}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              className="w-full"
              size="lg"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Setting Password...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Set Password & Continue
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
