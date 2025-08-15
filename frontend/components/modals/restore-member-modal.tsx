'use client'

import { useState } from 'react'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  UserPlus,
  CheckCircle,
  User as UserIcon,
  Calendar,
  CreditCard
} from 'lucide-react'
import { useRestoreUser } from '@/lib/hooks/use-users'
import { toast } from 'sonner'

interface RestoreMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member: User
  onRestoreComplete: () => void
}

export function RestoreMemberModal({
  isOpen,
  onClose,
  member,
  onRestoreComplete
}: RestoreMemberModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const restoreMutation = useRestoreUser()
  
  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
  const subscription = member.gymSubscriptions?.[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for restoring this member')
      return
    }

    // If "OTHER" is selected, notes are required
    if (reason === 'OTHER' && !notes.trim()) {
      toast.error('Please specify the reason for restoration')
      return
    }

    setIsSubmitting(true)
    
    try {
      await restoreMutation.mutateAsync(member.id)
      toast.success(`${memberName} has been restored successfully`)
      onRestoreComplete()
      onClose()
    } catch (error) {
      console.error('Error restoring member:', error)
      toast.error('Failed to restore member. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('')
      setNotes('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <UserPlus className="h-5 w-5" />
            Restore Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to restore {memberName}? This will reactivate their account and make them visible in member lists again.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member Summary */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {memberName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                {memberName}
              </h4>
              <p className="text-sm text-muted-foreground">{member.email}</p>
              {subscription && (
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-purple-600 font-medium flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    {subscription.membershipPlan?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expires: {new Date(subscription.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Restoring member
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  This will reactivate the member's account, making them visible in active member lists and allowing them to access gym facilities if they have an active subscription.
                </p>
              </div>
            </div>
          </div>

          {/* Reason field */}
          <div className="space-y-2">
            <Label>Reason for restoration <span className="text-red-500">*</span></Label>
            <Select value={reason} onValueChange={setReason} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAYMENT_RECEIVED">Payment received</SelectItem>
                <SelectItem value="ISSUE_RESOLVED">Issue resolved</SelectItem>
                <SelectItem value="MEMBER_APPEAL">Member appeal approved</SelectItem>
                <SelectItem value="POLICY_UPDATE">Policy update</SelectItem>
                <SelectItem value="ADMINISTRATIVE_ERROR">Administrative error</SelectItem>
                <SelectItem value="MANAGEMENT_DECISION">Management decision</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom reason textarea - only show when OTHER is selected */}
          {reason === 'OTHER' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Please specify the reason</Label>
              <Textarea
                id="custom-reason"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter details about the restoration reason..."
                className="min-h-[80px]"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Additional notes field - always available unless OTHER is selected */}
          {reason !== 'OTHER' && (
            <div className="space-y-2">
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information or context..."
                className="min-h-[60px]"
                disabled={isSubmitting}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !reason.trim() || (reason === 'OTHER' && !notes.trim())}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Restoring...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Restore Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
