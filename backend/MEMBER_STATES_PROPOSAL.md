# Member States - Improved UX Proposal

## Current System (Keep Architecture, Improve UX)

### 1. Rename in Frontend UI:
- `CANCELLED` → **"Subscription Ended"** or **"Inactive Membership"**  
- `DELETED` → **"Account Removed"** or **"Archived Member"**

### 2. Clear Action Labels:
- `Cancel Member` → **"End Membership"** / **"Suspend Member"**
- `Delete Member` → **"Remove Account"** / **"Archive Member"**
- `Restore Member` → **"Reactivate"** (smart - handles both)

### 3. Member Status Display:
```typescript
// Instead of showing raw status, show user-friendly labels:
const getStatusDisplay = (member) => {
  switch(member.status) {
    case 'CANCELLED': 
      return {
        label: 'Membership Ended',
        color: 'orange',
        description: 'Can be reactivated',
        icon: 'pause'
      }
    case 'DELETED':
      return {
        label: 'Account Archived', 
        color: 'red',
        description: 'Requires admin approval to restore',
        icon: 'archive'
      }
    case 'ACTIVE':
      return {
        label: 'Active Member',
        color: 'green', 
        description: 'Full access to facilities',
        icon: 'check'
      }
  }
}
```

### 4. Contextual Actions:
```typescript
// Show different actions based on member state and user role:
const getAvailableActions = (member, userRole) => {
  if (member.status === 'ACTIVE') {
    return [
      { label: 'End Membership', action: 'cancel', permission: 'STAFF+' },
      { label: 'Archive Account', action: 'delete', permission: 'MANAGER+' }
    ]
  }
  
  if (member.status === 'CANCELLED') {
    return [
      { label: 'Reactivate Membership', action: 'restore', permission: 'STAFF+' },
      { label: 'Archive Account', action: 'delete', permission: 'MANAGER+' }
    ]
  }
  
  if (member.status === 'DELETED') {
    return [
      { label: 'Restore Account', action: 'restore', permission: 'MANAGER+' }
    ]
  }
}
```

### 5. Help Text & Tooltips:
```typescript
const statusHelpText = {
  'End Membership': 'Stops billing but keeps member data. Member can reactivate.',
  'Archive Account': 'Completely removes member from active system. Requires manager approval to restore.',
  'Reactivate': 'Restores member access and billing (if applicable).'
}
```

## Alternative: Simplified Single-State System

If you prefer simpler terminology, we could consolidate:

### Option A: Only "Active" vs "Inactive"
- Remove "cancelled" concept entirely  
- Use `isActive: boolean` + `inactiveReason: string`
- Simpler but loses business context

### Option B: "Active", "Suspended", "Archived" 
- `ACTIVE` = Current active member
- `SUSPENDED` = Temporarily inactive (replaces cancelled)  
- `ARCHIVED` = Permanently removed (replaces deleted)

## Recommendation: Keep Current System + Improve UX

The current system is architecturally sound. The confusion comes from:
1. **Poor labeling** ("cancelled" sounds final but isn't)
2. **Lack of context** (what's the difference?)
3. **No help text** (when to use which?)

**Solution**: Keep the robust backend logic, improve the frontend presentation.
