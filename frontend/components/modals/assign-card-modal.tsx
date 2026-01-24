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
  const [isRefetchingPending, setIsRefetchingPending] = useState(false)
  const [hasSeenPending, setHasSeenPending] = useState(false)
  const queryClient = useQueryClient()

  const memberName = member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : 'Unknown'

  // Get current pending assignment status
  const { data: pendingData, refetch: refetchPending, isFetching } = useQuery({
    queryKey: ['pending-assignment', member?.gymMemberProfile?.primaryBranchId],
    queryFn: async () => {
      if (!member?.gymMemberProfile?.primaryBranchId) return null
      try {
        const result = await membersApi.getPendingAssignment(member.gymMemberProfile.primaryBranchId)
        console.log('Polling pending assignment:', result)
        return result
      } catch (error) {
        console.warn('Error polling pending assignment:', error)
        return null
      }
    },
    enabled: isOpen && !!member?.gymMemberProfile?.primaryBranchId,
    refetchInterval: isPolling ? 500 : false, // Poll every 0.5 seconds when modal is open (very frequent)
    retry: false, // Don't retry on error
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache
  })

  // Assign card mutation
  const assignCardMutation = useMutation({
    mutationFn: async () => {
      if (!member?.id) throw new Error('No member selected')
      return membersApi.assignCardToMember(member.id, 'ONBOARD')
    },
    onSuccess: (data) => {
      console.log('Card assignment initiated, starting polling...')
      toast.success('Card assignment initiated! Member has 10 minutes to tap their card.')
      setIsPolling(true)
      setCountdown(600) // Reset countdown
      // Invalidate banner query so it appears immediately
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] })
      // Force immediate refetch
      setIsRefetchingPending(true)
      refetchPending().finally(() => setIsRefetchingPending(false))
      // Additional refetch after a short delay
      setTimeout(() => {
        setIsRefetchingPending(true)
        refetchPending().finally(() => setIsRefetchingPending(false))
      }, 500)
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
      setHasSeenPending(false)
      // Invalidate all pending assignment queries
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['pending-assignment'] })
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
      // Invalidate pending assignments when assignment expires
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] })
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
    console.log('Modal state check:', { pendingData, isPolling, isFetching })
    if (pendingData) {
      setHasSeenPending(true)
    }
    if (!pendingData && isPolling && !isFetching && hasSeenPending) {
      // Pending assignment disappeared - either assigned or cancelled
      console.log('Assignment completed - closing modal')
      setIsPolling(false)
      toast.success('Card assigned successfully!')
      onCardAssigned?.()
      
      // Invalidate pending assignments when assignment completes
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] })
      
      // Refresh members data
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['gym-members'] })
      onClose()
    }
  }, [pendingData, isPolling, isFetching, onCardAssigned, onClose, queryClient])

  useEffect(() => {
    if (
      pendingData &&
      member?.id &&
      pendingData.memberId === member.id &&
      pendingData.purpose === 'ONBOARD'
    ) {
      const expiresAt = new Date(pendingData.expiresAt).getTime()
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setCountdown(remaining)
      if (!isPolling) {
        setIsPolling(true)
        toast.info('Card assignment already pending — waiting for tap')
      }
    }
  }, [pendingData, member?.id, isPolling])



  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPolling(false)
      setCountdown(600)
      setHasSeenPending(false)
    }
  }, [isOpen])

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Expired'
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
      setHasSeenPending(false)
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
           <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
             <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
               {memberName.charAt(0).toUpperCase()}
             </div>
             <div>
               <p className="font-medium text-foreground">{memberName}</p>
               <p className="text-sm text-muted-foreground">{member?.email}</p>
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
                  {pendingData.isExpired ? 'Assignment expired' : 'Another assignment is in progress for this gym'}
                </p>
                <Badge variant="outline" className={`mb-3 ${pendingData.isExpired ? 'text-gray-600' : 'text-amber-600'}`}>
                  {pendingData.memberName} - {formatTime(Math.ceil((new Date(pendingData.expiresAt).getTime() - Date.now()) / 1000))}
                </Badge>
                <p className="text-xs text-amber-700 mb-3">
                  {pendingData.isExpired 
                    ? 'This assignment has expired. You can restart it or cancel to start a new one.'
                    : 'You must cancel the existing assignment before starting a new one.'}
                </p>
                <div className="flex gap-2 justify-center">
                  {pendingData.isExpired && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAssignCard}
                      disabled={assignCardMutation.isPending}
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      Restart Assignment
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                    className="text-amber-700 border-amber-300 hover:bg-amber-100"
                  >
                    <X className="w-3 h-3 mr-1" />
                    {pendingData.isExpired ? 'Cancel Expired Assignment' : `Cancel ${pendingData.memberName}'s Assignment`}
                  </Button>
                </div>
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
