// Authentication utilities for session management and validation
import { devAuth } from './dev-auth'

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
      if (!userData) return null
      
      const user = JSON.parse(userData)
      
      // Validate user data structure
      if (!user.id || !user.email || !user.role) {
        console.warn('Invalid user data structure, clearing auth')
        this.logout()
        return null
      }
      
      return user
    } catch (error) {
      console.error('Error parsing user data:', error)
      this.logout()
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
  logout(redirectToLogin = true): void {
    if (typeof window === 'undefined') return

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

    // Log logout event
    const user = this.getCurrentUser()
    if (user) {
      this.logAuthEvent('LOGOUT', user.id, user.tenantId, reason)
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

    localStorage.setItem('user_data', JSON.stringify(user))
    localStorage.setItem('auth_token', token)

    // Log login event
    this.logAuthEvent('LOGIN', user.id, user.tenantId)
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
      const response = await fetch(`${API_URL}/auth/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          userId,
          tenantId,
          ipAddress: undefined, // Browser can't get real IP
          userAgent: navigator.userAgent,
          reason,
        }),
      })

      if (!response.ok) {
        console.warn('Failed to log auth event:', response.status)
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
  logout: () => authManager.logout(),
  getAuthToken: () => authManager.getAuthToken(),
  hasRole: (roles: string[]) => authManager.hasRole(roles)
}