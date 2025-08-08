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
  Info,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { useMemberStatus, useActionReasons, useActivateMember, useCancelMember, useRestoreMember, useRenewMemberSubscription } from '@/lib/hooks/use-member-actions'
import type { MemberActionRequest } from '@/lib/api/members'
import { useActiveMembershipPlans } from '@/lib/hooks/use-membership-plans'

export type MemberActionType = 'activate' | 'cancel' | 'restore' | 'renew'

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
}

const statusIcons = {
  ACTIVE: { icon: CheckCircle, color: 'text-green-500' },
  EXPIRED: { icon: Clock, color: 'text-orange-500' },
  CANCELLED: { icon: UserX, color: 'text-red-500' },
  DELETED: { icon: AlertTriangle, color: 'text-gray-500' },
  INACTIVE: { icon: Info, color: 'text-gray-400' },
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
  
  const config = actionConfig[actionType]
  const IconComponent = config.icon

  // Fetch member data and action reasons
  const { data: memberData, isLoading: memberLoading } = useMemberStatus(memberId)
  const { data: actionReasons, isLoading: reasonsLoading } = useActionReasons()
  const { data: membershipPlans = [] } = useActiveMembershipPlans()

  // Mutation hooks
  const activateMutation = useActivateMember()
  const cancelMutation = useCancelMember()
  const restoreMutation = useRestoreMember()
  const renewMutation = useRenewMemberSubscription()

  // Get relevant reasons for the current action
  const relevantReasons = (actionReasons?.find(category => {
    switch (actionType) {
      case 'activate':
        return category.category === 'ACCOUNT'
      case 'cancel':
        return category.category === 'SUBSCRIPTION' 
      case 'restore':
        return category.category === 'ACCOUNT'
      case 'renew':
        return category.category === 'SUBSCRIPTION'
      default:
        return false
    }
  })?.reasons || []).filter(reason => reason && reason.trim() !== '')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('')
      setNotes('')
      setSelectedPlanId('')
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason')
      return
    }

    if (actionType === 'renew' && !selectedPlanId) {
      toast.error('Please select a membership plan')
      return
    }

    const memberName = memberData ? `${memberData.firstName} ${memberData.lastName}` : 'Member'

    try {
      switch (actionType) {
        case 'activate':
          await activateMutation.mutateAsync({
            memberId,
            data: { reason, notes }
          })
          toast.success(`Successfully activated ${memberName}`)
          break

        case 'cancel':
          await cancelMutation.mutateAsync({
            memberId,
            data: { reason, notes }
          })
          toast.success(`Successfully cancelled ${memberName}'s membership`)
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
            data: { membershipPlanId: selectedPlanId }
          })
          toast.success(`Successfully renewed ${memberName}'s membership`)
          break
      }

      onActionComplete?.()
      onClose()
    } catch (error: any) {
      console.error(`${actionType} failed:`, error)
      toast.error(`Failed to ${actionType} member`, {
        description: error?.response?.data?.message || 'Please try again.'
      })
    }
  }

  const isLoading = memberLoading || reasonsLoading
  const isMutating = activateMutation.isPending || cancelMutation.isPending || restoreMutation.isPending || renewMutation.isPending

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

  // Debug logging - can be removed once issue is resolved
  if (process.env.NODE_ENV === 'development') {
    console.log('MemberActionsModal - actionType:', actionType, 'memberState:', memberData?.currentState);
  }
  
  // Safe status icon selection
  const StatusIcon = (memberData.currentState && statusIcons[memberData.currentState]) 
    ? statusIcons[memberData.currentState].icon 
    : Info
  const statusColor = (memberData.currentState && statusIcons[memberData.currentState]) 
    ? statusIcons[memberData.currentState].color 
    : 'text-gray-400'

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
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
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
                <div className="pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Plan:</span>
                      <p className="font-medium">{memberData.subscription.membershipPlan.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-medium text-green-600">₱{memberData.subscription.membershipPlan.price}</p>
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

          {/* Membership Plan Selection (for renewal) */}
          {actionType === 'renew' && (
            <div className="space-y-2">
              <Label>Select New Membership Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a membership plan" />
                </SelectTrigger>
                <SelectContent>
                  {membershipPlans.length === 0 ? (
                    <SelectItem value="no-plans" disabled>
                      No membership plans available
                    </SelectItem>
                  ) : (
                    membershipPlans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ₱{plan.price} ({plan.duration} days)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {selectedPlanId && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  {(() => {
                    const selectedPlan = membershipPlans.find((p: any) => p.id === selectedPlanId)
                    if (!selectedPlan) return null
                    
                    const startDate = new Date()
                    const endDate = new Date(startDate)
                    endDate.setDate(endDate.getDate() + selectedPlan.duration)
                    
                    return (
                      <div className="space-y-1 text-sm text-green-800">
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

          {/* Reason Selection */}
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
                    <SelectItem key={reasonOption} value={reasonOption}>
                      {reasonOption}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Add any additional notes or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Warning/Info */}
          {actionType === 'cancel' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This will immediately cancel the member's access to gym facilities. This action will be logged in their history.
              </p>
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
            disabled={!reason || (actionType === 'renew' && !selectedPlanId) || isMutating}
          >
            <IconComponent className="w-4 h-4 mr-2" />
            {isMutating ? `${config.buttonText.split(' ')[0]}ing...` : config.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
