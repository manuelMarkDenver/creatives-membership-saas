'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { useRenewMembership } from '@/lib/hooks/use-gym-member-actions'

interface RenewMembershipModalProps {
  isOpen: boolean
  onClose: () => void
  member: any
  onRenewed: () => void
}

export function RenewMembershipModal({
  isOpen,
  onClose,
  member,
  onRenewed
}: RenewMembershipModalProps) {
  const [selectedDays, setSelectedDays] = useState<number | null>(null)
  const [showCustomDaysInput, setShowCustomDaysInput] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const renewMembershipMutation = useRenewMembership()

  // Handle preset days selection
  const handleDaysChange = (days: number) => {
    setSelectedDays(days)
    setShowCustomDaysInput(false) // Hide custom input when preset is selected
  }

  // Handle custom days input
  const handleCustomDaysChange = (days: number) => {
    setSelectedDays(days)
  }

  // Show custom days input
  const handleShowCustomDays = () => {
    setSelectedDays(null) // Clear preset selection
    setShowCustomDaysInput(true)
  }

  const handleRenew = async () => {
    if (!selectedDays) {
      toast.error('Please select extension period')
      return
    }

    try {
      console.log('🔄 RenewMembershipModal: Calling API with memberId:', member.id, 'days:', selectedDays)
      await renewMembershipMutation.mutateAsync({
        memberId: member.id,
        data: { days: selectedDays }
      })

      toast.success(`Membership extended by ${selectedDays} days`)
      onRenewed()
      setSelectedDays(null)
      setIsConfirming(false)
    } catch (error) {
      console.error('🔄 RenewMembershipModal: Error:', error)
      // Error is handled by the mutation hook
    }
  }

  const handleClose = () => {
    setSelectedDays(null)
    setShowCustomDaysInput(false)
    setIsConfirming(false)
    onClose()
  }

  if (!member) return null

  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Extend Membership
          </DialogTitle>
          <DialogDescription>
            Extend {memberName}'s membership using the same card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isConfirming ? (
            <>
               <div>
                 <Label>Extension Period</Label>
                 <p className="text-sm text-muted-foreground mb-3">
                   Choose how many days to extend the membership
                 </p>
                 <div className="grid grid-cols-2 gap-2">
                    {[30, 60, 90, 180].map((days) => (
                      <Button
                        key={days}
                        variant={selectedDays === days ? "default" : "outline"}
                        onClick={() => handleDaysChange(days)}
                        className="h-12"
                      >
                       {days} days
                     </Button>
                   ))}
                   <Button
                     variant={showCustomDaysInput ? "default" : "outline"}
                     onClick={handleShowCustomDays}
                     className="h-12"
                   >
                     Custom
                   </Button>
                 </div>

                 {showCustomDaysInput && (
                   <div className="mt-3">
                     <Label htmlFor="customDays" className="text-sm">Enter custom days (1-365)</Label>
                     <Input
                       id="customDays"
                       type="number"
                       min="1"
                       max="365"
                       value={selectedDays || ''}
                       onChange={(e) => {
                         const value = parseInt(e.target.value)
                         if (value >= 1 && value <= 365) {
                           handleCustomDaysChange(value)
                         } else if (e.target.value === '') {
                           setSelectedDays(null)
                         }
                       }}
                       placeholder="Enter number of days"
                       className="mt-1"
                     />
                   </div>
                 )}
               </div>
            </>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Confirm Extension
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This will extend the member's access by {selectedDays} days using the same card.
                  </p>
                  <div className="text-sm">
                    <strong>Extension:</strong> {selectedDays} days from today
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {!isConfirming ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setIsConfirming(true)}
                disabled={!selectedDays}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsConfirming(false)}
                disabled={renewMembershipMutation.isPending}
              >
                Back
              </Button>
              <Button
                onClick={handleRenew}
                disabled={renewMembershipMutation.isPending}
              >
                {renewMembershipMutation.isPending ? 'Extending...' : 'Confirm Extension'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}