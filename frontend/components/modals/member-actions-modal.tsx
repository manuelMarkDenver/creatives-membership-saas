'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Ban,
  Info,
  Calendar
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useMemberStatus, useActionReasons, useActivateMember, useCancelMember, useRestoreMember, useRenewMemberSubscription, useAssignMembershipPlan, useDisableCard, useEnableCard } from '@/lib/hooks/use-gym-member-actions'
import type { MemberActionRequest } from '@/lib/api/gym-members'
import { useActiveMembershipPlans } from '@/lib/hooks/use-membership-plans'
import { ReclaimPendingModal } from '@/components/modals/reclaim-pending-modal'

export type MemberActionType = 'activate' | 'cancel' | 'restore' | 'renew' | 'assign_plan' | 'disable_card' | 'enable_card'

interface MemberActionsModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  actionType: MemberActionType
  onActionComplete?: () => void
}

const actionConfig = {
  activate: {
    title: 'Activate Member',
    description: 'Activate this cancelled member to restore their access',
    icon: UserCheck,
    color: 'text-green-500',
    buttonText: 'Activate Member',
    buttonVariant: 'default' as const,
  },
  cancel: {
    title: 'Cancel Member',
    description: 'Cancel this active member\'s subscription',
    icon: UserX,
    color: 'text-red-500',
    buttonText: 'Cancel Member',
    buttonVariant: 'destructive' as const,
  },
  restore: {
    title: 'Restore Member',
    description: 'Restore this deleted member\'s account',
    icon: UserPlus,
    color: 'text-blue-500',
    buttonText: 'Restore Member',
    buttonVariant: 'default' as const,
  },
  renew: {
    title: 'Renew Membership',
    description: 'Renew this expired member\'s subscription',
    icon: RefreshCw,
    color: 'text-purple-500',
    buttonText: 'Renew Membership',
    buttonVariant: 'default' as const,
  },
  assign_plan: {
    title: 'Assign Membership Plan',
    description: 'Assign a membership plan to this member',
    icon: CreditCard,
    color: 'text-blue-500',
    buttonText: 'Assign Plan',
    buttonVariant: 'default' as const,
  },
  disable_card: {
    title: 'Disable Card',
    description: 'Disable this member\'s RFID card while keeping membership active',
    icon: Ban,
    color: 'text-red-500',
    buttonText: 'Disable Card',
    buttonVariant: 'destructive' as const,
  },
  enable_card: {
    title: 'Enable Card',
    description: 'Re-enable this member\'s disabled RFID card to restore access',
    icon: CreditCard,
    color: 'text-green-500',
    buttonText: 'Enable Card',
    buttonVariant: 'default' as const,
  },
}

const statusIcons = {
  ACTIVE: { icon: CheckCircle, color: 'text-green-500' },
  EXPIRED: { icon: Clock, color: 'text-orange-500' },
  CANCELLED: { icon: UserX, color: 'text-red-500' },
  DELETED: { icon: AlertTriangle, color: 'text-gray-500' },
  INACTIVE: { icon: Info, color: 'text-gray-400' },
}

// Function to format reason options for human readability
const formatReasonOption = (reason: string): string => {
  return reason
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function MemberActionsModal({
  isOpen,
  onClose,
  memberId,
  actionType,
  onActionComplete
}: MemberActionsModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedCardUid, setSelectedCardUid] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [cancelCardReturned, setCancelCardReturned] = useState(false)
  const [cancelReclaimInfo, setCancelReclaimInfo] = useState<{ gymId: string; memberName: string; expiresAt: string } | null>(null)
  const [showCancelReclaimModal, setShowCancelReclaimModal] = useState(false)
  
  const config = actionConfig[actionType]
  const IconComponent = config.icon

  // Fetch member data and action reasons
  const { data: memberData, isLoading: memberLoading } = useMemberStatus(memberId)
  const { data: actionReasons, isLoading: reasonsLoading } = useActionReasons()
  const { data: membershipPlans } = useActiveMembershipPlans()

  // For enable_card, fetch member's disabled cards
  const disabledCards = memberData?.cards?.filter((card: any) => !card.active) || []
  
  // Ensure membershipPlans is always an array
  const safeMembershipPlans = Array.isArray(membershipPlans) ? membershipPlans : []

  // Mutation hooks
  const activateMutation = useActivateMember()
  const cancelMutation = useCancelMember()
  const restoreMutation = useRestoreMember()
  const renewMutation = useRenewMemberSubscription()
  const assignPlanMutation = useAssignMembershipPlan()
  const disableCardMutation = useDisableCard()
  const enableCardMutation = useEnableCard()

  // Get relevant reasons for the current action
  const relevantReasons = Array.from(new Set(
    (actionReasons?.find((category: any) => {
      switch (actionType) {
        case 'activate':
          return category.category === 'ACCOUNT'
        case 'cancel':
          return category.category === 'SUBSCRIPTION'
        case 'restore':
          return category.category === 'ACCOUNT'
        case 'renew':
          return category.category === 'SUBSCRIPTION'
        case 'assign_plan':
          return false // No reasons needed for assign_plan
        case 'disable_card':
          return category.category === 'CARD'
        case 'enable_card':
          return category.category === 'ACCOUNT'
        default:
          return false
      }
    })?.reasons || []).filter((reason: any) => reason && reason.trim() !== '')
  ))

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('')
      setNotes('')
      setSelectedPlanId('')
      setSelectedCardUid('')
      setCancelReason('')
      setCancelCardReturned(false)
      setCancelReclaimInfo(null)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    // For assign_plan, we don't need reason, just plan selection
    if (actionType !== 'assign_plan' && actionType !== 'disable_card' && actionType !== 'enable_card' && !reason) {
      toast.error('Please select a reason')
      return
    }

    if ((actionType === 'renew' || actionType === 'assign_plan') && !selectedPlanId) {
      toast.error('Please select a membership plan')
      return
    }

    const memberName = memberData ? `${memberData.firstName || 'Unknown'} ${memberData.lastName || 'User'}` : 'Member'

    try {
      switch (actionType) {
        case 'activate':
          await activateMutation.mutateAsync({
            memberId,
            data: { reason, notes }
          })
          toast.success(`Successfully activated ${memberName}`)
          break

        case 'restore':
          await restoreMutation.mutateAsync({
            memberId,
            data: { reason, notes }
          })
          toast.success(`Successfully restored ${memberName}`)
          break

        case 'renew':
          await renewMutation.mutateAsync({
            memberId,
            data: { gymMembershipPlanId: selectedPlanId }
          })
          toast.success(`Successfully renewed ${memberName}'s membership`)
          break

        case 'assign_plan':
          await assignPlanMutation.mutateAsync({
            memberId,
            membershipPlanId: selectedPlanId
          })
          toast.success(`Successfully assigned membership plan to ${memberName}`)
          break

        case 'disable_card':
          await disableCardMutation.mutateAsync({
            memberId,
            data: { reason, notes }
          })
          toast.success(`Successfully disabled ${memberName}'s card`)
          break

        case 'enable_card':
          if (!selectedCardUid) {
            toast.error('Please select a card to enable')
            return
          }
          await enableCardMutation.mutateAsync({
            memberId,
            data: { cardUid: selectedCardUid, reason }
          })
          toast.success(`Successfully enabled ${memberName}'s card`)
          break

        default:
          toast.error('Unknown action type')
      }

      onActionComplete?.()
      onClose()
    } catch (error: any) {
      console.error(`${actionType} failed:`, error)
      toast.error(`Failed to ${actionType} member\n${error?.response?.data?.message || 'Please try again.'}`, {
        autoClose: 5000
      })
    }
  }

  const resetCancelForm = () => {
    setCancelReason('')
    setCancelCardReturned(false)
  }

  const handleCancelAction = () => {
    const memberName = `${memberData.firstName || 'Unknown'} ${memberData.lastName || 'User'}`.trim() || 'Member'

    cancelMutation.mutate(
      {
        memberId,
        data: {
          reason: cancelReason.trim() || undefined,
          cardReturned: cancelCardReturned,
        },
      },
      {
        onSuccess: (result) => {
          onClose()
          resetCancelForm()
          setCancelReclaimInfo(null)
          onActionComplete?.()

          if (
            result.reclaimPending &&
            memberData.gymMemberProfile?.primaryBranchId
          ) {
            const expiresAt =
              result.expiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString()
            setCancelReclaimInfo({
              gymId: memberData.gymMemberProfile.primaryBranchId,
              memberName,
              expiresAt,
            })
            setShowCancelReclaimModal(true)
            toast.info(`Reclaim pending for ${memberName}`)
            return
          }

          toast.success(`Successfully cancelled ${memberName}'s membership`)
        },
        onError: (error: any) => {
          console.error('cancel failed:', error)
          const errorMessage =
            error && typeof error === 'object' && 'response' in error
              ? (error.response as { data?: { message?: string } })?.data?.message
              : 'Please try again.'
          toast.error(`Failed to cancel membership\n${errorMessage || 'Please try again.'}`, {
            autoClose: 5000,
          })
        },
      },
    )
  }

  const isLoading = memberLoading || reasonsLoading
  const isMutating = activateMutation.isPending || cancelMutation.isPending || restoreMutation.isPending || renewMutation.isPending || assignPlanMutation.isPending || disableCardMutation.isPending || enableCardMutation.isPending

  // Early return with loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading member data...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Early return if no member data
  if (!memberData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center py-8">
            <div className="text-red-500">Failed to load member data. Please try again.</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  
  // Safe status icon selection
  const currentState = memberData.currentState as keyof typeof statusIcons
  const StatusIcon = (currentState && statusIcons[currentState]) 
    ? statusIcons[currentState].icon 
    : Info
  const statusColor = (currentState && statusIcons[currentState]) 
    ? statusIcons[currentState].color 
    : 'text-gray-400'

  if (actionType === 'cancel') {
    const memberName = `${memberData.firstName || 'Unknown'} ${memberData.lastName || 'User'}`.trim() || 'Member'
    return (
      <>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) {
              resetCancelForm()
              setCancelReclaimInfo(null)
              onClose()
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <UserX className="h-5 w-5" />
                Cancel Membership
              </DialogTitle>
              <DialogDescription>
                Canceling this membership will immediately remove access for the member. Optionally flag the card as returned to reclaim it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="font-semibold text-yellow-700">Warning</p>
                <p className="text-sm text-yellow-800">
                  The member will be suspended and will need a new membership to regain access.
                </p>
              </div>

              {/* Action Warning/Info */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> This will immediately cancel the member's access to gym facilities. This action will be logged in their history.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Cancellation Notes (optional)</Label>
                <Textarea
                  placeholder="Add a quick reason for auditing"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Card Returned?</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                      cancelCardReturned
                        ? 'bg-white text-slate-900 border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                    onClick={() => setCancelCardReturned(true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                      !cancelCardReturned
                        ? 'bg-white text-slate-900 border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                    onClick={() => setCancelCardReturned(false)}
                  >
                    No
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Choose "Yes" only if the member handed back their card. The kiosk will then verify it before updating inventory.
                </p>
              </div>

              {memberData.subscription && (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-xs text-gray-600">Active Plan</p>
                  <p className="font-semibold text-gray-900">{memberData.subscription.gymMembershipPlan?.name || 'Unknown Plan'}</p>
                  <p className="text-xs text-gray-500">
                    Valid until {new Date(memberData.subscription.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetCancelForm()
                  setCancelReclaimInfo(null)
                  onClose()
                }}
                disabled={cancelMutation.isPending}
              >
                Keep Active
              </Button>
              <Button
                variant="destructive"
                disabled={cancelMutation.isPending}
                onClick={handleCancelAction}
              >
                <UserX className="w-4 h-4 mr-2" />
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Membership'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {cancelReclaimInfo && (
          <ReclaimPendingModal
            gymId={cancelReclaimInfo.gymId}
            memberName={cancelReclaimInfo.memberName}
            initialExpiresAt={cancelReclaimInfo.expiresAt}
            isOpen={showCancelReclaimModal}
            onClose={() => {
              setShowCancelReclaimModal(false)
              setCancelReclaimInfo(null)
            }}
          />
        )}
      </>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${config.color}`}>
            <IconComponent className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Information */}
          {memberData && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{memberData.firstName} {memberData.lastName}</h4>
                  <p className="text-sm text-muted-foreground">{memberData.email}</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${statusColor}`}>
                    <StatusIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{memberData.currentState || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {/* Current subscription info */}
               {memberData.subscription && (
                 <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                   <div className="grid grid-cols-2 gap-4 text-xs">
                     <div>
                       <span className="text-muted-foreground">Plan:</span>
                       <p className="font-medium">{memberData.subscription.gymMembershipPlan?.name || 'Unknown Plan'}</p>
                     </div>
                     <div>
                       <span className="text-muted-foreground">Price:</span>
                       <p className="font-medium text-green-600">₱{memberData.subscription.gymMembershipPlan?.price || 'N/A'}</p>
                     </div>
                     <div>
                       <span className="text-muted-foreground">Start:</span>
                       <p className="font-medium">{new Date(memberData.subscription.startDate).toLocaleDateString()}</p>
                     </div>
                    <div>
                      <span className="text-muted-foreground">End:</span>
                      <p className="font-medium">{new Date(memberData.subscription.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

           {/* Card Selection (for enable_card) */}
           {actionType === 'enable_card' && (
             <div className="space-y-2">
               <Label>Select Disabled Card to Re-enable</Label>
               <Select value={selectedCardUid} onValueChange={setSelectedCardUid}>
                 <SelectTrigger>
                   <SelectValue placeholder="Choose a disabled card" />
                 </SelectTrigger>
                 <SelectContent>
                   {disabledCards.length === 0 ? (
                     <SelectItem value="no-cards" disabled>
                       No disabled cards available
                     </SelectItem>
                   ) : (
                     disabledCards.map((card: any) => (
                       <SelectItem key={card.uid} value={card.uid}>
                         Card {card.uid} ({card.type})
                       </SelectItem>
                     ))
                   )}
                 </SelectContent>
               </Select>
             </div>
           )}

           {/* Membership Plan Selection (for renewal and assign_plan) */}
           {(actionType === 'renew' || actionType === 'assign_plan') && (
            <div className="space-y-2">
              <Label>{actionType === 'assign_plan' ? 'Select Membership Plan to Assign' : 'Select New Membership Plan'}</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a membership plan" />
                </SelectTrigger>
                <SelectContent>
                  {safeMembershipPlans.length === 0 ? (
                    <SelectItem value="no-plans" disabled>
                      No membership plans available
                    </SelectItem>
                  ) : (
                    safeMembershipPlans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ₱{plan.price} ({plan.duration} days)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {selectedPlanId && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  {(() => {
                    const selectedPlan = safeMembershipPlans.find((p: any) => p.id === selectedPlanId)
                    if (!selectedPlan) return null
                    
                    const startDate = new Date()
                    const endDate = new Date(startDate)
                    endDate.setDate(endDate.getDate() + selectedPlan.duration)
                    
                    return (
                      <div className="space-y-1 text-sm text-green-800 dark:text-green-300">
                        <p><strong>Selected:</strong> {selectedPlan.name}</p>
                        <p><strong>Price:</strong> ₱{selectedPlan.price}</p>
                        <p><strong>Duration:</strong> {selectedPlan.duration} days</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <strong>New end date:</strong> {endDate.toLocaleDateString()}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Reason Selection (not needed for assign_plan) */}
          {actionType !== 'assign_plan' && (
            <div className="space-y-2">
              <Label>Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {relevantReasons.length === 0 ? (
                  <SelectItem value="loading" disabled>
                    {reasonsLoading ? 'Loading reasons...' : 'No reasons available'}
                  </SelectItem>
                ) : (
                  relevantReasons.map((reasonOption) => (
                    <SelectItem key={String(reasonOption)} value={String(reasonOption)}>
                      {formatReasonOption(String(reasonOption))}
                    </SelectItem>
                  ))
                )}
               </SelectContent>
             </Select>
            </div>
          )}

          {/* Additional Notes (not needed for assign_plan) */}
          {actionType !== 'assign_plan' && (
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                placeholder="Add any additional notes or context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isMutating}>
            Cancel
          </Button>
           <Button
             variant={config.buttonVariant}
             onClick={handleSubmit}
             disabled={(actionType !== 'assign_plan' && !reason) || ((actionType === 'renew' || actionType === 'assign_plan') && !selectedPlanId) || (actionType === 'enable_card' && !selectedCardUid) || isMutating}
           >
            <IconComponent className="w-4 h-4 mr-2" />
            {isMutating ? `${config.buttonText.split(' ')[0]}ing...` : config.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
