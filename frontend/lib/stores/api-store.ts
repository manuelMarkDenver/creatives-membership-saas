import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// API response caching interface
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface ApiStore {
  // Cache Management
  cache: Map<string, CacheEntry<any>>
  
  // Loading states for different endpoints
  loadingStates: Map<string, boolean>
  
  // Error states for different endpoints
  errorStates: Map<string, string | null>
  
  // Actions
  setCache: <T>(key: string, data: T, ttl?: number) => void
  getCache: <T>(key: string) => T | null
  clearCache: (key?: string) => void
  
  // Loading state management
  setLoading: (key: string, loading: boolean) => void
  getLoading: (key: string) => boolean
  
  // Error state management
  setError: (key: string, error: string | null) => void
  getError: (key: string) => string | null
  
  // Cache utilities
  isCacheValid: (key: string) => boolean
  cleanExpiredCache: () => void
  
  // Reset
  reset: () => void
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

const initialState = {
  cache: new Map<string, CacheEntry<any>>(),
  loadingStates: new Map<string, boolean>(),
  errorStates: new Map<string, string | null>(),
}

export const useApiStore = create<ApiStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Cache Management
      setCache: <T>(key: string, data: T, ttl = DEFAULT_TTL) => {
        const { cache } = get()
        const now = Date.now()
        const newCache = new Map(cache)
        
        newCache.set(key, {
          data,
          timestamp: now,
          expiresAt: now + ttl,
        })
        
        set({ cache: newCache })
      },
      
      getCache: <T>(key: string): T | null => {
        const { cache, isCacheValid } = get()
        const entry = cache.get(key)
        
        if (!entry || !isCacheValid(key)) {
          return null
        }
        
        return entry.data as T
      },
      
      clearCache: (key?: string) => {
        const { cache } = get()
        const newCache = new Map(cache)
        
        if (key) {
          newCache.delete(key)
        } else {
          newCache.clear()
        }
        
        set({ cache: newCache })
      },
      
      // Loading state management
      setLoading: (key: string, loading: boolean) => {
        const { loadingStates } = get()
        const newLoadingStates = new Map(loadingStates)
        
        if (loading) {
          newLoadingStates.set(key, true)
        } else {
          newLoadingStates.delete(key)
        }
        
        set({ loadingStates: newLoadingStates })
      },
      
      getLoading: (key: string) => {
        const { loadingStates } = get()
        return loadingStates.get(key) || false
      },
      
      // Error state management
      setError: (key: string, error: string | null) => {
        const { errorStates } = get()
        const newErrorStates = new Map(errorStates)
        
        if (error) {
          newErrorStates.set(key, error)
        } else {
          newErrorStates.delete(key)
        }
        
        set({ errorStates: newErrorStates })
      },
      
      getError: (key: string) => {
        const { errorStates } = get()
        return errorStates.get(key) || null
      },
      
      // Cache utilities
      isCacheValid: (key: string) => {
        const { cache } = get()
        const entry = cache.get(key)
        
        if (!entry) return false
        
        return Date.now() < entry.expiresAt
      },
      
      cleanExpiredCache: () => {
        const { cache } = get()
        const newCache = new Map<string, CacheEntry<any>>()
        const now = Date.now()
        
        cache.forEach((entry, key) => {
          if (now < entry.expiresAt) {
            newCache.set(key, entry)
          }
        })
        
        set({ cache: newCache })
      },
      
      // Reset
      reset: () => set(initialState),
    }),
    { name: 'ApiStore' }
  )
)

// Cache key generators for consistency
export const CacheKeys = {
  MEMBERS: (tenantId: string, branchId?: string) => 
    `members:${tenantId}${branchId ? `:${branchId}` : ''}`,
  SUBSCRIPTION_STATS: (tenantId: string, branchId?: string) => 
    `subscription-stats:${tenantId}${branchId ? `:${branchId}` : ''}`,
  EXPIRING_MEMBERS: (tenantId: string, branchId?: string, days = 7) => 
    `expiring-members:${tenantId}${branchId ? `:${branchId}` : ''}:${days}`,
  MEMBERSHIP_PLANS: (tenantId: string) => 
    `membership-plans:${tenantId}`,
  BRANCHES: (tenantId: string) => 
    `branches:${tenantId}`,
  USER_PROFILE: (userId: string) => 
    `user-profile:${userId}`,
}
