'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { userKeys } from '@/lib/hooks/use-users'
import { useTenantContext } from '@/lib/providers/tenant-context'
import { type BusinessCategory } from '@/types'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setCurrentTenant } = useTenantContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Use the environment variable API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      if (data.success && data.data.user && data.data.token) {
        // Store user data and token
        localStorage.setItem('auth_token', data.data.token)
        localStorage.setItem('user_data', JSON.stringify(data.data.user))
        
        // Set tenant context for users with tenant data
        if (data.data.user.tenant) {
          setCurrentTenant(data.data.user.tenant)
        } else if (data.data.user.tenantId) {
          // If we have a tenantId but no tenant object, create a basic tenant object
          const basicTenant = {
            id: data.data.user.tenantId,
            name: 'Unknown Tenant', // This should be resolved by the backend
            category: 'GYM' as BusinessCategory, // Default category
            slug: 'unknown-tenant',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          setCurrentTenant(basicTenant)
        }
        
        
        // Clear and refresh profile cache to ensure fresh role data
        queryClient.removeQueries({ queryKey: userKeys.profile() })
        queryClient.invalidateQueries({ queryKey: userKeys.profile() })
        
        
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent -z-10" />

      <div className="max-w-md w-full mx-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
        {/* Modern Logo Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            CreativeCore
          </h1>
          <p className="text-slate-600 text-lg font-medium">
            Smart business management platform
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Powering gyms, coffee shops & more
          </p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-lg ring-1 ring-white/20">
          <CardHeader className="space-y-1 pb-8 pt-8">
            <CardTitle className="text-2xl font-bold text-center text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-center text-slate-600 text-base">
              Sign in to access your business dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  className="h-12 text-base !bg-white !text-slate-900 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="h-12 text-base !bg-white !text-slate-900 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Sample credentials for testing - DELETE BEFORE PRODUCTION */}
            <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-amber-800">DEV ONLY - Login Credentials</p>
              </div>

              <div className="space-y-4 text-sm">
                {/* Super Admin */}
                <div className="bg-white/70 rounded-lg p-3 border border-purple-200">
                  <div className="font-semibold text-purple-800 mb-2">🔧 Super Admin</div>
                  <div className="text-slate-700 space-y-1">
                    <div><strong>Email:</strong> admin@creatives-saas.com</div>
                    <div><strong>Password:</strong> SuperAdmin123!</div>
                  </div>
                </div>

                {/* Muscle Mania - Beta Tester */}
                <div className="bg-white/70 rounded-lg p-3 border border-orange-200">
                  <div className="font-semibold text-orange-800 mb-2">💪 Muscle Mania (Beta Tester)</div>
                  <div className="text-slate-700 space-y-2">
                    <div className="bg-orange-50 p-2 rounded">
                      <strong>Owner:</strong> owner@muscle-mania.com / MuscleManiaOwner123!
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <strong>Managers:</strong> manager@muscle-mania.com / Manager123!
                    </div>
                    <div className="bg-slate-50 p-2 rounded text-sm">
                      <strong>Staff:</strong> staff11@muscle-mania.com / Staff1123! (and more)
                    </div>
                  </div>
                </div>

                {/* Sample Members */}
                <div className="bg-white/70 rounded-lg p-3 border border-indigo-200">
                  <div className="font-semibold text-indigo-800 mb-2">👥 Sample Members</div>
                  <div className="text-slate-700">
                    <div><strong>Muscle Mania:</strong> john1b1@muscle-mania.com / Member123!</div>
                    <div className="text-slate-500 text-xs mt-1">(Many more available - check seeder output)</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-300 text-xs text-amber-700 space-y-2">
                <div>
                  <strong>Branch Access:</strong>
                  <div className="ml-2 space-y-1">
                    <div>• <strong>Owner:</strong> Full access to all branches</div>
                    <div>• <strong>Manager:</strong> Access to assigned branch only</div>
                    <div>• <strong>Staff:</strong> Limited to assigned branch only</div>
                    <div>• <strong>Members:</strong> View own profile and branch data only</div>
                  </div>
                </div>
                <div className="bg-amber-100 p-2 rounded text-amber-800">
                  <strong>💡 Testing Tip:</strong> Try different roles to see branch-based access control!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-slate-500 text-sm">
          <p>© 2024 CreativeCore. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

