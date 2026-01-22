'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, Bell, Settings, LogOut, AlertCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useTenantContext } from '@/lib/providers/tenant-context'
import { setTenantContext } from '@/lib/api'
import { useRoleNavigation } from '@/lib/hooks/use-role-navigation'
import { useSubscriptionStatus } from '@/lib/hooks/use-subscription'
import { authManager } from '@/lib/auth/auth-utils'
import { useTenantValidation } from '@/lib/hooks/use-auth-validation'
import TenantSwitcher from './tenant-switcher'
import { ExpiringMembersButton } from '@/components/ui/expiring-members-button'
import { ExpiringMembersAutoPopup } from '@/components/ui/expiring-members-auto-popup'
import OnboardingWrapper from '@/components/onboarding-wrapper'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  // Comprehensive auth and tenant validation - TEMPORARILY DISABLED
  // const { user, isAuthenticated, hasValidTenant, isValidating, isReady } = useTenantValidation()
  const isValidating = false
  const isReady = true
  
  const { data: profile, error: profileError, isLoading: profileLoading } = useProfile()
  const { currentTenant } = useTenantContext()

  // Mark as mounted to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Set tenant context when profile loads
  useEffect(() => {
    if (profile?.tenantId && !currentTenant) {
      setTenantContext(profile.tenantId)
    }
  }, [profile?.tenantId, currentTenant])

  // Get role-based navigation (must be called before any early returns to maintain hooks order)
  const { navigation } = useRoleNavigation(profile?.role)

  // Get subscription status for owners only (must be called before early returns)
  // Temporarily disabled due to backend tenant context issue
  const { data: subscriptionStatus, error: subscriptionError } = useSubscriptionStatus(
    currentTenant?.id,
    { enabled: false } // Temporarily disabled
  )

  // Enhanced authentication and tenant validation
  useEffect(() => {
    if (!mounted) return
    
    // The useTenantValidation hook handles all auth/tenant checks and redirects automatically
    // No additional logic needed here
  }, [mounted])
  
  // Show loading while validating authentication and tenant
  if (isValidating || !isReady || profileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {isValidating ? 'Validating your access...' : 'Loading your workspace...'}
          </p>
        </div>
      </div>
    )
  }
  
  // Show trial warning for owners
  const showTrialWarning = profile?.role === 'OWNER' && 
    subscriptionStatus?.branches && Array.isArray(subscriptionStatus.branches) &&
    subscriptionStatus.branches.some(branch => 
      branch?.status === 'ACTIVE' && 
      branch?.subscription?.plan?.billingCycle === 'TRIAL' &&
      branch?.daysRemaining <= 7 // Show warning when 7 days or less remaining
    )

  const handleSignOut = async () => {
    // Use the centralized auth manager for consistent logout
    const { authManager } = await import('@/lib/auth/auth-utils')
    await authManager.logout() // This will clear all auth data and redirect automatically
  }

  // Wrap content with OnboardingWrapper for OWNER role only
  const layoutContent = (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 px-6 py-6">
            <div className="flex h-16 shrink-0 items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">CreativeCore</h1>
            </div>
            <nav className="mt-8">
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-50 dark:hover:text-indigo-300 dark:hover:bg-gray-700"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-2">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">CreativeCore</h1>
          </div>
          
          {/* Tenant Switcher */}
          <TenantSwitcher />
          
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-gray-50 dark:hover:text-indigo-300 dark:hover:bg-gray-700"
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-2 sm:gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:px-6 lg:px-8 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-600 lg:hidden flex-shrink-0" />

          <div className="flex flex-1 gap-x-2 sm:gap-x-4 lg:gap-x-6 self-stretch min-w-0">
           <div className="flex flex-1 items-center min-w-0">
             {currentTenant && (
               <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                 <span className="font-medium truncate">{currentTenant.name}</span>
                 <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-200 flex-shrink-0">
                   {currentTenant.category}
                 </span>
               </div>
              )}
            </div>
            <div className="flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6 flex-shrink-0">
              {/* Expiring Members Button - temporarily hidden */}
              {/* Expiring Members Button - temporarily disabled due to TypeScript issues */}
              {/*
              {false && profile && (
                <ExpiringMembersButton
                  userRole={profile.role as 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF'}
                  userTenantId={currentTenant?.id}
                />
              )}
              */}
              
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              
              <ThemeToggle />
              
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-600" />

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={profile?.firstName || ''} />
                      <AvatarFallback>
                        {profile?.firstName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.firstName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Trial Warning */}
        {showTrialWarning && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 lg:px-8">
            <Alert className="border-amber-200 bg-transparent">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Trial Ending Soon:</strong> Your free trial expires in{' '}
                {subscriptionStatus?.branches
                  .filter(b => b.subscription?.plan?.billingCycle === 'TRIAL')
                  .map(b => `${b.daysRemaining} days`)
                  .join(', ')}
                . <Link href="/subscription" className="underline font-medium">Upgrade now</Link> to continue using all features.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8 max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
      
      {/* Expiring Members Auto Popup - disabled */}
      {/* Auto popup has been disabled as requested */}
    </div>
  )

  // Only wrap with OnboardingWrapper for OWNER role
  if (profile?.role === 'OWNER' && profile?.tenantId) {
    return (
      <OnboardingWrapper tenantId={profile.tenantId}>
        {layoutContent}
      </OnboardingWrapper>
    )
  }

  return layoutContent
}
