'use client'

import { useEffect, useState } from 'react'
import { ExpiringMembersModal } from '@/components/modals/expiring-members-modal'
import { useExpiringMembersCount } from '@/lib/hooks/use-expiring-members'

interface ExpiringMembersAutoPopupProps {
  userRole: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF'
  userTenantId?: string
  enabled?: boolean
}

export function ExpiringMembersAutoPopup({
  userRole,
  userTenantId,
  enabled = true
}: ExpiringMembersAutoPopupProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  
  // Get critical expiring members (expiring today or already expired)
  const { data: criticalCount } = useExpiringMembersCount(
    userTenantId || '',
    0, // Expiring today or already expired
    { 
      enabled: enabled && userRole !== 'SUPER_ADMIN' && !!userTenantId,
      refetchInterval: 60000 // Check every minute
    }
  )

  useEffect(() => {
    const count = typeof criticalCount === 'number' ? criticalCount : (criticalCount as any)?.count || 0
    
    if (!enabled || userRole === 'SUPER_ADMIN' || !count) {
      return
    }

    // Check localStorage for "remind me later"
    const remindLaterDate = localStorage.getItem('expiring-members-remind-later')
    const today = new Date().toDateString()
    
    // If remind later was set today, don't show popup
    if (remindLaterDate === today) {
      return
    }

    // Show popup if there are members expiring today
    if (count > 0) {
      // Add a small delay to avoid showing immediately on page load
      const timer = setTimeout(() => {
        setIsPopupOpen(true)
      }, 2000) // 2 second delay

      return () => clearTimeout(timer)
    }
  }, [criticalCount, enabled, userRole])

  const handleClose = () => {
    setIsPopupOpen(false)
  }

  // Only render for non-super-admin users with a tenant
  if (userRole === 'SUPER_ADMIN' || !userTenantId || !enabled) {
    return null
  }

  return (
    <ExpiringMembersModal
      isOpen={isPopupOpen}
      onClose={handleClose}
      userRole={userRole}
      userTenantId={userTenantId}
      defaultTab="critical"
    />
  )
}
