'use client'

import { useState } from 'react'
import { useCancelMember } from '@/lib/hooks/use-member-actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertTriangle, 
  Calendar,
  User,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatPHP } from '@/lib/utils/currency'

interface MemberCancellationModalProps {
  isOpen: boolean
  onClose: () => void
  member: any
  onCancelled?: () => void
}

export function MemberCancellationModal({
  isOpen,
  onClose,
  member,
  onCancelled
}: MemberCancellationModalProps) {
  const [cancellationType, setCancellationType] = useState<'immediate' | 'end_of_period'>('end_of_period')
  const [reason, setReason] = useState('')
  
  const cancelMemberMutation = useCancelMember()

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }

    const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
    
    // Create notes with cancellation type info
    const notes = `Cancellation type: ${cancellationType === 'immediate' ? 'Immediate' : 'End of period'}`
    
    cancelMemberMutation.mutate({
      memberId: member.id,
      data: {
        reason: reason.trim(),
        notes: notes
      }
    }, {
      onSuccess: () => {
        const message = cancellationType === 'immediate' 
          ? `Membership cancelled immediately for ${memberName}`
          : `Membership will expire at end of current period for ${memberName}`
        
        toast.success(message)
        onCancelled?.()
        onClose()
      },
      onError: (error: any) => {
        console.error('Error cancelling membership:', error)
        toast.error('Failed to cancel membership')
      }
    })
  }

  const handleClose = () => {
    setCancellationType('end_of_period')
    setReason('')
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
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Cancel Membership</h3>
              <p className="text-sm text-muted-foreground">{memberName}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this member's active membership? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Membership Info */}
          {currentMembership && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Current Active Membership</span>
              </div>
              <div className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
                <p><strong>Plan:</strong> {currentMembership.planName}</p>
                <p><strong>Valid Until:</strong> {new Date(currentMembership.endDate).toLocaleDateString()}</p>
                <p><strong>Amount Paid:</strong> ₱{currentMembership.price}</p>
                <p><strong>Days Remaining:</strong> {
                  Math.max(0, Math.ceil((new Date(currentMembership.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                } days</p>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Important Notice</span>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Once cancelled, this member will lose access to gym facilities according to the cancellation type you select below. 
              This action cannot be undone - you would need to create a new membership to restore access.
            </p>
          </div>

          {/* Cancellation Options */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancellationType">Cancellation Type</Label>
              <Select value={cancellationType} onValueChange={(value: 'immediate' | 'end_of_period') => setCancellationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="end_of_period">
                    <div className="space-y-1">
                      <div className="font-medium">End of Current Period</div>
                      <div className="text-xs text-muted-foreground">
                        Member keeps access until {currentMembership ? new Date(currentMembership.endDate).toLocaleDateString() : 'expiration'}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="immediate">
                    <div className="space-y-1">
                      <div className="font-medium">Immediate Cancellation</div>
                      <div className="text-xs text-muted-foreground">
                        Member loses access immediately (consider refunds)
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Cancellation *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for the cancellation (e.g., Member request, Non-payment, Violation of terms, etc.)"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Cancellation Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Cancellation Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Member:</span>
                <span className="font-medium">{memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                <span>{currentMembership?.planName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cancellation:</span>
                <span className={cancellationType === 'immediate' ? 'text-red-600 font-medium' : 'text-orange-600'}>
                  {cancellationType === 'immediate' ? 'Immediate' : 'End of Period'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Effective:</span>
                <span>
                  {cancellationType === 'immediate' 
                    ? 'Today'
                    : (currentMembership ? new Date(currentMembership.endDate).toLocaleDateString() : 'N/A')
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={cancelMemberMutation.isPending}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleCancel} 
            disabled={!reason.trim() || cancelMemberMutation.isPending}
          >
            {cancelMemberMutation.isPending ? 'Processing...' : 'Confirm Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
