// REDESIGNED Member Status System - Proper Separation of Concerns
// This fixes the fundamental conflict between display and notification logic

export interface MemberEffectiveStatus {
  canAccessFacilities: boolean
  displayStatus: 'ACTIVE' | 'EXPIRED' | 'EXPIRING' | 'CANCELLED' | 'SUSPENDED' | 'NO_SUBSCRIPTION' | 'DELETED'
  primaryIssue?: string
  statusColor: 'green' | 'orange' | 'yellow' | 'red' | 'gray' | 'blue'
  statusIcon: 'check' | 'clock' | 'x' | 'alert' | 'info' | 'trash'
}

export interface DisplayStatus {
  status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING' | 'CANCELLED' | 'NO_SUBSCRIPTION' | 'DELETED'
  label: string
  color: 'green' | 'orange' | 'yellow' | 'red' | 'gray'
  canAccess: boolean
}

export interface NotificationStatus {
  needsAttention: boolean
  category: 'EXPIRING_SOON' | 'RECENTLY_EXPIRED' | 'LONG_EXPIRED' | 'OK'
  urgency: 'critical' | 'high' | 'medium' | 'low'
  daysFromExpiry: number
}

export interface MemberData {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  isActive: boolean
  deletedAt?: string | null
  customerSubscriptions?: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    cancelledAt?: string | null
    branchId?: string
    createdAt?: string
  }>
  businessData?: {
    membership?: {
      status?: string
      cancelledAt?: string | null
      endDate?: string
    }
  }
}

/**
 * Calculate a member's effective status from both user account and subscription data
 */
export function calculateMemberStatus(member: MemberData): MemberEffectiveStatus {
  // Debug logging for specific members
  const debugEmails = ['stephanie20b1@muscle-mania.com', 'daniel15b1@muscle-mania.com', 'lisa8b1@muscle-mania.com', 'anthony23b1@muscle-mania.com']
  const isDebugMember = debugEmails.includes(member.email)
  
  if (isDebugMember) {
    console.log(`[DEBUG] Calculating status for ${member.email}:`, {
      subscriptions: member.customerSubscriptions?.map(sub => ({
        id: sub.id,
        status: sub.status,
        endDate: sub.endDate,
        cancelledAt: sub.cancelledAt
      })),
      isActive: member.isActive,
      deletedAt: member.deletedAt
    })
  }

  // Check if user account is deleted (soft delete)
  const isDeleted = Boolean(member.deletedAt)
  if (isDeleted) {
    return {
      canAccessFacilities: false,
      displayStatus: 'DELETED',
      primaryIssue: 'Account deleted',
      statusColor: 'gray',
      statusIcon: 'trash'
    }
  }

  // Get the most recent subscription matching backend logic
  // Backend uses the most recent subscription by creation date
  // Sort by creation date (most recent first), then by end date (latest first)
  const subscriptions = [...(member.customerSubscriptions || [])]
    .sort((a, b) => {
      // First sort by creation date if available (most recent first)
      const aCreated = new Date(a.createdAt || a.startDate).getTime()
      const bCreated = new Date(b.createdAt || b.startDate).getTime()
      if (aCreated !== bCreated) {
        return bCreated - aCreated
      }
      // Then by end date (latest first)
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    })
  
  // Select the most recent subscription (matching backend logic)
  const subscription = subscriptions[0]
  const businessMembership = member.businessData?.membership
  
  if (isDebugMember) {
    console.log(`[DEBUG] Selected subscription for ${member.email}:`, {
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        endDate: subscription.endDate,
        cancelledAt: subscription.cancelledAt
      } : null,
      businessMembership: businessMembership
    })
  }
  
  // If no subscription data available, member has no subscription
  if (!subscription && !businessMembership) {
    return {
      canAccessFacilities: false,
      displayStatus: 'NO_SUBSCRIPTION',
      primaryIssue: 'No subscription found',
      statusColor: 'gray',
      statusIcon: 'info'
    }
  }

  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0) // Normalize to start of day

  // Check subscription status - prefer customerSubscriptions over businessData
  let subscriptionStatus: string
  let subscriptionEndDate: Date | null = null
  let subscriptionCancelledAt: string | null = null

  if (subscription) {
    subscriptionStatus = subscription.status
    subscriptionCancelledAt = subscription.cancelledAt
    if (subscription.endDate) {
      subscriptionEndDate = new Date(subscription.endDate)
      subscriptionEndDate.setHours(0, 0, 0, 0)
    }
  } else if (businessMembership) {
    subscriptionStatus = businessMembership.status?.toUpperCase() || 'UNKNOWN'
    subscriptionCancelledAt = businessMembership.cancelledAt
    if (businessMembership.endDate) {
      subscriptionEndDate = new Date(businessMembership.endDate)
      subscriptionEndDate.setHours(0, 0, 0, 0)
    }
  } else {
    subscriptionStatus = 'UNKNOWN'
  }

  // Check if subscription is expired or expiring soon (within 7 days)
  const isExpired = subscriptionEndDate && subscriptionEndDate < currentDate
  const isExpiringSoon = subscriptionEndDate && subscriptionEndDate <= new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000))

  // Check if subscription is cancelled
  const isCancelled = subscriptionStatus === 'CANCELLED' || Boolean(subscriptionCancelledAt)

  // Determine effective status with priority:
  // 1. Cancelled subscription - never show as expired
  // 2. Inactive account - never show as expired
  // 3. Expired subscription (only for active users with active subscriptions)
  // 4. Active subscription

  if (isCancelled) {
    const result = {
      canAccessFacilities: false,
      displayStatus: 'CANCELLED' as const,
      primaryIssue: 'Subscription cancelled',
      statusColor: 'red' as const,
      statusIcon: 'x' as const
    }
    
    if (isDebugMember) {
      console.log(`[DEBUG] Final status for ${member.email}: CANCELLED`, {
        subscriptionEndDate: subscriptionEndDate?.toISOString(),
        currentDate: currentDate.toISOString(),
        subscriptionStatus,
        cancelledAt: subscriptionCancelledAt
      })
    }
    
    return result
  }

  // Note: We don't check member.isActive here because INACTIVE status has been removed
  // Members are either ACTIVE, EXPIRED, EXPIRING, CANCELLED, NO_SUBSCRIPTION, or DELETED

  // Only show as expired if user is active and subscription is active but expired
  if (isExpired && subscriptionStatus === 'ACTIVE') {
    const daysOverdue = subscriptionEndDate 
      ? Math.ceil((currentDate.getTime() - subscriptionEndDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    const result = {
      canAccessFacilities: false,
      displayStatus: 'EXPIRED' as const,
      primaryIssue: daysOverdue > 0 ? `Expired ${daysOverdue} days ago` : 'Subscription expired',
      statusColor: 'orange' as const,
      statusIcon: 'clock' as const
    }
    
    if (isDebugMember) {
      console.log(`[DEBUG] Final status for ${member.email}: EXPIRED`, {
        subscriptionEndDate: subscriptionEndDate?.toISOString(),
        currentDate: currentDate.toISOString(),
        daysOverdue,
        subscriptionStatus
      })
    }
    
    return result
  }
  
  // Check if subscription is expiring soon (but still active)
  if (isExpiringSoon && !isExpired && subscriptionStatus === 'ACTIVE') {
    const daysRemaining = subscriptionEndDate 
      ? Math.ceil((subscriptionEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0
      
    const result = {
      canAccessFacilities: true,
      displayStatus: 'EXPIRING' as const,
      primaryIssue: `Expires in ${daysRemaining} days`,
      statusColor: 'yellow' as const,
      statusIcon: 'alert' as const
    }
    
    if (isDebugMember) {
      console.log(`[DEBUG] Final status for ${member.email}: EXPIRING`, {
        subscriptionEndDate: subscriptionEndDate?.toISOString(),
        currentDate: currentDate.toISOString(),
        daysRemaining,
        subscriptionStatus
      })
    }
    
    return result
  }

  if (subscriptionStatus === 'ACTIVE' && subscriptionEndDate && subscriptionEndDate >= currentDate) {
    const daysRemaining = Math.ceil((subscriptionEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const result = {
      canAccessFacilities: true,
      displayStatus: 'ACTIVE',
      primaryIssue: daysRemaining <= 7 ? `Expires in ${daysRemaining} days` : undefined,
      statusColor: 'green',
      statusIcon: 'check'
    }
    
    if (isDebugMember) {
      console.log(`[DEBUG] Final status for ${member.email}: ACTIVE`, {
        subscriptionEndDate: subscriptionEndDate?.toISOString(),
        currentDate: currentDate.toISOString(),
        daysRemaining,
        subscriptionStatus
      })
    }
    
    return result
  }

  // Default case - subscription exists but status is unknown
  const defaultResult = {
    canAccessFacilities: false,
    displayStatus: 'NO_SUBSCRIPTION' as const,
    primaryIssue: 'Subscription status unknown',
    statusColor: 'gray' as const,
    statusIcon: 'info' as const
  }
  
  if (isDebugMember) {
    console.log(`[DEBUG] Final status for ${member.email}: NO_SUBSCRIPTION (default)`, {
      subscriptionStatus,
      subscriptionEndDate: subscriptionEndDate?.toISOString(),
      currentDate: currentDate.toISOString()
    })
  }
  
  return defaultResult
}

/**
 * Get available actions for a member based on their effective status
 */
export function getAvailableMemberActions(member: MemberData) {
  const status = calculateMemberStatus(member)
  const actions: string[] = []

  // Always available actions
  actions.push('view-info', 'view-history', 'view-transactions')

  // Status-specific actions
  switch (status.displayStatus) {
    case 'ACTIVE':
      actions.push('cancel-subscription')
      break
      
    case 'EXPIRED':
      actions.push('renew-subscription')
      break
      
    case 'EXPIRING':
      actions.push('cancel-subscription')
      break
      
    case 'CANCELLED':
      actions.push('renew-subscription')
      break
      
    case 'DELETED':
      actions.push('restore-account')
      break
      
    case 'NO_SUBSCRIPTION':
      actions.push('create-subscription')
      break
  }

  return actions
}

/**
 * Helper function for filtering members by status - CLEAN SEPARATION
 * No more conflicts - filters purely by display status
 */
export function filterMembersByStatus(
  members: MemberData[], 
  filterStatus: 'all' | 'active' | 'expired' | 'expiring' | 'cancelled' | 'deleted' | 'no_subscription',
  showDeleted: boolean = false
): MemberData[] {
  return members.filter(member => {
    const status = calculateMemberStatus(member)
    
    switch (filterStatus) {
      case 'all':
        // Show all non-deleted members, or all if showDeleted is true
        return status.displayStatus !== 'DELETED' || showDeleted
        
      case 'active':  
        return status.displayStatus === 'ACTIVE'
        
      case 'expired':
        // Show members who are truly expired (their display status is EXPIRED)
        return status.displayStatus === 'EXPIRED' && !Boolean(member.deletedAt)
        
      case 'expiring':
        // Show members who are expiring (their display status is EXPIRING)
        return status.displayStatus === 'EXPIRING' && !Boolean(member.deletedAt)
        
      case 'cancelled':
        return status.displayStatus === 'CANCELLED'
        
      case 'no_subscription':
        return status.displayStatus === 'NO_SUBSCRIPTION'
        
      case 'deleted':
        return status.displayStatus === 'DELETED'
        
      default:
        return true
    }
  })
}

/**
 * Check if a member should be considered for expiring members count
 * This matches the backend logic that includes BOTH expiring AND recently expired members
 */
export function isMemberConsideredExpiring(member: MemberData, daysBefore: number = 7): boolean {
  // Must have active account and not be deleted
  if (!member.isActive || member.deletedAt) {
    return false
  }
  
  // Must have active subscription that is not cancelled - use same logic as calculateMemberStatus
  const subscriptions = [...(member.customerSubscriptions || [])]
    .sort((a, b) => {
      // First sort by creation date if available (most recent first)
      const aCreated = new Date(a.createdAt || a.startDate).getTime()
      const bCreated = new Date(b.createdAt || b.startDate).getTime()
      if (aCreated !== bCreated) {
        return bCreated - aCreated
      }
      // Then by end date (latest first)
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    })
  const subscription = subscriptions[0]
  if (!subscription || subscription.status !== 'ACTIVE' || subscription.cancelledAt) {
    return false
  }
  
  // Must be expiring within the specified days (INCLUDING recently expired)
  // Use the same date handling as backend - NO normalization to start of day
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysBefore)
  
  const endDate = new Date(subscription.endDate)
  
  // Backend logic: endDate <= targetDate (includes recently expired members)
  // This includes members whose subscriptions expired recently but are still within the notification window
  return endDate <= targetDate
}

/**
 * Get count of truly expiring members using same logic as backend
 */
export function getExpiringMembersCount(members: MemberData[], daysBefore: number = 7): number {
  const expiringMembers = members.filter(member => isMemberConsideredExpiring(member, daysBefore))
  
  // Frontend and backend logic now consistent
  
  return expiringMembers.length
}

/**
 * Calculate member statistics from a list of members
 * UNIFIED LOGIC - Uses the same filtering logic as the filter functions
 */
export function calculateMemberStats(members: MemberData[]) {
  // Use the same filtering logic to ensure consistency
  const activeMembers = filterMembersByStatus(members, 'active')
  const expiredMembers = filterMembersByStatus(members, 'expired')
  const expiringMembers = filterMembersByStatus(members, 'expiring')
  const cancelledMembers = filterMembersByStatus(members, 'cancelled')
  const deletedMembers = filterMembersByStatus(members, 'deleted')
  const noSubscriptionMembers = filterMembersByStatus(members, 'no_subscription')
  
  return {
    total: members.length,
    active: activeMembers.length,
    expired: expiredMembers.length,
    expiring: expiringMembers.length,
    cancelled: cancelledMembers.length,
    deleted: deletedMembers.length,
    noSubscription: noSubscriptionMembers.length,
    // Deprecated - use expiring instead
    trulyExpiring: expiringMembers.length
  }
}
