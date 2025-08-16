'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { setTenantContext } from '@/lib/api'
import { Tenant } from '@/types'

interface TenantContextType {
  currentTenant: Tenant | null
  setCurrentTenant: (tenant: Tenant | null) => void
  tenantId: string | null
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)

  // Update API client tenant context when tenant changes
  useEffect(() => {
    setTenantContext(currentTenant?.id || null)
  }, [currentTenant])

  // Load tenant from localStorage on mount
  useEffect(() => {
    const savedTenant = localStorage.getItem('currentTenant')
    if (savedTenant) {
      try {
        setCurrentTenant(JSON.parse(savedTenant))
      } catch (error) {
        console.warn('Failed to parse saved tenant:', error)
        localStorage.removeItem('currentTenant')
      }
    }
  }, [])

  // Save tenant to localStorage when it changes
  useEffect(() => {
    if (currentTenant) {
      localStorage.setItem('currentTenant', JSON.stringify(currentTenant))
    } else {
      localStorage.removeItem('currentTenant')
    }
  }, [currentTenant])

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        tenantId: currentTenant?.id || null,
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
