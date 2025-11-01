# Plan Change Implementation Suggestions

## Overview
Based on system analysis, here's the recommended implementation for adding plan change functionality to the member management system.

## Current State Analysis
- System supports plan changes via renew endpoint (`POST /api/v1/gym/subscriptions/{memberId}/renew`)
- Frontend only exposes renewal for expired memberships
- No direct "Change Plan" option for active members
- Backend can handle plan updates but needs frontend integration

## Recommended Implementation

### 1. Frontend Changes

#### Add "Change Plan" Button
Add to member card actions for active members:

```typescript
// In MemberCard component
{canManageMember(member) && member.gymSubscriptions?.[0]?.status === 'ACTIVE' && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => onChangePlan(member)}
    className="text-blue-600 hover:text-blue-700"
  >
    <Settings className="w-4 h-4 mr-2" />
    Change Plan
  </Button>
)}
```

#### Change Plan Modal
Create modal similar to renewal modal:

```typescript
interface ChangePlanModalProps {
  isOpen: boolean
  onClose: () => void
  member: User
  onPlanChanged: () => void
}
```

Key features:
- Display current plan details
- Plan selection dropdown
- Payment amount input (defaults to new plan price)
- Immediate change confirmation
- Transaction creation

### 2. Backend Changes

#### Extend Gym Subscriptions Service
Add `changePlan` method to `gym-subscriptions.service.ts`:

```typescript
async changePlan(
  memberId: string, 
  newPlanId: string, 
  paymentAmount: number,
  paymentMethod: string,
  tenantId: string
) {
  // 1. Validate active subscription exists
  // 2. Get new plan details
  // 3. Update subscription with new plan
  // 4. Create transaction record
  // 5. Log audit trail
  // 6. Return updated subscription
}
```

#### API Endpoint
Add `POST /api/v1/gym/subscriptions/{memberId}/change-plan` endpoint:

```typescript
@Post(':memberId/change-plan')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'MANAGER', 'STAFF')
async changePlan(
  @Param('memberId') memberId: string,
  @Body() data: ChangePlanDto,
  @Req() req: Request
) {
  return this.gymSubscriptionsService.changePlan(
    memberId, 
    data.gymMembershipPlanId,
    data.paymentAmount,
    data.paymentMethod,
    req.user.tenantId
  );
}
```

### 3. Billing Approach

#### Straightforward Implementation (Recommended)
- **No prorated calculations** - Keep it simple
- Change plan immediately upon request
- Charge full new plan price
- Add transaction to revenue
- Update subscription end date based on new plan duration from change date

#### Transaction Creation
```typescript
const transaction = await this.prisma.customerTransaction.create({
  data: {
    tenantId,
    customerId: memberId,
    gymMemberSubscriptionId: subscription.id,
    amount: paymentAmount,
    paymentMethod,
    transactionType: 'PAYMENT',
    description: `Plan changed to ${newPlan.name}`,
    relatedEntityType: 'membership_plan_change',
    relatedEntityId: subscription.id
  }
});
```

### 4. Database Updates

#### Subscription Update
```typescript
// Update subscription with new plan
await this.prisma.gymMemberSubscription.update({
  where: { id: subscription.id },
  data: {
    gymMembershipPlanId: newPlanId,
    price: newPlan.price,
    endDate: calculateNewEndDate(changeDate, newPlan.duration),
    updatedAt: new Date()
  }
});
```

### 5. UI/UX Considerations

#### Modal Design
- Current plan display (name, price, end date)
- New plan selector with pricing
- Payment amount field (editable)
- Payment method selector
- Confirmation with clear warnings
- Success/error feedback

#### Member Card Updates
- Show current plan name prominently
- Quick access to change plan action
- Status indicators for recent changes

### 6. Testing Scenarios

#### Happy Path
1. Active member selects change plan
2. Chooses new plan, enters payment
3. System updates subscription
4. Creates transaction record
5. Shows success message

#### Edge Cases
- Invalid plan selection
- Payment amount validation
- Subscription status checks
- Permission validation

### 7. Security & Validation

#### Guards
- JWT authentication required
- Role-based access (OWNER, MANAGER, STAFF)
- Tenant isolation

#### Business Logic Validation
- Member must have active subscription
- New plan must exist and be active
- Payment amount must be valid
- Prevent overlapping changes

### 8. Audit & Logging

#### Audit Trail
Log all plan changes with:
- Who performed the change
- Old plan details
- New plan details
- Payment information
- Timestamp

#### Transaction History
All plan changes appear in member transaction history for accounting purposes.

## Implementation Priority

1. **High Priority**: Backend API endpoint and service method
2. **High Priority**: Frontend modal and button integration  
3. **Medium Priority**: Enhanced validation and error handling
4. **Low Priority**: Advanced features (prorated billing, scheduled changes)

## Files to Modify

### Backend
- `src/modules/gym/subscriptions/gym-subscriptions.service.ts`
- `src/modules/gym/subscriptions/gym-subscriptions.controller.ts`
- `src/modules/gym/subscriptions/dto/change-plan.dto.ts` (new)

### Frontend
- `components/members/member-card.tsx`
- `app/(main)/members/page.tsx`
- `components/modals/change-plan-modal.tsx` (new)
- `lib/hooks/use-change-plan.ts` (new)
- `lib/api/gym-subscriptions.ts`

This implementation provides a clean, straightforward way to change member plans while maintaining proper revenue tracking and audit trails.