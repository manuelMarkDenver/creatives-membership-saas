import axios from 'axios'

// Get API URL from environment with fallback for development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
if (!API_URL || API_URL === 'undefined') {
  throw new Error('NEXT_PUBLIC_API_URL is not defined. Please check your .env.local file.')
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})


// Tenant context for API calls
let currentTenantId: string | null = null

export const setTenantContext = (tenantId: string | null) => {
  currentTenantId = tenantId
}

export const getTenantContext = () => currentTenantId

// Request interceptor to add auth token and tenant context
apiClient.interceptors.request.use(
  async (config) => {
    // Only check for stored auth on client side
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('auth_token');

        if (storedToken) {
          // Use real authentication token
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }

    // Add tenant context from multiple sources
    let tenantId = currentTenantId;

    // If no tenant context is set but we have stored user data, try to get tenant from there
    if (!tenantId && typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const storedUser = JSON.parse(userData);
          tenantId = storedUser?.tenantId;
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }

    // Add tenant header if available
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error)
  }
)

import { authManager } from '@/lib/auth/auth-utils'

// Check if error is tenant-related (404 for tenant endpoints)
const isTenantNotFoundError = (error: any): boolean => {
  if (error.response?.status !== 404) return false
  
  const url = error.config?.url || ''
  // Check if URL contains tenant-specific endpoints
  return url.includes('/tenant/') || 
         url.includes('/gym/users/tenant/') || 
         url.includes('/gym/members/tenant/') ||
         url.includes('/tenants/')
}

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      console.warn('Network error - unable to reach server:', error.message)
      // Don't logout on network errors - just return the error
      return Promise.reject(new Error('Network error - unable to reach server. Please check your connection.'))
    }

    // Handle authentication errors (401 - Unauthorized)
    if (error.response?.status === 401) {
      console.error('401 Authentication error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        data: error.response.data
      })
      authManager.handleAuthFailure('Authentication token invalid or expired')
      return Promise.reject(new Error('Authentication failed. Please log in again.'))
    }

    // Handle tenant not found errors (404 for tenant-specific endpoints)
    if (isTenantNotFoundError(error)) {
      authManager.handleTenantFailure()
      return Promise.reject(new Error('Your account access has been revoked or your organization no longer exists. Please log in again.'))
    }

    // Handle forbidden access (403)
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || 'Access denied'
      console.warn('Access forbidden:', errorMessage)

      // Don't logout for business logic errors - only for auth errors
      // Business logic errors: role, permission, subscription limits, branch limits, RBAC, etc.
      if (
        errorMessage.includes('role') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('limit') ||
        errorMessage.includes('subscription') ||
        errorMessage.includes('branch') ||
        errorMessage.includes('Upgrade') ||
        errorMessage.includes('RBAC') ||
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('Forbidden') ||
        errorMessage.includes('Access denied') ||
        errorMessage.includes('OWNER') ||
        errorMessage.includes('MANAGER') ||
        errorMessage.includes('STAFF') ||
        errorMessage.includes('SUPER_ADMIN')
      ) {
        return Promise.reject(new Error(`Access denied: ${errorMessage}`))
      }

      // For other 403 errors, it might be an auth issue
      authManager.handleAuthFailure('Access denied - invalid permissions')
      return Promise.reject(new Error('Access denied. Please log in again.'))
    }

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      })
    }

    // Enhance error with better message extraction
    if (error.response?.data?.message && !error.message.includes(error.response.data.message)) {
      error.message = error.response.data.message
    }

    return Promise.reject(error)
  }
)

// Auth API functions
export const authApi = {
  // Login
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password })
    return response.data
  },

  // Register new tenant
  registerTenant: async (data: {
    name: string
    category: string
    ownerFirstName: string
    ownerLastName: string
    ownerEmail: string
    ownerPhoneNumber?: string
    agreeToTerms?: boolean
  }) => {
    const response = await apiClient.post('/auth/register-tenant', data)
    return response.data
  },

  // Verify email with token
  verifyEmail: async (token: string) => {
    const response = await apiClient.get(`/auth/verify-email/${token}`)
    return response.data
  },

  // Resend verification email
  resendVerification: async (email: string) => {
    const response = await apiClient.post('/auth/resend-verification', { email })
    return response.data
  },

  // Get current user
  getMe: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  // Create Google user with tenant selection
  createGoogleUser: async (data: {
    googleId: string
    email: string
    firstName: string
    lastName: string
    tenantId: string
  }) => {
    const response = await apiClient.post('/auth/create-google-user', data)
    return response.data
  },

  // Set password for Google OAuth users
  setGooglePassword: async (password: string) => {
    const response = await apiClient.post('/auth/set-google-password', { password })
    return response.data
  },
}

export default apiClient
