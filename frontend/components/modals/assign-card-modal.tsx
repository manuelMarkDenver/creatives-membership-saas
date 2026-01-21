'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Loader2, CreditCard, Clock, X } from 'lucide-react'
import { membersApi } from '@/lib/api/gym-members'

interface AssignCardModalProps {
  isOpen: boolean
  onClose: () => void
  member: User | null
  onCardAssigned?: () => void
}

export function AssignCardModal({ isOpen, onClose, member, onCardAssigned }: AssignCardModalProps) {
  const [countdown, setCountdown] = useState(600) // 10 minutes in seconds
  const [isPolling, setIsPolling] = useState(false)
  const queryClient = useQueryClient()

  const memberName = member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : 'Unknown'

  // Get current pending assignment status
  const { data: pendingData, refetch: refetchPending } = useQuery({
    queryKey: ['pending-assignment', member?.gymMemberProfile?.primaryBranchId],
    queryFn: async () => {
      if (!member?.gymMemberProfile?.primaryBranchId) return null
      return membersApi.getPendingAssignment(member.gymMemberProfile.primaryBranchId)
    },
    enabled: isOpen && !!member?.gymMemberProfile?.primaryBranchId,
    refetchInterval: isPolling ? 2000 : false, // Poll every 2 seconds when modal is open
  })

  // Assign card mutation
  const assignCardMutation = useMutation({
    mutationFn: async () => {
      if (!member?.id) throw new Error('No member selected')
      return membersApi.assignCardToMember(member.id, 'ONBOARD')
    },
    onSuccess: (data) => {
      toast.success('Card assignment initiated! Member has 10 minutes to tap their card.')
      setIsPolling(true)
      setCountdown(600) // Reset countdown
      refetchPending()
    },
    onError: (error: any) => {
      toast.error(`Failed to assign card: ${error.message}`)
    }
  })

  // Cancel pending assignment mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!member?.gymMemberProfile?.primaryBranchId) {
        throw new Error('No gym ID available')
      }
      return membersApi.cancelPendingAssignment(member.gymMemberProfile.primaryBranchId)
    },
    onSuccess: () => {
      toast.success('Card assignment cancelled')
      setIsPolling(false)
      onClose()
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel: ${error.message}`)
    }
  })

  // Modal just polls for assignment completion - RFID capture happens on physical kiosk

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPolling && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsPolling(false)
            toast.error('Assignment expired - member didn\'t tap card in time')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPolling, countdown])

  // Check if assignment was completed
  useEffect(() => {
    if (pendingData === null && isPolling) {
      // Pending assignment disappeared - either assigned or cancelled
      setIsPolling(false)
      toast.success('Card assigned successfully!')
      onCardAssigned?.()
      onClose()

      // Refresh members data
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['gym-members'] })
    }
  }, [pendingData, isPolling, onCardAssigned, onClose, queryClient])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPolling(false)
      setCountdown(600)
    }
  }, [isOpen])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAssignCard = () => {
    assignCardMutation.mutate()
  }

  const handleCancel = () => {
    cancelMutation.mutate()
  }

  const handleClose = () => {
    if (isPolling) {
      // Warn user if closing while pending
      if (confirm('Card assignment is in progress. Close anyway?')) {
        setIsPolling(false)
        onClose()
      }
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-500" />
            Assign Card
          </DialogTitle>
          <DialogDescription>
            Assign an RFID card to {memberName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {memberName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{memberName}</p>
              <p className="text-sm text-gray-600">{member?.email}</p>
            </div>
          </div>

          {/* Status */}
          {!isPolling && !pendingData && (
            <div className="text-center p-4">
              <p className="text-sm text-gray-600 mb-4">
                Click "Start Assignment" to begin the card assignment process.
              </p>
              <Badge variant="outline" className="text-purple-600">
                Ready to assign
              </Badge>
            </div>
          )}

          {isPolling && (
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                <span className="font-medium text-purple-700">Waiting for card tap...</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Take the member to the physical kiosk location. They have <strong>{formatTime(countdown)}</strong> to tap their card on the kiosk screen.
              </p>
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border mt-2">
                <strong>Important:</strong> Ensure the kiosk terminal is configured for the same gym as this member. If not, update the terminal's gym assignment.
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">Expires: {formatTime(countdown)}</span>
              </div>
            </div>
          )}

          {pendingData && !isPolling && (
            <div className="text-center p-4 border rounded-lg bg-amber-50">
              <p className="text-sm text-amber-800 mb-2">
                Another assignment is in progress for this gym
              </p>
              <Badge variant="outline" className="text-amber-600">
                {pendingData.memberName} - {formatTime(Math.ceil((new Date(pendingData.expiresAt).getTime() - Date.now()) / 1000))}
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {isPolling ? 'Close' : 'Cancel'}
          </Button>

          {isPolling && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Assignment
            </Button>
          )}

          {!isPolling && !pendingData && (
            <Button
              onClick={handleAssignCard}
              disabled={assignCardMutation.isPending}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {assignCardMutation.isPending ? 'Starting...' : 'Start Assignment'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}