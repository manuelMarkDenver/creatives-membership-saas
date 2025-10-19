import { useEffect, useState } from 'react'
import { authManager, AuthUser } from '@/lib/auth/auth-utils'

interface AuthValidationState {
  user: AuthUser | null
  isAuthenticated: boolean
  isValidating: boolean
  hasValidTenant: boolean
  error: string | null
}

/**
 * Hook for comprehensive authentication and tenant validation
 * Automatically validates user auth state and tenant existence
 */
export function useAuthValidation() {
  const [state, setState] = useState<AuthValidationState>({
    user: null,
    isAuthenticated: false,
    isValidating: true,
    hasValidTenant: true,
    error: null
  })

  useEffect(() => {
    let mounted = true

    const validateAuth = async () => {
      try {
        setState(prev => ({ ...prev, isValidating: true, error: null }))

        // Check basic authentication
        const user = authManager.getCurrentUser()
        const isAuthenticated = authManager.isAuthenticated()

        if (!user || !isAuthenticated) {
          if (mounted) {
            setState({
              user: null,
              isAuthenticated: false,
              isValidating: false,
              hasValidTenant: false,
              error: 'Not authenticated'
            })
          }
          return
        }

        // Validate tenant if user has one
        let hasValidTenant = true
        if (user.tenantId) {
          hasValidTenant = await authManager.validateUserTenant()
          
          if (!hasValidTenant) {
            console.warn('Tenant validation failed - logging out user')
            authManager.handleTenantFailure()
            if (mounted) {
              setState({
                user: null,
                isAuthenticated: false,
                isValidating: false,
                hasValidTenant: false,
                error: 'Your organization no longer exists'
              })
            }
            return
          }
        }

        if (mounted) {
          setState({
            user,
            isAuthenticated: true,
            isValidating: false,
            hasValidTenant,
            error: null
          })
        }

      } catch (error) {
        console.error('Auth validation error:', error)
        
        if (mounted) {
          setState({
            user: null,
            isAuthenticated: false,
            isValidating: false,
            hasValidTenant: false,
            error: 'Authentication validation failed'
          })
        }
        
        // Clear potentially corrupted auth data
        authManager.logout()
      }
    }

    validateAuth()

    // Cleanup
    return () => {
      mounted = false
    }
  }, [])

  return {
    ...state,
    logout: () => authManager.logout(),
    refresh: () => {
      setState(prev => ({ ...prev, isValidating: true }))
      // Re-trigger validation by updating dependency
    }
  }
}

/**
 * Hook for validating tenant access on specific pages
 * Should be used on tenant-specific pages
 */
export function useTenantValidation() {
  const { user, isAuthenticated, hasValidTenant, isValidating } = useAuthValidation()
  
  useEffect(() => {
    // If validation is complete and either not authenticated or invalid tenant
    if (!isValidating && (!isAuthenticated || !hasValidTenant)) {
      console.warn('Tenant validation failed - redirecting to login')
      authManager.logout()
    }
  }, [isAuthenticated, hasValidTenant, isValidating])

  return {
    user,
    isAuthenticated,
    hasValidTenant,
    isValidating,
    isReady: !isValidating && isAuthenticated && hasValidTenant
  }
}

/**
 * Hook to monitor auth state changes
 * Useful for components that need to react to login/logout
 */
export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authManager.getCurrentUser()
      const authenticated = authManager.isAuthenticated()
      
      setUser(currentUser)
      setIsAuthenticated(authenticated)
    }

    // Check on mount
    checkAuth()

    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_data' || e.key === 'auth_token') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Periodic check every 30 seconds
    const interval = setInterval(checkAuth, 30000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return {
    user,
    isAuthenticated,
    displayName: authManager.getUserDisplayName(),
    hasRole: (roles: string[]) => authManager.hasRole(roles),
    logout: () => authManager.logout()
  }
}