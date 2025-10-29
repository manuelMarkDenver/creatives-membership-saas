import axios from 'axios'

// Get API URL from environment with fallback for development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
// SECURITY: Bypass auth should NEVER be enabled in production
const BYPASS_AUTH = process.env.NODE_ENV === 'production'
  ? false
  : process.env.NEXT_PUBLIC_API_BYPASS_AUTH === 'true'


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
    let useBypass = false;
    let storedUser = null;

    // Only check for stored auth on client side
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          storedUser = JSON.parse(userData);
        }
        const storedToken = localStorage.getItem('auth_token');

        // Use bypass auth when BYPASS_AUTH is enabled (development mode)
        if (BYPASS_AUTH) {
          useBypass = true;
          config.headers['x-bypass-auth'] = 'true';
        } else if (storedToken) {
          // Use real authentication token
          config.headers.Authorization = `Bearer ${storedToken}`;
        } else {
          // Try Supabase session as fallback
          try {
            const { getSession } = await import('@/lib/auth/supabase')
            const { session } = await getSession()
            if (session?.access_token) {
              config.headers.Authorization = `Bearer ${session.access_token}`
            } else if (BYPASS_AUTH) {
              useBypass = true;
              config.headers['x-bypass-auth'] = 'true';
            }
          } catch (error) {
            if (BYPASS_AUTH) {
              useBypass = true;
              config.headers['x-bypass-auth'] = 'true';
            }
          }
        }
      } catch (error) {
        if (BYPASS_AUTH) {
          useBypass = true;
          config.headers['x-bypass-auth'] = 'true';
        }
      }
    } else if (BYPASS_AUTH) {
      // Server-side and bypass enabled
      useBypass = true;
      config.headers['x-bypass-auth'] = 'true';
    }

    // Add tenant context from multiple sources
    let tenantId = currentTenantId;
    
    // If no tenant context is set but we have stored user data, try to get tenant from there
    if (!tenantId && storedUser?.tenantId) {
      tenantId = storedUser.tenantId;
    }
    
    // Add tenant header if available
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
    
    // Add user email for backend identification (temporary until proper JWT)
    if (storedUser?.email) {
      config.headers['x-user-email'] = storedUser.email;
    }

    // For bypass auth with specific user (if we have stored user email)
    if (useBypass) {
      if (storedUser?.email) {
        config.headers['x-bypass-user'] = storedUser.email;
      } else {
        // Use super admin email for tenant management and general admin functions
        config.headers['x-bypass-user'] = 'admin@creatives-saas.com';
      }
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
      // Business logic errors: role, permission, subscription limits, branch limits, etc.
      if (
        errorMessage.includes('role') || 
        errorMessage.includes('permission') ||
        errorMessage.includes('limit') ||
        errorMessage.includes('subscription') ||
        errorMessage.includes('branch') ||
        errorMessage.includes('Upgrade')
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
}

export default apiClient
