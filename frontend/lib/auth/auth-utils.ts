// Authentication utilities for session management and validation
import { devAuth } from './dev-auth'

// Utility to safely serialize objects
function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      // Remove functions, undefined values, and potential cross-origin objects
      if (typeof value === 'function') return undefined
      if (value === undefined) return undefined
      if (value && typeof value === 'object') {
        // Check for potential cross-origin wrappers
        if (value.constructor && value.constructor.name === 'XrayWrapper') return undefined
        // Remove DOM elements
        if (value.nodeType || value.tagName) return undefined
      }
      return value
    })
  } catch (error) {
    console.error('Failed to safely stringify object:', error)
    return '{}'
  }
}

// Utility to safely parse JSON
function safeParse(jsonString: string): any {
  try {
    if (!jsonString || typeof jsonString !== 'string') return null
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Failed to safely parse JSON:', error)
    return null
  }
}

// Get API URL from environment with fallback for development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
if (!API_URL || API_URL === 'undefined') {
  throw new Error('NEXT_PUBLIC_API_URL is not defined. Please check your .env.local file.')
}

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  tenantId: string | null
  tenant?: {
    id: string
    name: string
  } | null
}

export class AuthManager {
  private static instance: AuthManager
  
  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }
  
  /**
   * Get current authenticated user from localStorage
   */
  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null

    try {
      const userData = localStorage.getItem('user_data')
      console.log('getCurrentUser: localStorage user_data exists:', !!userData)
      if (!userData) return null

      // Use safe parse to handle corrupted data gracefully
      const user = safeParse(userData)
      if (!user) {
        console.warn('Failed to parse user_data, clearing auth')
        this.logout()
        return null
      }
      console.log('getCurrentUser: parsed user:', user?.id, user?.email)

      // Validate user data structure
      if (!user || typeof user !== 'object') {
        console.warn('User data is not an object, clearing auth')
        this.logout()
        return null
      }

      if (!user.id || !user.email || !user.role) {
        console.warn('Invalid user data structure, clearing auth')
        this.logout()
        return null
      }

      // Ensure only serializable properties are present
      const sanitizedUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        tenantId: user.tenantId || null,
        tenant: user.tenant || null
      }

      return sanitizedUser
    } catch (error) {
      console.error('Error parsing user data:', error)
      // Clear corrupted data
      try {
        localStorage.removeItem('user_data')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('currentTenant')
      } catch (clearError) {
        console.error('Error clearing corrupted auth data:', clearError)
      }
      return null
    }
  }
  
  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  /**
   * Initialize auth manager - clean up any corrupted data
   */
  initialize(): void {
    if (typeof window === 'undefined') return

    try {
      // Global error handler for localStorage issues
      const handleStorageError = (error: any) => {
        if (error?.message?.includes('XrayWrapper') ||
            error?.message?.includes('cross-origin') ||
            error?.name === 'SyntaxError') {
          console.warn('Detected cross-origin or corruption error, clearing all storage')
          try {
            localStorage.clear()
            sessionStorage.clear()
          } catch (clearError) {
            console.error('Failed to clear storage:', clearError)
          }
          return true
        }
        return false
      }

      // Check if user data exists and is valid
      const userData = localStorage.getItem('user_data')
      if (userData) {
        try {
          const parsed = safeParse(userData)

          if (!parsed || typeof parsed !== 'object') {
            console.warn('User data is corrupted or not an object, clearing auth')
            this.logout()
            return // Don't continue with other checks
          }

          // Additional validation - ensure required properties exist
          if (!parsed.id || !parsed.email || !parsed.role) {
            console.warn('User data missing required properties, clearing auth')
            this.logout()
            return // Don't continue with other checks
          }
        } catch (parseError) {
          if (handleStorageError(parseError)) return
          console.warn('Error parsing user_data during init, clearing auth:', parseError)
          this.logout()
          return
        }
      }

      // Check if auth token exists
      const token = localStorage.getItem('auth_token')
      if (!token && userData) {
        console.warn('Found user_data but no auth_token, clearing auth')
        this.logout()
      }

      // Check tenant data as well
      const tenantData = localStorage.getItem('currentTenant')
      if (tenantData) {
        try {
          safeParse(tenantData)
        } catch (parseError) {
          if (handleStorageError(parseError)) return
          console.warn('Tenant data corrupted, removing:', parseError)
          localStorage.removeItem('currentTenant')
        }
      }

    } catch (error) {
      console.error('Error during auth initialization:', error)
      // Clear everything if there are any issues
      try {
        this.logout()
      } catch (logoutError) {
        // If logout fails, manually clear
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (clearError) {
          console.error('Failed to clear storage:', clearError)
        }
      }
    }
  }
  
  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const user = this.getCurrentUser()
    const token = this.getAuthToken()
    
    // Must have both valid user data and token
    return user !== null && token !== null
  }
  
  /**
   * Validate if user's authentication and tenant access are still valid
   */
  async validateUserAccess(): Promise<{ isValid: boolean; reason?: string }> {
    const user = this.getCurrentUser()
    const token = this.getAuthToken()
    
    // Check if we have basic auth data
    if (!user || !token) {
      return { isValid: false, reason: 'No authentication data' }
    }
    
    // Super admins don't need tenant validation
    if (user.role === 'SUPER_ADMIN') {
      return await this.validateTokenOnly(token)
    }
    
    // All other roles (OWNER, MANAGER, STAFF, CLIENT) need tenant validation
    if (!user.tenantId) {
      return { isValid: false, reason: 'Missing tenant assignment for non-super-admin user' }
    }
    
    // Validate both token and tenant access
    return await this.validateTokenAndTenant(token, user.tenantId, user.role)
  }
  
  /**
   * Validate just the authentication token
   */
  private async validateTokenOnly(token: string): Promise<{ isValid: boolean; reason?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        return { isValid: true }
      } else if (response.status === 401) {
        return { isValid: false, reason: 'Token expired or invalid' }
      } else {
        return { isValid: false, reason: `Auth validation failed: ${response.status}` }
      }
    } catch (error) {
      return { isValid: false, reason: 'Network error during auth validation' }
    }
  }
  
  /**
   * Validate both token and tenant access for role-based users
   */
  private async validateTokenAndTenant(token: string, tenantId: string, role: string): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // First validate the token
      const tokenResult = await this.validateTokenOnly(token)
      if (!tokenResult.isValid) {
        return tokenResult
      }
      
      // Then validate tenant access based on role
      const tenantValidation = await this.validateTenantAccess(token, tenantId, role)
      return tenantValidation
      
    } catch (error) {
      return { isValid: false, reason: 'Error during comprehensive validation' }
    }
  }
  
  /**
   * Validate tenant access for different user roles
   */
  private async validateTenantAccess(token: string, tenantId: string, role: string): Promise<{ isValid: boolean; reason?: string }> {
    try {
      let validationEndpoint: string
      
      // Choose appropriate validation endpoint based on role
      switch (role) {
        case 'OWNER':
        case 'MANAGER':
        case 'STAFF':
          // Owners/managers/staff should be able to access gym users for their tenant
          validationEndpoint = `/gym/users/tenant/${tenantId}?limit=1`
          break
        case 'CLIENT':
          // Clients should be able to access their own profile
          validationEndpoint = `/auth/me`
          break
        default:
          return { isValid: false, reason: `Unknown role: ${role}` }
      }
      
      const response = await fetch(`${API_URL}${validationEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        return { isValid: true }
      } else if (response.status === 401) {
        return { isValid: false, reason: 'Authentication expired' }
      } else if (response.status === 403) {
        return { isValid: false, reason: 'Access denied - insufficient permissions' }
      } else if (response.status === 404) {
        return { isValid: false, reason: 'Tenant no longer exists or access revoked' }
      } else {
        return { isValid: false, reason: `Tenant validation failed: ${response.status}` }
      }
    } catch (error) {
      return { isValid: false, reason: 'Network error during tenant validation' }
    }
  }
  
  /**
   * Complete logout - clear all auth data and redirect
   */
  async logout(redirectToLogin = true): Promise<void> {
    if (typeof window === 'undefined') return

    // Get user data BEFORE clearing localStorage for logout event logging
    const user = this.getCurrentUser()

    // Clear localStorage
    localStorage.removeItem('user_data')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('currentTenant')

    // Clear any session storage
    sessionStorage.clear()

    // Clear cookies if any
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })

    console.log('User logged out - all auth data cleared')

    // Log logout event (using user data retrieved before clearing)
    console.log('Logout: user data retrieved:', user ? 'YES' : 'NO', user?.id)
    if (user) {
      console.log('Logging LOGOUT event for user:', user.id)
      await this.logAuthEvent('LOGOUT', user.id, user.tenantId || undefined)
    } else {
      console.log('No user data found for logout event logging')
    }

    // Redirect to login page
    if (redirectToLogin && !window.location.pathname.includes('/auth')) {
      window.location.href = '/auth/login'
    }
  }
  
  /**
   * Handle authentication failure
   */
  handleAuthFailure(reason: string): void {
    console.warn(`Authentication failure: ${reason}`)
    this.logout()
  }
  
  /**
   * Handle tenant validation failure
   */
  handleTenantFailure(): void {
    console.warn('Tenant validation failed - organization may no longer exist')
    this.logout()
  }
  
  /**
   * Store user data and token
   */
  setAuthData(user: AuthUser, token: string): void {
    if (typeof window === 'undefined') return

    try {
      // Sanitize user object to ensure it's serializable
      const sanitizedUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        tenantId: user.tenantId || null,
        tenant: user.tenant || null
      }

      // Use safe stringify to handle any potential cross-origin objects
      const serializedUser = safeStringify(sanitizedUser)

      // Test that it can be parsed back
      const parsedBack = safeParse(serializedUser)
      if (!parsedBack) {
        throw new Error('Failed to serialize/deserialize user data')
      }

      localStorage.setItem('user_data', serializedUser)
      localStorage.setItem('auth_token', token)

      // Log login event
      console.log('Logging LOGIN event for user:', user.id)
      this.logAuthEvent('LOGIN', user.id, user.tenantId || undefined)
    } catch (error) {
      console.error('Error storing auth data:', error)
      // Don't store corrupted data
      this.logout()
    }
  }
  
  /**
   * Check if current user has required role
   */
  hasRole(requiredRoles: string[]): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    
    return requiredRoles.includes(user.role)
  }
  
  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    const user = this.getCurrentUser()
    if (!user) return 'Guest'

    return `${user.firstName} ${user.lastName}`.trim() || user.email
  }

  /**
   * Log authentication events
   */
  private async logAuthEvent(
    type: string,
    userId?: string,
    tenantId?: string,
    reason?: string
  ): Promise<void> {
    try {
      console.log('Sending auth event:', { type, userId, tenantId, reason })
      const response = await fetch(`${API_URL}/auth/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          userId,
          tenantId,
          userAgent: navigator.userAgent,
          reason,
        }),
      })

      console.log('Auth event response:', response.status, response.statusText)
      if (!response.ok) {
        console.warn('Failed to log auth event:', response.status)
      } else {
        console.log('Auth event logged successfully')
      }
    } catch (error) {
      console.warn('Error logging auth event:', error)
    }
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance()

// Legacy support for existing code
export const authUtils = {
  getCurrentUser: () => authManager.getCurrentUser(),
  isAuthenticated: () => authManager.isAuthenticated(),
  logout: () => authManager.logout(), // This will return a Promise now
  getAuthToken: () => authManager.getAuthToken(),
  hasRole: (roles: string[]) => authManager.hasRole(roles)
}