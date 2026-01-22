import { type MemberData } from './member-status'

export interface StatusDisplay {
  label: string
  color: 'green' | 'orange' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple'
  description: string
  icon: string
  buttonVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}

export interface ActionDisplay {
  label: string
  action: string
  permission: string
  description: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: string
}

/**
 * Get user-friendly display information for member status
 */
export const getMemberStatusDisplay = (status: string): StatusDisplay => {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Active Member',
        color: 'green',
        description: 'Full access to facilities and services',
        icon: '✅',
        buttonVariant: 'default'
      }
    
    case 'CANCELLED':
      return {
        label: 'Membership Suspended',
        color: 'orange', 
        description: 'Can be reactivated by staff',
        icon: '⏸️',
        buttonVariant: 'outline'
      }
    
    case 'DELETED':
      return {
        label: 'Account Archived',
        color: 'red',
        description: 'Requires manager approval to restore',
        icon: '🗃️',
        buttonVariant: 'destructive'
      }
    
    case 'EXPIRED':
      return {
        label: 'Membership Expired',
        color: 'red',
        description: 'Needs renewal to continue access',
        icon: '⏰',
        buttonVariant: 'secondary'
      }
    
    case 'EXPIRING':
    case 'EXPIRING_SOON':
      return {
        label: 'Expiring Soon',
        color: 'yellow',
        description: 'Membership ending within 7 days',
        icon: '⚠️',
        buttonVariant: 'outline'
      }
      
      
    case 'SUSPENDED':
      return {
        label: 'Account Suspended',
        color: 'gray',
        description: 'Account temporarily disabled',
        icon: '💤',
        buttonVariant: 'secondary'
      }
      
    case 'PENDING_CARD':
      return {
        label: 'Assign Card',
        color: 'purple',
        description: 'Member needs RFID card assigned',
        icon: '💳',
        buttonVariant: 'default'
      }

    case 'NO_SUBSCRIPTION':
      return {
        label: 'Assign Membership Plan',
        color: 'blue',
        description: 'Member needs a membership plan assigned',
        icon: '📋',
        buttonVariant: 'default'
      }
    
    default:
      // For any unknown status, treat as no subscription
      return {
        label: 'No Membership',
        color: 'gray',
        description: 'Account needs attention',
        icon: '❓',
        buttonVariant: 'secondary'
      }
  }
}

/**
 * Get available actions for a member based on their current status and user role
 */
export const getAvailableActions = (
  memberStatus: string, 
  userRole: string, 
  canManage: boolean = true
): ActionDisplay[] => {
  if (!canManage) {
    return [{
      label: 'View Only',
      action: 'view',
      permission: 'VIEW',
      description: 'You can only view this member (different branch access)',
      variant: 'outline',
      icon: '👁️'
    }]
  }

  const actions: ActionDisplay[] = []

  switch (memberStatus) {
    case 'PENDING_CARD':
    case 'CARD_REQUIRED':
      actions.push({
        label: 'Assign Card',
        action: 'assign_card',
        permission: 'STAFF+',
        description: 'Assign RFID card to this member',
        variant: 'default',
        icon: '💳'
      })
      break

    case 'ACTIVE':
      actions.push({
        label: 'Suspend Membership',
        action: 'cancel',
        permission: 'STAFF+',
        description: 'End membership but keep member data',
        variant: 'outline',
        icon: '⏸️'
      })
      if (['OWNER', 'MANAGER'].includes(userRole)) {
        actions.push({
          label: 'Archive Account',
          action: 'delete',
          permission: 'MANAGER+',
          description: 'Completely remove member from active system',
          variant: 'destructive',
          icon: '🗃️'
        })
      }
      break

    case 'CANCELLED':
    case 'SUSPENDED':
      actions.push({
        label: 'Reactivate Membership',
        action: 'restore',
        permission: 'STAFF+',
        description: 'Restore member access and billing',
        variant: 'default',
        icon: '▶️'
      })
      if (['OWNER', 'MANAGER'].includes(userRole)) {
        actions.push({
          label: 'Archive Account',
          action: 'delete',
          permission: 'MANAGER+',
          description: 'Move to archived status',
          variant: 'destructive',
          icon: '🗃️'
        })
      }
      break

    case 'EXPIRED':
      actions.push({
        label: 'Renew Membership',
        action: 'renew',
        permission: 'STAFF+',
        description: 'Start new membership with selected plan',
        variant: 'default',
        icon: '🔄'
      })
      actions.push({
        label: 'Reactivate Existing',
        action: 'restore',
        permission: 'STAFF+',
        description: 'Reactivate without changing plan',
        variant: 'outline',
        icon: '▶️'
      })
      break

    case 'DELETED':
      if (['OWNER', 'MANAGER'].includes(userRole)) {
        actions.push({
          label: 'Restore Account',
          action: 'restore',
          permission: 'MANAGER+',
          description: 'Bring member back from archived status',
          variant: 'default',
          icon: '📤'
        })
      }
      break

    case 'EXPIRING':
    case 'EXPIRING_SOON':
      actions.push({
        label: 'Renew Now',
        action: 'renew',
        permission: 'STAFF+',
        description: 'Extend membership before expiration',
        variant: 'default',
        icon: '🔄'
      })
      actions.push({
        label: 'Suspend Membership',
        action: 'cancel',
        permission: 'STAFF+',
        description: 'End membership early',
        variant: 'outline',
        icon: '⏸️'
      })
      break

    case 'NO_SUBSCRIPTION':
      actions.push({
        label: 'Assign Membership Plan',
        action: 'assign_plan',
        permission: 'STAFF+',
        description: 'Assign a membership plan to this member',
        variant: 'default',
        icon: '📋'
      })
      break

    default:
      actions.push({
        label: 'Activate',
        action: 'restore',
        permission: 'STAFF+',
        description: 'Activate member access',
        variant: 'default',
        icon: '▶️'
      })
  }

  return actions
}

/**
 * Get help text for different actions
 */
export const getActionHelpText = (action: string): string => {
  const helpTexts: { [key: string]: string } = {
    'cancel': 'Suspends membership and stops billing, but keeps all member data. Member can be reactivated later.',
    'delete': 'Archives the member account completely. This removes them from active members list but keeps data for compliance. Requires manager approval to restore.',
    'restore': 'Reactivates the member account and restores access. For suspended members, this resumes their membership. For archived members, this brings them back to active status.',
    'renew': 'Creates a new membership period with the selected plan. Previous membership history is preserved.',
    'view': 'You can only view this member\'s information because they belong to a different branch than your access permissions allow.'
  }
  
  return helpTexts[action] || 'Perform this action on the member account.'
}

/**
 * Get CSS classes for status colors
 */
export const getStatusColorClasses = (color: StatusDisplay['color']) => {
  const colorClasses = {
    green: {
      bg: 'bg-green-500 hover:bg-green-600',
      text: 'text-green-600',
      badge: 'bg-green-100 text-green-800 border-green-300',
      icon: 'text-green-600'
    },
    orange: {
      bg: 'bg-orange-500 hover:bg-orange-600', 
      text: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: 'text-orange-600'
    },
    red: {
      bg: 'bg-red-500 hover:bg-red-600',
      text: 'text-red-600', 
      badge: 'bg-red-100 text-red-800 border-red-300',
      icon: 'text-red-600'
    },
    yellow: {
      bg: 'bg-yellow-500 hover:bg-yellow-600',
      text: 'text-yellow-600',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
      icon: 'text-yellow-600'
    },
    blue: {
      bg: 'bg-blue-500 hover:bg-blue-600',
      text: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: 'text-blue-600'
    },
    gray: {
      bg: 'bg-gray-500 hover:bg-gray-600',
      text: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: 'text-gray-600'
    },
    purple: {
      bg: 'bg-purple-500 hover:bg-purple-600',
      text: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: 'text-purple-600'
    }
  }
  
  return colorClasses[color]
}
