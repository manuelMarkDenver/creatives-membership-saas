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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Modern Logo Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            CreativeCore
          </h1>
          <p className="mt-2 text-gray-600 text-sm">
            Smart business management platform
          </p>
        </div>
        
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-center text-gray-500">
              Sign in to access your business dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
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
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
            
            {/* Sample credentials for testing - DELETE BEFORE PRODUCTION */}
            <div className="mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-md max-h-80 sm:max-h-96 overflow-y-auto">
              <p className="text-xs sm:text-sm font-semibold text-yellow-800 mb-3 flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="leading-tight">DEV ONLY - Login Credentials (Remove before production):</span>
              </p>
              
              <div className="space-y-3 text-xs">
                {/* Super Admin */}
                <div>
                  <div className="font-medium text-purple-800 border-b pb-1 mb-2 text-xs sm:text-sm">🔧 Super Admin</div>
                  <div className="pl-2 text-gray-700 bg-purple-50 p-2 rounded text-xs leading-relaxed">
                    <div><strong>Email:</strong> admin@creatives-saas.com</div>
                    <div><strong>Password:</strong> SuperAdmin123!</div>
                  </div>
                </div>

                {/* Muscle Mania - Beta Tester */}
                <div>
                  <div className="font-medium text-orange-800 border-b pb-1 mb-2 text-xs sm:text-sm">💪 Muscle Mania (Beta Tester)</div>
                  <div className="pl-2 text-gray-700 space-y-1">
                    <div className="bg-orange-50 p-2 rounded text-xs leading-relaxed">
                      <div><strong>Owner:</strong> owner@muscle-mania.com</div>
                      <div><strong>Password:</strong> MuscleManiaOwner123!</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-xs leading-relaxed">
                      <div><strong>Managers:</strong></div>
                      <div>• manager1@muscle-mania.com / Manager123!</div>
                      <div>• manager2@muscle-mania.com / Manager223!</div>
                      <div>• manager3@muscle-mania.com / Manager323!</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-xs leading-relaxed">
                      <div><strong>Staff:</strong></div>
                      <div>• staff11@muscle-mania.com / Staff1123!</div>
                      <div>• staff21@muscle-mania.com / Staff2123!</div>
                      <div>• staff31@muscle-mania.com / Staff3123!</div>
                      <div className="text-gray-500">... and more (see seeder output)</div>
                    </div>
                  </div>
                </div>


                {/* Sample Members */}
                <div>
                  <div className="font-medium text-indigo-800 border-b pb-1 mb-2 text-xs sm:text-sm">👥 Sample Members</div>
                  <div className="pl-2 text-gray-700 bg-indigo-50 p-2 rounded text-xs leading-relaxed">
                    <div><strong>Muscle Mania:</strong> john1b1@muscle-mania.com / Member123!</div>
                    <div className="text-gray-500 mt-1"><em>(Many more available - check seeder output)</em></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-2 border-t border-yellow-300 text-xs text-yellow-700">
                <strong>Branch Access:</strong><br/>
                • <strong>Owner:</strong> Full access to all branches<br/>
                • <strong>Manager:</strong> Access to assigned branch only<br/>
                • <strong>Staff:</strong> Limited to assigned branch only<br/>
                • <strong>Members:</strong> View own profile and branch data only
              </div>
              
              <div className="mt-2 pt-2 border-t border-yellow-300 text-xs text-yellow-600">
                <strong>💡 Testing Tip:</strong> Try logging in as different roles to see branch-based access control in action!
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

