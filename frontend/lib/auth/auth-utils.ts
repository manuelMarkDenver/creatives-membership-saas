// Authentication utilities for session management and validation
import { devAuth } from './dev-auth'

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
   * Validate if user's tenant still exists
   */
  async validateUserTenant(): Promise<boolean> {
    const user = this.getCurrentUser()
    if (!user?.tenantId) return true // Super admin or users without tenant
    
    try {
      // Try to fetch tenant data to verify it exists
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/${user.tenantId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      return response.ok
    } catch (error) {
      console.warn('Error validating tenant:', error)
      return false
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
    
    // Clear any session storage
    sessionStorage.clear()
    
    // Clear cookies if any
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
    
    console.log('User logged out - all auth data cleared')
    
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