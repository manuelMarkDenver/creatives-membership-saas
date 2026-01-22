'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { setTenantContext } from '@/lib/api'
import { Tenant } from '@/types'
import { authManager } from '@/lib/auth/auth-utils'

interface TenantContextType {
  currentTenant: Tenant | null
  setCurrentTenant: (tenant: Tenant | null) => void
  setTenantId: (id: string | null) => void
  tenantId: string | null
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Mark as mounted to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch tenant when tenantId changes
  useEffect(() => {
    const fetchTenant = async () => {
      if (mounted && tenantId && authManager.isAuthenticated()) {
        try {
          const { apiClient } = await import('../api/client')
          const res = await apiClient.get(`/tenants/${tenantId}`)
          console.log('Fetched tenant:', res.data)
          setCurrentTenant(res.data)
        } catch (error) {
          console.error('Failed to fetch tenant:', error)
        }
      } else if (!tenantId || !authManager.isAuthenticated()) {
        setCurrentTenant(null)
      }
    }
    fetchTenant()
  }, [tenantId, mounted])

  // Update tenantId when currentTenant changes
  useEffect(() => {
    if (mounted) {
      setTenantId(currentTenant?.id || null)
      setTenantContext(currentTenant?.id || null)
    }
  }, [currentTenant, mounted])

  // Safe serialization utilities
  const safeStringify = (obj: any): string => {
    try {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'function') return undefined
        if (value === undefined) return undefined
        if (value && typeof value === 'object') {
          if (value.constructor && value.constructor.name === 'XrayWrapper') return undefined
          if (value.nodeType || value.tagName) return undefined
        }
        return value
      })
    } catch (error) {
      console.error('Failed to safely stringify tenant:', error)
      return '{}'
    }
  }

  const safeParse = (jsonString: string): any => {
    try {
      if (!jsonString || typeof jsonString !== 'string') return null
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('Failed to safely parse tenant JSON:', error)
      return null
    }
  }

  // Load tenant from localStorage on mount (only on client)
  useEffect(() => {
    if (mounted) {
      const savedTenant = localStorage.getItem('currentTenant')
      if (savedTenant) {
        const parsed = safeParse(savedTenant)
        if (parsed) {
          setCurrentTenant(parsed)
        } else {
          console.warn('Failed to parse saved tenant, clearing')
          localStorage.removeItem('currentTenant')
        }
      }
    }
  }, [mounted])

  // Save tenant to localStorage when it changes (only on client)
  useEffect(() => {
    console.log('currentTenant updated:', currentTenant)
    if (mounted) {
      if (currentTenant && authManager.isAuthenticated()) {
        const serialized = safeStringify(currentTenant)
        localStorage.setItem('currentTenant', serialized)
      } else {
        localStorage.removeItem('currentTenant')
      }
    }
  }, [currentTenant, mounted])

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        setTenantId,
        tenantId,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenantContext() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenantContext must be used within a TenantProvider')
  }
  return context
}
