'use client'

import { useState, useEffect } from 'react'
import { useMembershipPlans } from '@/lib/hooks/use-membership-plans'
import { useProfile } from '@/lib/hooks/use-users'
import { useRenewMemberSubscription } from '@/lib/hooks/use-member-actions'
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
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-toastify'
import { formatPHP } from '@/lib/utils/currency'

interface MemberRenewalModalProps {
  isOpen: boolean
  onClose: () => void
  member: any
  onRenewed?: () => void
}

export function MemberRenewalModal({
  isOpen,
  onClose,
  member,
  onRenewed
}: MemberRenewalModalProps) {
  const { data: profile } = useProfile()
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [startDate, setStartDate] = useState('')
  
  const renewMemberMutation = useRenewMemberSubscription()

  const { data: membershipPlans, isLoading: plansLoading } = useMembershipPlans()

  useEffect(() => {
    if (isOpen) {
      // Set default start date to today
      const today = new Date()
      setStartDate(today.toISOString().split('T')[0])
      
      // If member had a previous plan, select it by default
      const latestSubscription = member?.gymSubscriptions?.[0]
      if (latestSubscription?.membershipPlan?.id) {
        setSelectedPlanId(latestSubscription.membershipPlan.id)
      }
    }
  }, [isOpen, member])

  const selectedPlan = membershipPlans?.find((plan: any) => plan.id === selectedPlanId)
  
  const calculateEndDate = () => {
    if (!selectedPlan || !startDate) return ''
    
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + selectedPlan.duration)
    
    return end.toISOString().split('T')[0]
  }

  const handleRenew = async () => {
    if (!selectedPlanId || !startDate) {
      toast.error('Please select a plan and start date')
      return
    }

    const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
    
    console.log('📥 STARTING RENEWAL PROCESS for:', memberName)
    
    renewMemberMutation.mutate({
      memberId: member.id,
      data: {
        membershipPlanId: selectedPlanId
      }
    }, {
      onSuccess: () => {
        console.log('🎉 RENEWAL SUCCESS in modal')
        toast.success(`Membership renewed successfully for ${memberName}`)
        onRenewed?.()
        onClose()
      },
      onError: (error: any) => {
        console.error('🚨 MODAL ERROR HANDLER TRIGGERED:', error)
        console.error('Error type:', typeof error)
        console.error('Error name:', error?.name)
        console.error('Error constructor:', error?.constructor?.name)
        console.log('Full error structure:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
        
        // Extract error message from the response - try multiple paths
        let errorMessage = 'Failed to renew membership'
        
        // Try different error message paths
        if (error?.response?.data?.message) {
          console.log('✅ Found error message in response.data.message:', error.response.data.message)
          errorMessage = error.response.data.message
        } else if (error?.data?.message) {
          console.log('✅ Found error message in data.message:', error.data.message)
          errorMessage = error.data.message
        } else if (error?.message) {
          console.log('✅ Found error message in message:', error.message)
          errorMessage = error.message
        } else if (typeof error === 'string') {
          console.log('✅ Error is a string:', error)
          errorMessage = error
        } else {
          console.log('❌ No error message found, using default')
        }
        
        console.log('📢 SHOWING TOAST with message:', errorMessage)
        
        toast.error(errorMessage, {
          position: 'top-center',
          autoClose: 6000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      },
      onSettled: () => {
        // Always runs after success or error
        console.log('🎯 MUTATION SETTLED - checking mutation state:')
        console.log('Mutation error:', renewMemberMutation.error)
        console.log('Mutation isError:', renewMemberMutation.isError)
        console.log('Mutation isPending:', renewMemberMutation.isPending)
        
        // If there's an error that wasn't caught by onError, handle it here
        if (renewMemberMutation.isError && renewMemberMutation.error) {
          console.log('🔴 FALLBACK ERROR HANDLING in onSettled')
          const error = renewMemberMutation.error as any
          let errorMessage = 'Failed to renew membership'
          
          if (error?.message) {
            errorMessage = error.message
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
      }
    })
  }

  const handleClose = () => {
    setSelectedPlanId('')
    setStartDate('')
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Renew Membership</h3>
              <p className="text-sm text-muted-foreground">{memberName}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Select a new membership plan and start date to renew this member's subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Membership Info */}
          {currentMembership && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Expired Membership</span>
              </div>
              <div className="space-y-1 text-sm text-red-600">
                <p><strong>Plan:</strong> {currentMembership.planName}</p>
                <p><strong>Expired:</strong> {new Date(currentMembership.endDate).toLocaleDateString()}</p>
                <p><strong>Amount:</strong> ₱{currentMembership.price}</p>
              </div>
            </div>
          )}

          {/* Plan Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan">Select Membership Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a membership plan" />
                </SelectTrigger>
                <SelectContent>
                  {plansLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">Loading plans...</div>
                  ) : membershipPlans?.filter((plan: any) => plan.isActive).map((plan: any) => (
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

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Plan Summary */}
            {selectedPlan && startDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Membership Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Plan:</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Duration:</span>
                    <span>{selectedPlan.duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Start Date:</span>
                    <span>{new Date(startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">End Date:</span>
                    <span>{calculateEndDate() ? new Date(calculateEndDate()).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span className="font-medium text-blue-800">Total Amount:</span>
                    <span className="font-bold text-green-600">
                      {formatPHP(selectedPlan.price)}
                    </span>
                  </div>
                </div>

                {/* Benefits */}
                {selectedPlan.benefits && (
                  <div className="mt-4">
                    <h5 className="font-medium text-blue-900 text-xs mb-2">Plan Benefits:</h5>
                    <div className="grid grid-cols-1 gap-1">
                      {(() => {
                        const benefits = typeof selectedPlan.benefits === 'string' 
                          ? JSON.parse(selectedPlan.benefits) 
                          : selectedPlan.benefits;
                        return (benefits || []).slice(0, 3).map((benefit: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-blue-700">
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
                          <div className="text-xs text-blue-600 ml-5">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={renewMemberMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleRenew} 
            disabled={!selectedPlanId || !startDate || renewMemberMutation.isPending}
          >
            {renewMemberMutation.isPending ? 'Processing...' : `Renew Membership`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
