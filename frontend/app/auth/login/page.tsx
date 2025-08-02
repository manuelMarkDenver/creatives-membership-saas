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
      // Use the correct API URL with fallback
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
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
        
        // Set tenant context for non-super-admin users
        if (data.data.user.role !== 'SUPER_ADMIN' && data.data.user.tenant) {
          console.log('Setting tenant context:', data.data.user.tenant.name)
          setCurrentTenant(data.data.user.tenant)
        }
        
        // Clear and refresh profile cache to ensure fresh role data
        queryClient.removeQueries({ queryKey: userKeys.profile() })
        queryClient.invalidateQueries({ queryKey: userKeys.profile() })
        
        // Log the role for debugging
        console.log('Logged in user role:', data.data.user.role)
        
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Creative SaaS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
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
                className="w-full" 
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
            
            {/* Sample credentials for testing */}
            <div className="mt-6 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-2">Sample Login Credentials:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Super Admin:</strong> admin@creatives-saas.com / SuperAdmin123!</div>
                <div><strong>Owner:</strong> owner@fitlife-gym.com / FitLifeOwner123!</div>
                <div><strong>Manager:</strong> manager1@fitlife-gym.com / Manager123!</div>
                <div><strong>Staff:</strong> staff11@fitlife-gym.com / Staff1123!</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

