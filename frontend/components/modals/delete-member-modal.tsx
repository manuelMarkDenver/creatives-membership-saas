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
  Trash2,
  AlertTriangle,
  User as UserIcon,
  Calendar,
  CreditCard
} from 'lucide-react'
import { useSoftDeleteUser } from '@/lib/hooks/use-users'
import { toast } from 'sonner'

interface DeleteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member: User
  onDeleteComplete: () => void
}

export function DeleteMemberModal({
  isOpen,
  onClose,
  member,
  onDeleteComplete
}: DeleteMemberModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const softDeleteMutation = useSoftDeleteUser()
  
  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
  const subscription = member.gymSubscriptions?.[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for removing this member')
      return
    }

    // If "OTHER" is selected, notes are required
    if (reason === 'OTHER' && !notes.trim()) {
      toast.error('Please specify the reason for removal')
      return
    }

    setIsSubmitting(true)
    
    try {
      await softDeleteMutation.mutateAsync(member.id)
      toast.success(`${memberName} has been removed successfully`)
      onDeleteComplete()
      onClose()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member. Please try again.')
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
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Remove Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {memberName} from your gym? This action can be undone by restoring the member later.
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
          
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  This is a soft delete
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  The member will be marked as inactive and removed from active lists, but can be restored later. All data and history will be preserved.
                </p>
              </div>
            </div>
          </div>

          {/* Reason field */}
          <div className="space-y-2">
            <Label>Reason for removal <span className="text-red-500">*</span></Label>
            <Select value={reason} onValueChange={setReason} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NON_PAYMENT">Non-payment</SelectItem>
                <SelectItem value="POLICY_VIOLATION">Policy violation</SelectItem>
                <SelectItem value="MEMBER_REQUEST">Member request</SelectItem>
                <SelectItem value="FACILITY_ABUSE">Facility abuse</SelectItem>
                <SelectItem value="INAPPROPRIATE_BEHAVIOR">Inappropriate behavior</SelectItem>
                <SelectItem value="SAFETY_CONCERNS">Safety concerns</SelectItem>
                <SelectItem value="ADMIN_DECISION">Admin decision</SelectItem>
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
                placeholder="Enter details about the removal reason..."
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
              variant="destructive"
              disabled={isSubmitting || !reason.trim() || (reason === 'OTHER' && !notes.trim())}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
