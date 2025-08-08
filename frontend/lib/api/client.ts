import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
const BYPASS_AUTH = process.env.NEXT_PUBLIC_API_BYPASS_AUTH === 'true'

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined')
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
    // Add bypass auth header for local development
    if (BYPASS_AUTH) {
      config.headers['x-bypass-auth'] = 'true'
    } else {
      // Only call getSession on client side
      if (typeof window !== 'undefined') {
        try {
          // First try stored token (for email/password auth)
          const storedToken = localStorage.getItem('auth_token');
          if (storedToken) {
            config.headers.Authorization = `Bearer ${storedToken}`;
          } else {
            // Fall back to Supabase session (for OAuth auth)
            const { getSession } = await import('@/lib/auth/supabase')
            const { session } = await getSession()
            if (session?.access_token) {
              config.headers.Authorization = `Bearer ${session.access_token}`
            }
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error)
        }
      }
    }

    // Add tenant context
    if (currentTenantId) {
      config.headers['x-tenant-id'] = currentTenantId
      // console.log(`[API Client] Adding tenant context: ${currentTenantId} for ${config.method?.toUpperCase()} ${config.url}`)
    } else {
      // console.warn(`[API Client] No tenant context for ${config.method?.toUpperCase()} ${config.url}`)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
        window.location.href = '/auth/login'
      }
    }

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      })
    }

    return Promise.reject(error)
  }
)

export default apiClient
