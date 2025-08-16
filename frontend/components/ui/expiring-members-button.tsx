'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useExpiringMembersCount } from '@/lib/hooks/use-expiring-members'
import { ExpiringMembersModal } from '@/components/modals/expiring-members-modal'

interface ExpiringMembersButtonProps {
  userRole: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF'
  userTenantId?: string
  className?: string
}

export function ExpiringMembersButton({ 
  userRole, 
  userTenantId, 
  className = '' 
}: ExpiringMembersButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // For Super Admin, we'll get a general count. For others, use their tenant
  const tenantId = userRole === 'SUPER_ADMIN' ? '' : userTenantId || ''
  
  const { data: countData, isLoading, error } = useExpiringMembersCount(
    tenantId, 
    7, // 7 days ahead
    { enabled: userRole !== 'SUPER_ADMIN' && !!tenantId }
  )

  // For Super Admin, we'll show a generic button since they need the overview modal to see counts
  const count = userRole === 'SUPER_ADMIN' ? '?' : (typeof countData === 'number' ? countData : (countData as any)?.count || 0)
  const shouldShowBadge = userRole === 'SUPER_ADMIN' || (count && count > 0)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-950"
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Review Expiring</span>
          <span className="sm:hidden">Expiring</span>
        </Button>
        
        {shouldShowBadge && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center text-xs font-bold"
          >
            {isLoading ? '...' : count}
          </Badge>
        )}
      </div>

      <ExpiringMembersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userRole={userRole}
        userTenantId={userTenantId}
        defaultTab="critical"
      />
    </>
  )
}

// Hook for auto-popup logic
export function useExpiringMembersAutoPopup(
  userTenantId?: string,
  userRole?: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF'
) {
  const [shouldShowPopup, setShouldShowPopup] = useState(false)
  
  const { data: countData } = useExpiringMembersCount(
    userTenantId || '', 
    1, // Check for expiring within 1 day (critical)
    { enabled: !!userTenantId && userRole !== 'SUPER_ADMIN' }
  )

  // Check if we should show the popup
  const checkShouldShowPopup = () => {
    const count = typeof countData === 'number' ? countData : (countData as any)?.count || 0
    
    if (userRole === 'SUPER_ADMIN' || !count || count === 0) {
      return false
    }

    // Check localStorage for "remind me later"
    const remindLaterDate = localStorage.getItem('expiring-members-remind-later')
    const today = new Date().toDateString()
    
    // If remind later was set today, don't show popup
    if (remindLaterDate === today) {
      return false
    }

    // Show popup if there are critical expiring members
    return count > 0
  }

  const showPopup = () => {
    setShouldShowPopup(true)
  }

  const hidePopup = () => {
    setShouldShowPopup(false)
  }

  return {
    shouldShowPopup: shouldShowPopup && checkShouldShowPopup(),
    showPopup,
    hidePopup,
    criticalCount: typeof countData === 'number' ? countData : (countData as any)?.count || 0
  }
}
