// Member Status Utility - Separates User and Subscription Status Concerns
// This is a quick fix to resolve filtering issues while maintaining existing APIs

export interface MemberEffectiveStatus {
  canAccessFacilities: boolean
  displayStatus: 'ACTIVE' | 'EXPIRED' | 'EXPIRING' | 'CANCELLED' | 'SUSPENDED' | 'INACTIVE' | 'DELETED'
  primaryIssue?: string
  statusColor: 'green' | 'orange' | 'yellow' | 'red' | 'gray' | 'blue'
  statusIcon: 'check' | 'clock' | 'x' | 'alert' | 'info' | 'trash'
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

  // Get the most recent subscription
  const subscription = member.customerSubscriptions?.[0]
  const businessMembership = member.businessData?.membership
  
  // If no subscription data available, check account status
  if (!subscription && !businessMembership) {
    if (member.isActive) {
      return {
        canAccessFacilities: false,
        displayStatus: 'INACTIVE',
        primaryIssue: 'No subscription',
        statusColor: 'gray',
        statusIcon: 'info'
      }
    } else {
      return {
        canAccessFacilities: false,
        displayStatus: 'INACTIVE',
        primaryIssue: 'Account inactive',
        statusColor: 'gray',
        statusIcon: 'info'
      }
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
    return {
      canAccessFacilities: false,
      displayStatus: 'CANCELLED',
      primaryIssue: 'Subscription cancelled',
      statusColor: 'red',
      statusIcon: 'x'
    }
  }

  // Check account-level status before checking subscription expiry
  if (!member.isActive) {
    return {
      canAccessFacilities: false,
      displayStatus: 'INACTIVE',
      primaryIssue: 'Account inactive',
      statusColor: 'gray',
      statusIcon: 'info'
    }
  }

  // Only show as expired if user is active and subscription is active but expired
  if (isExpired && subscriptionStatus === 'ACTIVE') {
    const daysOverdue = subscriptionEndDate 
      ? Math.ceil((currentDate.getTime() - subscriptionEndDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    return {
      canAccessFacilities: false,
      displayStatus: 'EXPIRED',
      primaryIssue: daysOverdue > 0 ? `Expired ${daysOverdue} days ago` : 'Subscription expired',
      statusColor: 'orange',
      statusIcon: 'clock'
    }
  }
  
  // Check if subscription is expiring soon (but still active)
  if (isExpiringSoon && !isExpired && subscriptionStatus === 'ACTIVE') {
    const daysRemaining = subscriptionEndDate 
      ? Math.ceil((subscriptionEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0
      
    return {
      canAccessFacilities: true,
      displayStatus: 'EXPIRING',
      primaryIssue: `Expires in ${daysRemaining} days`,
      statusColor: 'yellow',
      statusIcon: 'alert'
    }
  }

  if (subscriptionStatus === 'ACTIVE' && subscriptionEndDate && subscriptionEndDate >= currentDate) {
    const daysRemaining = Math.ceil((subscriptionEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      canAccessFacilities: true,
      displayStatus: 'ACTIVE',
      primaryIssue: daysRemaining <= 7 ? `Expires in ${daysRemaining} days` : undefined,
      statusColor: 'green',
      statusIcon: 'check'
    }
  }

  // Default case - active account but unknown subscription status
  return {
    canAccessFacilities: false,
    displayStatus: 'INACTIVE',
    primaryIssue: 'Subscription status unknown',
    statusColor: 'gray',
    statusIcon: 'info'
  }
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
      
    case 'INACTIVE':
      if (member.customerSubscriptions?.length || member.businessData?.membership) {
        actions.push('renew-subscription')
      } else {
        actions.push('create-subscription')
      }
      break
  }

  return actions
}

/**
 * Helper function for filtering members by status
 */
export function filterMembersByStatus(
  members: MemberData[], 
  filterStatus: 'all' | 'active' | 'expired' | 'expiring' | 'cancelled' | 'deleted' | 'inactive',
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
        // Only show expired members who are not deleted
        return status.displayStatus === 'EXPIRED' && !Boolean(member.deletedAt)
        
      case 'expiring':
        // Show members expiring soon (active but expiring within 7 days)
        return status.displayStatus === 'EXPIRING' && !Boolean(member.deletedAt)
        
      case 'cancelled':
        return status.displayStatus === 'CANCELLED'
        
      case 'inactive':
        return status.displayStatus === 'INACTIVE'
        
      case 'deleted':
        return status.displayStatus === 'DELETED'
        
      default:
        return true
    }
  })
}

/**
 * Check if a member should be considered for expiring members count
 * This matches the backend logic that only includes ACTIVE subscriptions
 */
export function isMemberConsideredExpiring(member: MemberData, daysBefore: number = 7): boolean {
  // Must have active account and not be deleted
  if (!member.isActive || member.deletedAt) {
    return false
  }
  
  // Must have active subscription that is not cancelled
  const subscription = member.customerSubscriptions?.[0]
  if (!subscription || subscription.status !== 'ACTIVE' || subscription.cancelledAt) {
    return false
  }
  
  // Must be expiring within the specified days (but not expired)
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  const targetDate = new Date(currentDate)
  targetDate.setDate(targetDate.getDate() + daysBefore)
  
  const endDate = new Date(subscription.endDate)
  endDate.setHours(0, 0, 0, 0)
  
  // Should be expiring within the time window but NOT already expired
  return endDate > currentDate && endDate <= targetDate
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
 */
export function calculateMemberStats(members: MemberData[]) {
  // Debug logging removed - issue resolved with backend API fix
  
  return members.reduce((acc, member) => {
    const status = calculateMemberStatus(member)
    
    acc.total++
    
    switch (status.displayStatus) {
      case 'ACTIVE':
        acc.active++
        break
      case 'EXPIRED':
        // Only count expired members who are not deleted
        if (!Boolean(member.deletedAt)) {
          acc.expired++
        }
        break
      case 'EXPIRING':
        // Count expiring members separately
        if (!Boolean(member.deletedAt)) {
          acc.expiring++
        }
        break
      case 'CANCELLED':
        acc.cancelled++
        break
      case 'DELETED':
        acc.deleted++
        break
      case 'INACTIVE':
        acc.inactive++
        break
    }
    
    return acc
  }, {
    total: 0,
    active: 0,
    expired: 0,
    expiring: 0,
    cancelled: 0,
    deleted: 0,
    inactive: 0,
    // Add expiring count that matches backend logic
    trulyExpiring: getExpiringMembersCount(members, 7)
  })
}
