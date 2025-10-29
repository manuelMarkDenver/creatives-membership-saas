'use client'

import { useState } from 'react'
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

interface SetPasswordModalProps {
  open: boolean
  onPasswordSet: (tempPassword: string, newPassword: string) => Promise<void>
  isLoading?: boolean
}

export default function SetPasswordModal({
  open,
  onPasswordSet,
  isLoading = false,
}: SetPasswordModalProps) {
  const [tempPassword, setTempPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showTempPassword, setShowTempPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validatePassword = (password: string): boolean => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!tempPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return
    }

    if (!validatePassword(newPassword)) {
      setError('Password must contain uppercase, lowercase, number, and special character')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }

    if (tempPassword === newPassword) {
      setError('New password must be different from temporary password')
      return
    }

    setIsSubmitting(true)
    try {
      await onPasswordSet(tempPassword, newPassword)
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
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-[550px]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Set Your Password
          </DialogTitle>
          <DialogDescription className="text-center">
            Welcome! Before you can access your dashboard, please set a secure password using the temporary password sent to your email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Temporary Password */}
          <div className="space-y-2">
            <Label htmlFor="tempPassword">Temporary Password</Label>
            <div className="relative">
              <Input
                id="tempPassword"
                type={showTempPassword ? 'text' : 'password'}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Enter the temporary password from your email"
                className="pr-10"
                required
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowTempPassword(!showTempPassword)}
                aria-label={showTempPassword ? 'Hide password' : 'Show password'}
              >
                {showTempPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Check your email for the temporary password we sent you.
            </p>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong password"
                className="pr-10"
                required
                minLength={8}
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
          {newPassword && (
            <div className="bg-slate-50 p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Password Requirements</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-slate-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-slate-300'}`} />
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-slate-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  Contains uppercase letter
                </div>
                <div className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-slate-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  Contains lowercase letter
                </div>
                <div className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-slate-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  Contains number
                </div>
                <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : 'text-slate-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${/[^A-Za-z0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  Contains special character
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
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
