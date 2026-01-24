'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Loader2, RefreshCw, Clock, X } from 'lucide-react'
import { membersApi } from '@/lib/api/gym-members'

interface ReplaceCardModalProps {
  isOpen: boolean
  onClose: () => void
  member: User | null
  onCardReplaced?: () => void
}

export function ReplaceCardModal({ isOpen, onClose, member, onCardReplaced }: ReplaceCardModalProps) {
  const [countdown, setCountdown] = useState(600) // 10 minutes in seconds
  const [isPolling, setIsPolling] = useState(false)
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

  // Replace card mutation
  const replaceCardMutation = useMutation({
    mutationFn: async () => {
      if (!member?.id) throw new Error('No member selected')
      return membersApi.replaceCard(member.id)
    },
    onSuccess: (data) => {
      console.log('Card replacement initiated, starting polling...')
      toast.success('Card replacement initiated! Member has 10 minutes to tap their new card.')
      setIsPolling(true)
      setCountdown(600) // Reset countdown
      // Invalidate banner query so it appears immediately
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] })
      // Force immediate refetch
      refetchPending()
      // Additional refetch after a short delay
      setTimeout(() => refetchPending(), 500)
    },
    onError: (error: any) => {
      toast.error(`Failed to replace card: ${error.message}`)
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
      toast.success('Card replacement cancelled')
      setIsPolling(false)
      // Invalidate all pending assignment queries
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['pending-assignment'] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel: ${error.message}`)
    }
  })

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPolling && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
    if (prev <= 1) {
      setIsPolling(false)
      toast.error('Replacement expired - member didn\'t tap card in time')
      // Invalidate pending assignments when replacement expires
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

  // Check if replacement was completed
  useEffect(() => {
    console.log('Modal state check:', { pendingData, isPolling, isFetching })
    if (!pendingData && isPolling && !isFetching) {
      // Pending assignment disappeared - either replaced or cancelled
      console.log('Replacement completed - closing modal')
      setIsPolling(false)
      toast.success('Card replaced successfully!')
      onCardReplaced?.()
      
      // Invalidate pending assignments when replacement completes
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] })
      
      // Refresh members data
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['gym-members'] })
      onClose()
    }
  }, [pendingData, isPolling, isFetching, onCardReplaced, onClose, queryClient])



  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPolling(false)
      setCountdown(600)
    }
  }, [isOpen])

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Expired'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleReplaceCard = () => {
    replaceCardMutation.mutate()
  }

  const handleCancel = () => {
    cancelMutation.mutate()
  }

  const handleClose = () => {
    if (isPolling) {
      // Warn user if closing while pending
      if (confirm('Card replacement is in progress. Close anyway?')) {
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
            <RefreshCw className="h-5 w-5 text-blue-500" />
            Replace Card
          </DialogTitle>
          <DialogDescription>
            Replace the RFID card for {memberName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
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
              <p className="text-sm text-muted-foreground mb-4">
                Click "Start Replacement" to begin the card replacement process. The old card will be permanently disabled.
              </p>
              <Badge variant="outline" className="text-blue-600">
                Ready to replace
              </Badge>
            </div>
          )}

          {isPolling && (
            <div className="text-center p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="font-medium text-foreground">Waiting for new card tap...</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Take the member to the physical kiosk location. They have <strong className="text-foreground">{formatTime(countdown)}</strong> to tap their new card on the kiosk screen.
              </p>
              <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 p-2 rounded border mt-2">
                <strong className="text-foreground">Important:</strong> The old card will be permanently disabled after replacement. Ensure the kiosk terminal is configured for the same gym as this member.
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Expires: {formatTime(countdown)}</span>
              </div>
            </div>
          )}

            {pendingData && !isPolling && (
              <div className="text-center p-4 border rounded-lg bg-amber-50 dark:bg-amber-950">
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                  {pendingData.isExpired ? 'Assignment expired' : 'Another assignment is in progress for this gym'}
                </p>
                <Badge variant="outline" className={`mb-3 ${pendingData.isExpired ? 'text-gray-600 dark:text-gray-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {pendingData.memberName} - {formatTime(Math.ceil((new Date(pendingData.expiresAt).getTime() - Date.now()) / 1000))}
                </Badge>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                  {pendingData.isExpired 
                    ? 'This assignment has expired. You can restart it or cancel to start a new one.'
                    : 'You must cancel the existing assignment before starting a new one.'}
                </p>
                <div className="flex gap-2 justify-center">
                  {pendingData.isExpired && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReplaceCard}
                      disabled={replaceCardMutation.isPending}
                      className="text-green-700 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                    >
                      Restart Replacement
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                    className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900"
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
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  console.log('Manual close triggered')
                  setIsPolling(false)
                  onCardReplaced?.()
                  onClose()
                }}
              >
                Force Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Replacement
              </Button>
            </>
          )}

          {!isPolling && !pendingData && (
            <Button
              onClick={handleReplaceCard}
              disabled={replaceCardMutation.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {replaceCardMutation.isPending ? 'Starting...' : 'Start Replacement'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
