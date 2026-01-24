'use client'

import { useState } from 'react'
import { PendingAssignment } from '@/lib/hooks/use-pending-assignments'
import { useCancelPendingAssignment, useRestartPendingReclaim } from '@/lib/hooks/use-pending-assignments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Clock, User, CreditCard, AlertTriangle, X, RefreshCw } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface PendingAssignmentBannerProps {
  pendingAssignments: PendingAssignment[]
  isLoading?: boolean
}

export function PendingAssignmentBanner({ pendingAssignments, isLoading }: PendingAssignmentBannerProps) {
  const [expanded, setExpanded] = useState(false)
  const cancelMutation = useCancelPendingAssignment()
  const restartMutation = useRestartPendingReclaim()

  if (isLoading) {
    return (
      <Card className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-amber-800 dark:text-amber-300">
              Loading pending assignments...
            </CardTitle>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (pendingAssignments.length === 0) {
    return null
  }

  const totalPending = pendingAssignments.length
  const activeAssignments = pendingAssignments.filter((pa) => !pa.isExpired)
  const expiredAssignments = pendingAssignments.filter((pa) => pa.isExpired)

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case 'ONBOARD': return 'New Card Assignment'
      case 'REPLACE': return 'Card Replacement'
      case 'RECLAIM': return 'Card Reclaim'
      default: return purpose
    }
  }

  const getActionButtonLabel = (purpose: string, isExpired: boolean) => {
    if (isExpired) {
      switch (purpose) {
        case 'ONBOARD': return 'Continue Card Assignment'
        case 'REPLACE': return 'Continue Card Replacement'
        case 'RECLAIM': return 'Continue Card Reclaim'
        default: return 'Continue'
      }
    }
    switch (purpose) {
      case 'ONBOARD': return 'Start Card Assignment'
      case 'REPLACE': return 'Start Card Replacement'
      case 'RECLAIM': return 'Start Card Reclaim'
      default: return 'Start'
    }
  }

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'ONBOARD': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'REPLACE': return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'RECLAIM': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPurposeIcon = (purpose: string) => {
    switch (purpose) {
      case 'ONBOARD': return <CreditCard className="h-4 w-4" />
      case 'REPLACE': return <CreditCard className="h-4 w-4" />
      case 'RECLAIM': return <CreditCard className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const handleCancel = (gymId: string) => {
    if (window.confirm('Cancel this pending assignment? The member will need to start over.')) {
      cancelMutation.mutate({ gymId })
    }
  }

  const handleRestart = (memberId: string, gymId: string) => {
    if (window.confirm('Restart the 10-minute reclaim timer?')) {
      restartMutation.mutate({ memberId, gymId })
    }
  }

  return (
    <Card className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
             <CardTitle className="text-amber-800 dark:text-amber-300">
               Pending Card Actions ({totalPending})
             </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-300"
          >
            {expanded ? 'Hide' : 'Show Details'}
          </Button>
        </div>
         <CardDescription className="text-amber-700 dark:text-amber-400">
           {activeAssignments.length > 0
             ? `${activeAssignments.length} active card action(s) waiting for tap`
             : `${expiredAssignments.length} expired card action(s) need attention`}
         </CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Active Assignments */}
          {activeAssignments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active ({activeAssignments.length})
              </h4>
              {activeAssignments.map((assignment) => (
                <Alert key={assignment.memberId} className="bg-white dark:bg-gray-800 border">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <AlertTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {assignment.memberName}
                      </AlertTitle>
                      <AlertDescription className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={getPurposeColor(assignment.purpose)}>
                            {getPurposeIcon(assignment.purpose)}
                            {getPurposeLabel(assignment.purpose)}
                          </Badge>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(assignment.expiresAt), { addSuffix: true })}
                          </Badge>
                          {assignment.expectedUidMasked && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                              Expected: {assignment.expectedUidMasked}
                            </Badge>
                          )}
                        </div>
                        {assignment.mismatch && (
                          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            Mismatch: Expected {assignment.mismatch.expectedUidMasked}, tapped {assignment.mismatch.tappedUidMasked}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(assignment.gymId)}
                      disabled={cancelMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {/* Expired Assignments */}
          {expiredAssignments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Expired ({expiredAssignments.length})
              </h4>
              {expiredAssignments.map((assignment) => (
                <Alert key={assignment.memberId} className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <AlertTitle className="flex items-center gap-2 text-red-800 dark:text-red-300">
                        <User className="h-4 w-4" />
                        {assignment.memberName}
                      </AlertTitle>
                      <AlertDescription className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={getPurposeColor(assignment.purpose)}>
                            {getPurposeIcon(assignment.purpose)}
                            {getPurposeLabel(assignment.purpose)}
                          </Badge>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            Expired {format(new Date(assignment.expiresAt), 'MMM d, h:mm a')}
                          </Badge>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-400">
                          This assignment expired. Clean up to allow new assignments.
                        </p>
                      </AlertDescription>
                    </div>
                    <div className="flex gap-2">
                      {assignment.purpose === 'RECLAIM' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestart(assignment.memberId, assignment.gymId)}
                          disabled={restartMutation.isPending}
                          className="text-amber-600 border-amber-300 hover:bg-amber-50"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Restart
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(assignment.gymId)}
                        disabled={cancelMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 p-3 rounded-md">
            <p className="font-medium mb-1">Instructions:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Member has 10 minutes to tap their card at the kiosk</li>
              <li>Only one pending assignment allowed per gym at a time</li>
              <li>Cancel expired assignments to free up the gym for new assignments</li>
              <li>For RECLAIM: Restart timer if member needs more time to return card</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  )
}