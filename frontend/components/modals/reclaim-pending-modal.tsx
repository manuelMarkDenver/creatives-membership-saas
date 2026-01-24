'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Clock, X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { membersApi } from '@/lib/api/gym-members'

interface ReclaimPendingModalProps {
  gymId: string
  memberName: string
  initialExpiresAt?: string
  isOpen: boolean
  onClose: () => void
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`
}

export function ReclaimPendingModal({
  gymId,
  memberName,
  initialExpiresAt,
  isOpen,
  onClose,
}: ReclaimPendingModalProps) {
  const queryClient = useQueryClient()
  const [countdown, setCountdown] = useState(0)
  const [stopRequested, setStopRequested] = useState(false)
  const stopRef = useRef(false)
  const lastExpiresRef = useRef<number | null>(
    initialExpiresAt ? new Date(initialExpiresAt).getTime() : null,
  )
  const pendingPresentRef = useRef(false)

  const { data: pendingData, isFetching } = useQuery({
    queryKey: ['pending-assignment', gymId],
    queryFn: () => membersApi.getPendingAssignment(gymId),
    enabled: isOpen && !!gymId,
    refetchInterval: isOpen ? 1500 : false,
    retry: false,
  })

  useEffect(() => {
    if (pendingData?.expiresAt) {
      lastExpiresRef.current = new Date(pendingData.expiresAt).getTime()
    }
  }, [pendingData?.expiresAt])

  const expiryTimestamp = useMemo(() => {
    if (pendingData?.expiresAt) {
      return new Date(pendingData.expiresAt).getTime()
    }
    return lastExpiresRef.current
  }, [pendingData?.expiresAt])

  useEffect(() => {
    if (!isOpen || !expiryTimestamp) return

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((expiryTimestamp - Date.now()) / 1000))
      setCountdown(remaining)
    }

    updateCountdown()
    const interval = window.setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [isOpen, expiryTimestamp])

  useEffect(() => {
    if (!isOpen) {
      pendingPresentRef.current = false
      stopRef.current = false
      setStopRequested(false)
      return
    }

    if (pendingData) {
      pendingPresentRef.current = true
      return
    }

    if (!pendingPresentRef.current) {
      return
    }

    const wasStopping = stopRef.current
    stopRef.current = false
    pendingPresentRef.current = false
    setStopRequested(false)

    const expired = lastExpiresRef.current ? Date.now() > lastExpiresRef.current : false

    if (wasStopping || expired) {
      toast.info('Reclaim stopped')
    } else {
      toast.success('Card reclaimed (reusable)')
    }

    onClose()
  }, [pendingData, isOpen, onClose])

  const stopMutation = useMutation({
    mutationFn: () => membersApi.cancelPendingAssignment(gymId),
    onSuccess: () => {
      stopRef.current = true
      setStopRequested(true)
      queryClient.invalidateQueries({ queryKey: ['pending-assignment', gymId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to stop reclaim')
    },
  })

  const handleStopReclaim = () => {
    if (stopMutation.isPending) return
    stopMutation.mutate()
  }

  const mismatchMessage = pendingData?.mismatch
    ? `Last tap from ${pendingData.mismatch.tappedUidMasked || 'a card'} didn't match the expected card ${pendingData.mismatch.expectedUidMasked || ''}.`
    : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            Waiting for returned card tap...
          </DialogTitle>
          <DialogDescription>
            Reclaim pending for {memberName}. Tap the returned card on the kiosk to mark it as available again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between border rounded-lg p-4 bg-purple-50">
            <div>
              <p className="text-sm text-purple-800">Expires in</p>
              <p className="text-2xl font-semibold text-purple-900">
                {formatTime(countdown)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <Clock className="h-4 w-4" />
              Stay near the kiosk and have the member tap the card
            </div>
          </div>

          <div className="text-sm text-slate-600">
            <p>
              The kiosk will verify the returned card. This modal will close automatically once the tap is accepted or the pending assignment is cancelled or expired.
            </p>
          </div>

          {mismatchMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
              <p className="font-semibold">Mismatch detected</p>
              <p>{mismatchMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={stopMutation.isPending}>
            Close
          </Button>
          <Button
            variant="destructive"
            onClick={handleStopReclaim}
            disabled={stopMutation.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Stop reclaim (card not returned)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
