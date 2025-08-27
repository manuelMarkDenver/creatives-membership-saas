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
  enabled = false // Default to false to disable auto popup
}: ExpiringMembersAutoPopupProps) {
  // Auto popup is now disabled by default
  // Return null to prevent any rendering
  return null
}
