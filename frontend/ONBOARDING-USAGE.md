# Onboarding Flow - Usage Guide

This document explains how to use the onboarding flow components in your application.

## Overview

The onboarding flow guides new tenant owners through the initial setup process:

1. **Set Password** - Change from temporary password to a secure password
2. **Customize Branch** - Add details to the auto-created "Main Branch"
3. **Create Membership Plan** - Set up at least one pricing plan
4. **Add First Member** (Optional) - Start building the member database

## Architecture

### Components

All onboarding modal components are located in `/components/modals/onboarding/`:

- **SetPasswordModal** - Non-dismissible modal for initial password setup
- **CustomizeBranchModal** - Modal to customize the Main Branch details
- **CreateMembershipPlanModal** - Modal to create the first membership plan
- **AddFirstMemberModal** - Optional modal to add the first member (with skip option)

### Other Components

- **OnboardingProgress** (`/components/onboarding-progress.tsx`) - Visual progress indicator
- **OnboardingWrapper** (`/components/onboarding-wrapper.tsx`) - Main orchestration component

### API & Hooks

- **API**: `/lib/api/onboarding.ts` - API methods for onboarding status
- **Hook**: `/lib/hooks/use-onboarding.ts` - React hooks for managing onboarding state

## Integration

### Quick Start

Wrap your main layout with the `OnboardingWrapper` component:

```tsx
import OnboardingWrapper from '@/components/onboarding-wrapper'

export default function Layout({ children }: { children: React.ReactNode }) {
  const user = useUser() // Your user hook

  return (
    <OnboardingWrapper tenantId={user?.tenantId}>
      {children}
    </OnboardingWrapper>
  )
}
```

That's it! The wrapper will:
- Check onboarding status automatically
- Show the appropriate modals in sequence
- Prevent access to the main app until onboarding is complete
- Display a progress indicator

### Advanced Usage

If you need more control, you can use the hook directly:

```tsx
import { useOnboardingFlow } from '@/lib/hooks/use-onboarding'
import SetPasswordModal from '@/components/modals/onboarding/set-password-modal'
// ... other imports

export default function MyCustomOnboarding() {
  const { tenantId } = useCurrentUser()
  
  const {
    status,
    isLoading,
    isOnboardingComplete,
    showPasswordModal,
    showBranchModal,
    showPlanModal,
    showMemberModal,
    mainBranch,
    handlePasswordSet,
    handleBranchCustomized,
    handlePlanCreated,
    handleMemberAdded,
    handleSkipMember,
  } = useOnboardingFlow(tenantId)

  if (isOnboardingComplete) {
    return <YourMainApp />
  }

  return (
    <div>
      {/* Your custom UI */}
      
      <SetPasswordModal
        open={showPasswordModal}
        onPasswordSet={handlePasswordSet}
      />
      
      {/* ... other modals */}
    </div>
  )
}
```

## API Reference

### Onboarding API

Located at `/lib/api/onboarding.ts`:

```typescript
// Get onboarding status
const status = await onboardingApi.getStatus(tenantId)

// Mark password as changed
await onboardingApi.markPasswordChanged(tenantId)

// Mark onboarding as complete
await onboardingApi.completeOnboarding(tenantId)
```

### Hooks

#### `useOnboardingStatus(tenantId)`

Fetches and caches the onboarding status for a tenant.

```typescript
const { data: status, isLoading, refetch } = useOnboardingStatus(tenantId)
```

Returns:
```typescript
{
  tenantId: string
  tenantName: string
  isOnboardingComplete: boolean
  hasChangedPassword: boolean
  hasMembershipPlans: boolean
  hasMembers: boolean
  onboardingCompletedAt: string | null
  nextSteps: string[]
}
```

#### `useOnboardingFlow(tenantId)`

Main orchestration hook that manages the entire flow.

```typescript
const {
  status,              // OnboardingStatus
  isLoading,           // boolean
  isOnboardingComplete, // boolean
  
  // Modal visibility states
  showPasswordModal,
  showBranchModal,
  showPlanModal,
  showMemberModal,
  
  // Data
  mainBranch,          // Branch object
  
  // Handlers
  handlePasswordSet,
  handleBranchCustomized,
  handlePlanCreated,
  handleMemberAdded,
  handleSkipMember,
  
  // Utils
  refetchStatus,
} = useOnboardingFlow(tenantId)
```

## Modal Props

### SetPasswordModal

```typescript
interface SetPasswordModalProps {
  open: boolean
  onPasswordSet: (tempPassword: string, newPassword: string) => Promise<void>
  isLoading?: boolean
}
```

### CustomizeBranchModal

```typescript
interface CustomizeBranchModalProps {
  open: boolean
  branch: Branch | null
  onBranchCustomized: (data: {
    name: string
    address: string
    phoneNumber?: string
    email?: string
  }) => Promise<void>
  isLoading?: boolean
}
```

### CreateMembershipPlanModal

```typescript
interface CreateMembershipPlanModalProps {
  open: boolean
  onPlanCreated: (data: {
    name: string
    description?: string
    price: number
    duration: number
    type: string
    accessLevel: string
  }) => Promise<void>
  isLoading?: boolean
}
```

### AddFirstMemberModal

```typescript
interface AddFirstMemberModalProps {
  open: boolean
  onMemberAdded: (data: {
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string
    gender?: string
  }) => Promise<void>
  onSkip: () => void
  isLoading?: boolean
}
```

## Customization

### Styling

All components use Tailwind CSS and shadcn/ui components. You can customize:

1. **Colors**: Edit the color classes in each modal (e.g., `bg-blue-600` to `bg-purple-600`)
2. **Progress Indicator**: Modify `/components/onboarding-progress.tsx`
3. **Layout**: Adjust the wrapper layout in `/components/onboarding-wrapper.tsx`

### Flow Sequence

To change the onboarding flow sequence, modify the logic in `useOnboardingFlow` hook:

```typescript
// In /lib/hooks/use-onboarding.ts
useEffect(() => {
  if (!status || isLoading) return
  
  // Customize this logic to change the flow
  if (!status.hasChangedPassword) {
    setShowPasswordModal(true)
  } else if (!status.hasMembershipPlans) {
    setShowBranchModal(true)
  }
  // ...
}, [status, isLoading])
```

### Adding New Steps

1. Create a new modal component in `/components/modals/onboarding/`
2. Add a new status field to backend onboarding status
3. Update `useOnboardingFlow` to include the new step
4. Update `OnboardingProgress` steps configuration

## Backend Integration

The onboarding flow relies on these backend endpoints:

- `GET /tenants/:id/onboarding-status` - Get onboarding progress
- `POST /tenants/:id/mark-password-changed` - Mark password setup complete
- `POST /tenants/:id/complete-onboarding` - Mark entire onboarding complete

See `/backend/src/core/tenants/tenants.service.ts` for implementation details.

## Testing

Test the onboarding flow:

1. Create a new tenant via Super Admin
2. Log in with the temporary password
3. Verify each modal appears in sequence
4. Check that modals are non-dismissible (can't click outside or press Escape)
5. Complete all steps and verify main app access

## Troubleshooting

### Modals not appearing

- Check that `tenantId` is properly passed to the wrapper
- Verify onboarding status API is returning correct data
- Check browser console for errors

### Can't complete a step

- Verify the API endpoints are accessible
- Check network tab for failed requests
- Ensure proper authentication headers are sent

### Stuck on a step

- Use `refetchStatus()` to manually refresh onboarding status
- Check backend database to see actual onboarding status
- Clear localStorage and retry if necessary

## Future Enhancements

Potential improvements for the onboarding flow:

1. **Email verification step** - Verify email before password setup
2. **Profile customization** - Allow owners to set profile picture and bio
3. **Tour/walkthrough** - Add interactive tour after onboarding
4. **Skip options** - Allow skipping certain non-critical steps
5. **Progress persistence** - Save partial progress in case of browser close
6. **Multi-language support** - Localize onboarding for different languages

## Support

For questions or issues with the onboarding flow, please refer to:

- Main documentation: `/AGENT.md`
- Implementation details: `/conversations/ONBOARDING-FLOW-IMPLEMENTATION.md`
- Backend code: `/backend/src/core/tenants/tenants.service.ts`
