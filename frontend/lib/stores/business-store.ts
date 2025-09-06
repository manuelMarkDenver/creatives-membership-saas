import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types for multi-business architecture
export type BusinessType = 'gym' | 'coffee' | 'ecommerce'
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'CLIENT'

export interface BusinessContext {
  tenantId: string
  tenantName: string
  businessType: BusinessType
  slug: string
  branchId?: string
  branchName?: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  tenantId?: string
  isActive: boolean
}

interface BusinessStore {
  // Authentication State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Business Context State
  currentBusiness: BusinessContext | null
  availableBusinesses: BusinessContext[]
  
  // Multi-business routing
  businessSlug: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setAuthenticated: (authenticated: boolean) => void
  setLoading: (loading: boolean) => void
  setCurrentBusiness: (business: BusinessContext | null) => void
  setAvailableBusinesses: (businesses: BusinessContext[]) => void
  setBusinessSlug: (slug: string | null) => void
  
  // Business context helpers
  isSuperAdmin: () => boolean
  isBusinessAdmin: () => boolean
  hasAccess: (requiredRole: UserRole) => boolean
  getCurrentBusinessType: () => BusinessType | null
  
  // Reset functions
  reset: () => void
  logout: () => void
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  currentBusiness: null,
  availableBusinesses: [],
  businessSlug: null,
}

export const useBusinessStore = create<BusinessStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Actions
        setUser: (user) => set({ user }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        setLoading: (isLoading) => set({ isLoading }),
        setCurrentBusiness: (currentBusiness) => set({ currentBusiness }),
        setAvailableBusinesses: (availableBusinesses) => set({ availableBusinesses }),
        setBusinessSlug: (businessSlug) => set({ businessSlug }),
        
        // Business context helpers
        isSuperAdmin: () => {
          const { user } = get()
          return user?.role === 'SUPER_ADMIN'
        },
        
        isBusinessAdmin: () => {
          const { user } = get()
          return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
        },
        
        hasAccess: (requiredRole: UserRole) => {
          const { user } = get()
          if (!user) return false
          
          const roleHierarchy: Record<UserRole, number> = {
            'CLIENT': 1,
            'STAFF': 2,
            'MANAGER': 3,
            'ADMIN': 4,
            'SUPER_ADMIN': 5,
          }
          
          return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
        },
        
        getCurrentBusinessType: () => {
          const { currentBusiness } = get()
          return currentBusiness?.businessType || null
        },
        
        // Reset functions
        reset: () => set(initialState),
        logout: () => {
          set({
            user: null,
            isAuthenticated: false,
            currentBusiness: null,
            businessSlug: null,
          })
        },
      }),
      {
        name: 'business-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          currentBusiness: state.currentBusiness,
          businessSlug: state.businessSlug,
        }),
      }
    ),
    { name: 'BusinessStore' }
  )
)
