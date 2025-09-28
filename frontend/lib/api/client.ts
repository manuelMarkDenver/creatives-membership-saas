import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
// SECURITY: Bypass auth should NEVER be enabled in production
const BYPASS_AUTH = process.env.NODE_ENV === 'production'
  ? false
  : process.env.NEXT_PUBLIC_API_BYPASS_AUTH === 'true'


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
            console.warn('Failed to get Supabase session:', error);
            if (BYPASS_AUTH) {
              useBypass = true;
              config.headers['x-bypass-auth'] = 'true';
            }
          }
        }
      } catch (error) {
        console.warn('Failed to process auth:', error);
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

    // For bypass auth with specific user (if we have stored user email)
    if (useBypass) {
      if (storedUser?.email) {
        config.headers['x-bypass-user'] = storedUser.email;
      } else {
        config.headers['x-bypass-user'] = 'owner@muscle-mania.com';
      }
    }

    return config;
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

export default apiClient
