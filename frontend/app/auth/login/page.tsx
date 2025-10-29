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
import { userKeys } from '@/lib/hooks/use-gym-users'
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
      // Clear any existing auth data before login attempt
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      
      console.log('🔍 Attempting login with:', { email }) // Debug log
      
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
        console.log('✅ Login successful for:', data.data.user.email) // Debug log
        
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
    <div className="min-h-screen flex">
      {/* Left Side - Gym Image - ONLY ON EXTRA LARGE SCREENS */}
      <div className="hidden 2xl:flex 2xl:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Gym Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/40 via-teal-600/30 to-slate-900/60" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 text-white w-full">
          {/* Logo & Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-xl">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold">CreativeCore</h2>
            </div>
          </div>

          {/* Center Content */}
          <div className="space-y-6 max-w-lg">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight break-words">
                Elevate Your
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Business Performance
                </span>
              </h1>
              <p className="text-lg xl:text-xl text-slate-300 break-words">
                Complete management solution for gyms, coffee shops, and growing businesses.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 xl:gap-3">
              <div className="px-3 xl:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-xs xl:text-sm font-medium whitespace-nowrap">
                💪 Member Management
              </div>
              <div className="px-3 xl:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-xs xl:text-sm font-medium whitespace-nowrap">
                📊 Analytics Dashboard
              </div>
              <div className="px-3 xl:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-xs xl:text-sm font-medium whitespace-nowrap">
                💳 Payment Tracking
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-4 xl:gap-8 max-w-lg">
            <div>
              <div className="text-2xl xl:text-3xl font-bold text-emerald-400">100+</div>
              <div className="text-xs xl:text-sm text-slate-400 break-words">Active Businesses</div>
            </div>
            <div>
              <div className="text-2xl xl:text-3xl font-bold text-emerald-400">5K+</div>
              <div className="text-xs xl:text-sm text-slate-400 break-words">Happy Members</div>
            </div>
            <div>
              <div className="text-2xl xl:text-3xl font-bold text-emerald-400">99%</div>
              <div className="text-xs xl:text-sm text-slate-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full 2xl:w-1/2 flex items-center justify-center p-4 sm:p-6 xl:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
        <div className="w-full max-w-md space-y-4 sm:space-y-6 xl:space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          {/* Mobile Logo (Hidden on Extra Large Screens) */}
          <div className="2xl:hidden text-center mb-2">
            <div className="mx-auto w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-3 shadow-xl">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              CreativeCore
            </h1>
          </div>

          {/* Login Card */}
          <Card className="border-2 shadow-xl bg-white">
            <CardHeader className="space-y-1 pb-4 sm:pb-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900">Welcome Back</CardTitle>
              <CardDescription className="text-slate-600 text-sm sm:text-base">
                Sign in to access your business dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 sm:pb-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
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
                    className="h-12 text-base !bg-white !text-slate-900 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
                  />
                </div>

                <div className="space-y-2">
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
                    className="h-12 text-base !bg-white !text-slate-900 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
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
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-slate-500 text-sm">
            <p>© 2024 CreativeCore. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

