'use client'

import { useState, useEffect } from 'react'
import { useMembershipPlans } from '@/lib/hooks/use-membership-plans'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Calendar,
  CreditCard,
  User,
  Check,
  AlertCircle,
  Settings
} from 'lucide-react'
import { toast } from 'react-toastify'
import { formatPHP } from '@/lib/utils/currency'
import { useChangePlan } from '@/lib/hooks/use-change-plan'

interface ChangePlanModalProps {
  isOpen: boolean
  onClose: () => void
  member: any
  onPlanChanged?: () => void
}

export function ChangePlanModal({
  isOpen,
  onClose,
  member,
  onPlanChanged
}: ChangePlanModalProps) {
  const { data: profile } = useProfile()
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')

  const changePlanMutation = useChangePlan()

  const { data: membershipPlans, isLoading: plansLoading } = useMembershipPlans()

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setSelectedPlanId('')
      setPaymentAmount('')

      // If member has a current plan, pre-select it
      const currentSubscription = member?.gymSubscriptions?.[0]
      if (currentSubscription?.gymMembershipPlan?.id) {
        setSelectedPlanId(currentSubscription.gymMembershipPlan.id)
        // Set default payment amount to current plan price
        setPaymentAmount(currentSubscription.price?.toString() || '')
      }
    }
  }, [isOpen, member])

  // Ensure membershipPlans is always an array
  const safeMembershipPlans = Array.isArray(membershipPlans) ? membershipPlans : []
  const selectedPlan = safeMembershipPlans.find((plan: any) => plan.id === selectedPlanId)

  // Auto-fill payment amount when plan changes
  useEffect(() => {
    if (selectedPlan) {
      setPaymentAmount(selectedPlan.price.toString())
    }
  }, [selectedPlan])

  const calculateNewEndDate = () => {
    if (!selectedPlan) return ''

    const changeDate = new Date()
    const end = new Date(changeDate)
    end.setDate(end.getDate() + selectedPlan.duration)

    return end.toISOString().split('T')[0]
  }

  const handleChangePlan = async () => {
    if (!selectedPlanId || !paymentAmount) {
      toast.error('Please select a plan and enter payment amount')
      return
    }

    const paymentAmountNum = parseFloat(paymentAmount)
    if (isNaN(paymentAmountNum) || paymentAmountNum < 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email

    changePlanMutation.mutate({
      memberId: member.id,
      data: {
        gymMembershipPlanId: selectedPlanId,
        paymentAmount: paymentAmountNum
        // v1: paymentMethod removed - always uses 'cash'
      }
    }, {
      onSuccess: () => {
        toast.success(`Plan changed successfully for ${memberName}`)
        onPlanChanged?.()
        onClose()
      },
      onError: (error: any) => {
        let errorMessage = 'Failed to change plan'

        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error?.data?.message) {
          errorMessage = error.data.message
        } else if (error?.message) {
          errorMessage = error.message
        } else if (typeof error === 'string') {
          errorMessage = error
        }

        toast.error(errorMessage, {
          position: 'top-center',
          autoClose: 6000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      }
    })
  }

  const handleClose = () => {
    setSelectedPlanId('')
    setPaymentAmount('')
    onClose()
  }

  if (!member) return null

  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
  const currentMembership = member.gymSubscriptions?.[0]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Change Membership Plan</h3>
              <p className="text-sm text-muted-foreground">{memberName}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Change this member's current membership plan. The new plan will take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Membership Info */}
          {currentMembership && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Current Membership</span>
              </div>
              <div className="space-y-1 text-sm text-blue-600">
                <p><strong>Plan:</strong> {currentMembership.gymMembershipPlan?.name}</p>
                <p><strong>Valid until:</strong> {new Date(currentMembership.endDate).toLocaleDateString()}</p>
                <p><strong>Price:</strong> ₱{currentMembership.price}</p>
              </div>
            </div>
          )}

          {/* Plan Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan">Select New Membership Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a membership plan" />
                </SelectTrigger>
                <SelectContent>
                  {plansLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">Loading plans...</div>
                  ) : safeMembershipPlans.filter((plan: any) => plan.isActive).map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{plan.name}</span>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-green-600 font-medium">
                            {formatPHP(plan.price)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {plan.duration} days
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Amount */}
            <div>
              <Label htmlFor="paymentAmount">Payment Amount (₱)</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
              {selectedPlan && (
                <p className="text-xs text-muted-foreground mt-1">
                  Plan price: ₱{selectedPlan.price}
                </p>
              )}
            </div>

            {/* Plan Summary */}
            {selectedPlan && paymentAmount && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">Plan Change Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">New Plan:</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Duration:</span>
                    <span>{selectedPlan.duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Effective Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">New End Date:</span>
                    <span>{calculateNewEndDate() ? new Date(calculateNewEndDate()).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-300">
                    <span className="font-medium text-green-800">Payment Amount:</span>
                    <span className="font-bold text-green-600">
                      {formatPHP(parseFloat(paymentAmount) || 0)}
                    </span>
                  </div>
                </div>

                {/* Benefits */}
                {selectedPlan.benefits && (
                  <div className="mt-4">
                    <h5 className="font-medium text-green-900 text-xs mb-2">Plan Benefits:</h5>
                    <div className="grid grid-cols-1 gap-1">
                      {(() => {
                        const benefits = typeof selectedPlan.benefits === 'string'
                          ? JSON.parse(selectedPlan.benefits)
                          : selectedPlan.benefits;
                        return (benefits || []).slice(0, 3).map((benefit: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-green-700">
                            <Check className="h-3 w-3 text-green-500" />
                            <span>{benefit}</span>
                          </div>
                        ));
                      })()}
                      {(() => {
                        const benefits = typeof selectedPlan.benefits === 'string'
                          ? JSON.parse(selectedPlan.benefits)
                          : selectedPlan.benefits;
                        return (benefits || []).length > 3 && (
                          <div className="text-xs text-green-600 ml-5">
                            +{benefits.length - 3} more benefits
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium text-sm">Important:</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              This will immediately change the member's plan and update their membership end date.
              The change takes effect today.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={changePlanMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePlan}
            disabled={!selectedPlanId || !paymentAmount || changePlanMutation.isPending}
          >
            {changePlanMutation.isPending ? 'Processing...' : 'Change Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}