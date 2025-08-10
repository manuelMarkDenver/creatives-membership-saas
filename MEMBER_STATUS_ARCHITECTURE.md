# Member Status Architecture - Separation of Concerns

## Problem Statement

The current system conflates **user status** (account-level) with **subscription status** (membership-level), leading to:
- Inconsistent filtering logic in the frontend
- Confusion about what "cancelling a member" means
- Mixed data states (inactive users with active subscriptions)
- Complex business logic that's hard to maintain

## Proposed Solution: Separate User & Subscription Status

### 1. User Status (Account Level)
Controls whether a user account exists and can be accessed:

```typescript
enum UserStatus {
  ACTIVE = 'ACTIVE',           // Account is active, user can log in
  INACTIVE = 'INACTIVE',       // Account temporarily disabled by admin
  SUSPENDED = 'SUSPENDED',     // Account suspended for violations  
  DELETED = 'DELETED'          // Account soft-deleted
}
```

**User Actions:**
- `activateUser()` - Reactivate an inactive/suspended account
- `suspendUser()` - Suspend account for violations
- `deleteUser()` - Soft-delete the account
- `restoreUser()` - Restore a deleted account

### 2. Subscription Status (Membership Level)
Controls membership access to gym facilities:

```typescript
enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',           // Valid subscription, access granted
  EXPIRED = 'EXPIRED',         // Subscription past end date
  CANCELLED = 'CANCELLED',     // Manually cancelled subscription
  SUSPENDED = 'SUSPENDED',     // Suspended for non-payment
  PENDING = 'PENDING'          // Payment pending
}
```

**Subscription Actions:**
- `renewSubscription()` - Create new active subscription
- `cancelSubscription()` - Cancel current subscription  
- `suspendSubscription()` - Suspend for non-payment
- `reactivateSubscription()` - Reactivate suspended subscription

## Member State Calculation

A member's **effective status** is calculated from both:

```typescript
interface MemberEffectiveStatus {
  canAccessFacilities: boolean
  displayStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'INACTIVE' | 'DELETED'
  primaryIssue?: string
}

function calculateMemberStatus(user: User, subscription?: Subscription): MemberEffectiveStatus {
  // Account-level blocks override everything
  if (user.status === 'DELETED') {
    return { canAccessFacilities: false, displayStatus: 'DELETED' }
  }
  
  if (user.status === 'SUSPENDED') {
    return { canAccessFacilities: false, displayStatus: 'SUSPENDED', primaryIssue: 'Account suspended' }
  }
  
  if (user.status === 'INACTIVE') {
    return { canAccessFacilities: false, displayStatus: 'INACTIVE', primaryIssue: 'Account inactive' }
  }
  
  // If account is active, check subscription
  if (!subscription) {
    return { canAccessFacilities: false, displayStatus: 'INACTIVE', primaryIssue: 'No subscription' }
  }
  
  // Check subscription status
  switch (subscription.status) {
    case 'ACTIVE':
      if (subscription.endDate < new Date()) {
        return { canAccessFacilities: false, displayStatus: 'EXPIRED', primaryIssue: 'Subscription expired' }
      }
      return { canAccessFacilities: true, displayStatus: 'ACTIVE' }
      
    case 'EXPIRED':
      return { canAccessFacilities: false, displayStatus: 'EXPIRED', primaryIssue: 'Subscription expired' }
      
    case 'CANCELLED':
      return { canAccessFacilities: false, displayStatus: 'CANCELLED', primaryIssue: 'Subscription cancelled' }
      
    case 'SUSPENDED':
      return { canAccessFacilities: false, displayStatus: 'SUSPENDED', primaryIssue: 'Subscription suspended' }
      
    default:
      return { canAccessFacilities: false, displayStatus: 'INACTIVE', primaryIssue: 'Unknown status' }
  }
}
```

## API Endpoints Restructure

### User Management Endpoints
```
POST /api/v1/users/:id/activate    # Reactivate user account
POST /api/v1/users/:id/suspend     # Suspend user account  
POST /api/v1/users/:id/delete      # Soft-delete user account
POST /api/v1/users/:id/restore     # Restore deleted user account
```

### Subscription Management Endpoints  
```
POST /api/v1/subscriptions/:id/renew      # Create new subscription
POST /api/v1/subscriptions/:id/cancel     # Cancel subscription
POST /api/v1/subscriptions/:id/suspend    # Suspend subscription
POST /api/v1/subscriptions/:id/reactivate # Reactivate subscription
```

### Member Status Endpoint
```
GET /api/v1/members/:id/status    # Get combined member status
```

## Frontend Filtering Simplification

With this separation, filtering becomes much cleaner:

```typescript
const filterMembers = (members: Member[], filter: FilterType) => {
  return members.filter(member => {
    const status = calculateMemberStatus(member.user, member.subscription)
    
    switch (filter) {
      case 'all':
        return member.user.status !== 'DELETED' || showDeleted
      case 'active':  
        return status.displayStatus === 'ACTIVE'
      case 'expired':
        return status.displayStatus === 'EXPIRED'  
      case 'cancelled':
        return status.displayStatus === 'CANCELLED'
      case 'suspended':
        return status.displayStatus === 'SUSPENDED'
      case 'deleted':
        return member.user.status === 'DELETED'
      default:
        return true
    }
  })
}
```

## Member Actions Logic

Actions become contextual based on both statuses:

```typescript
const getAvailableActions = (member: Member) => {
  const status = calculateMemberStatus(member.user, member.subscription)
  const actions = []
  
  // Account-level actions
  if (member.user.status === 'DELETED') {
    actions.push('restore')
  } else if (member.user.status === 'SUSPENDED') {
    actions.push('unsuspend')  
  } else if (member.user.status === 'INACTIVE') {
    actions.push('activate')
  }
  
  // Subscription-level actions (only if account is active)
  if (member.user.status === 'ACTIVE') {
    if (!member.subscription) {
      actions.push('createSubscription')
    } else {
      switch (member.subscription.status) {
        case 'ACTIVE':
          actions.push('cancelSubscription')
          break
        case 'EXPIRED':  
          actions.push('renewSubscription')
          break
        case 'CANCELLED':
          actions.push('renewSubscription')
          break
        case 'SUSPENDED':
          actions.push('reactivateSubscription', 'renewSubscription')
          break
      }
    }
  }
  
  return actions
}
```

## Benefits

1. **Clear Separation**: User account management vs subscription management
2. **Simpler Logic**: Each concern has its own clear rules
3. **Better UX**: Users understand the difference between account issues vs subscription issues
4. **Maintainable**: Much easier to debug and extend
5. **Auditable**: Clear audit trails for each type of action
6. **Flexible**: Can have inactive users with active subscriptions (for admin purposes)

## Migration Strategy

1. **Phase 1**: Add new status calculation logic alongside existing
2. **Phase 2**: Update frontend to use calculated status for display
3. **Phase 3**: Update API endpoints to separate concerns
4. **Phase 4**: Clean up old mixed logic
5. **Phase 5**: Update database schema to enforce separation

## Immediate Fix for Current Issue

For the immediate filtering issue, we can implement the status calculation function and use it in the frontend filtering logic without changing the backend APIs yet.

Would you like me to implement this separation approach? It would resolve the current filtering inconsistencies and provide a much cleaner architecture going forward.
