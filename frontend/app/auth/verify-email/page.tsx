'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api/client'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    verifyEmail()
  }, [token])

  const verifyEmail = async () => {
    try {
      const result = await authApi.verifyEmail(token!)
      
      if (result.success) {
        setStatus('success')
        setMessage(result.message || 'Email verified successfully!')

        // Store auth data
        if (result.data?.token && result.data?.user) {
          localStorage.setItem('auth_token', result.data.token)
          localStorage.setItem('user_data', JSON.stringify(result.data.user))
        }

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setStatus('error')
        setMessage(result.message || 'Verification failed')
      }
    } catch (error: any) {
      setStatus('error')
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed'
      setMessage(errorMessage)
      
      // Extract email from error if available
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        // Show resend option
      }
    }
  }

  const handleResendEmail = async () => {
    if (!email) {
      alert('Please enter your email address')
      return
    }

    try {
      await authApi.resendVerification(email)
      alert('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to resend email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text text-transparent">
            GymBossLab
          </h1>
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-purple-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verifying your email...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we confirm your email address
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Email Verified! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting you to your dashboard...
            </p>
            <div className="pt-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verification Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>

            {/* Resend Email Option */}
            {(message.includes('expired') || message.includes('invalid')) && (
              <div className="mt-6 space-y-4">
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-4">
                    <Mail className="h-5 w-5" />
                    <span className="font-medium">Need a new verification link?</span>
                  </div>
                  
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-3"
                  />
                  
                  <Button
                    onClick={handleResendEmail}
                    className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:opacity-90"
                  >
                    Resend Verification Email
                  </Button>
                </div>
              </div>
            )}

            {/* Back to Login */}
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-purple-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
