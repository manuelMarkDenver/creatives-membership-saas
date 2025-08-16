'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  History, 
  User, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  CreditCard,
  Settings,
  AlertCircle,
  Clock
} from 'lucide-react'
import { useMemberHistory } from '@/lib/hooks/use-member-actions'
import type { MemberHistoryQuery } from '@/lib/api/members'
import { format } from 'date-fns'

interface MemberHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
}

const actionIcons = {
  ACCOUNT_CREATED: UserPlus,
  ACCOUNT_ACTIVATED: UserCheck,
  ACCOUNT_DEACTIVATED: UserX,
  ACCOUNT_DELETED: AlertCircle,
  ACCOUNT_RESTORED: UserCheck,
  SUBSCRIPTION_STARTED: CreditCard,
  SUBSCRIPTION_RENEWED: RefreshCw,
  SUBSCRIPTION_CANCELLED: UserX,
  SUBSCRIPTION_EXPIRED: Clock,
  SUBSCRIPTION_SUSPENDED: UserX,
  SUBSCRIPTION_RESUMED: UserCheck,
  PAYMENT_RECEIVED: CreditCard,
  PAYMENT_FAILED: AlertCircle,
  PAYMENT_REFUNDED: RefreshCw,
  PROFILE_UPDATED: Settings,
  PROFILE_PHOTO_UPDATED: User,
  FACILITY_ACCESS_GRANTED: UserCheck,
  FACILITY_ACCESS_REVOKED: UserX,
  LOGIN_SUCCESSFUL: UserCheck,
  LOGIN_FAILED: AlertCircle,
}

const actionColors = {
  ACCOUNT_CREATED: 'text-green-600 bg-green-50 border-green-200',
  ACCOUNT_ACTIVATED: 'text-green-600 bg-green-50 border-green-200',
  ACCOUNT_DEACTIVATED: 'text-red-600 bg-red-50 border-red-200',
  ACCOUNT_DELETED: 'text-gray-600 bg-gray-50 border-gray-200',
  ACCOUNT_RESTORED: 'text-blue-600 bg-blue-50 border-blue-200',
  SUBSCRIPTION_STARTED: 'text-purple-600 bg-purple-50 border-purple-200',
  SUBSCRIPTION_RENEWED: 'text-green-600 bg-green-50 border-green-200',
  SUBSCRIPTION_CANCELLED: 'text-red-600 bg-red-50 border-red-200',
  SUBSCRIPTION_EXPIRED: 'text-orange-600 bg-orange-50 border-orange-200',
  SUBSCRIPTION_SUSPENDED: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  SUBSCRIPTION_RESUMED: 'text-green-600 bg-green-50 border-green-200',
  PAYMENT_RECEIVED: 'text-green-600 bg-green-50 border-green-200',
  PAYMENT_FAILED: 'text-red-600 bg-red-50 border-red-200',
  PAYMENT_REFUNDED: 'text-orange-600 bg-orange-50 border-orange-200',
  PROFILE_UPDATED: 'text-blue-600 bg-blue-50 border-blue-200',
  PROFILE_PHOTO_UPDATED: 'text-blue-600 bg-blue-50 border-blue-200',
  FACILITY_ACCESS_GRANTED: 'text-green-600 bg-green-50 border-green-200',
  FACILITY_ACCESS_REVOKED: 'text-red-600 bg-red-50 border-red-200',
  LOGIN_SUCCESSFUL: 'text-green-600 bg-green-50 border-green-200',
  LOGIN_FAILED: 'text-red-600 bg-red-50 border-red-200',
}

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'ACCOUNT', label: 'Account Actions' },
  { value: 'SUBSCRIPTION', label: 'Subscription Actions' },
  { value: 'PAYMENT', label: 'Payment Actions' },
  { value: 'PROFILE', label: 'Profile Actions' },
  { value: 'ACCESS', label: 'Access Actions' },
  { value: 'LOGIN', label: 'Login Actions' },
]

export function MemberHistoryModal({
  isOpen,
  onClose,
  memberId,
  memberName
}: MemberHistoryModalProps) {
  const [query, setQuery] = useState<MemberHistoryQuery>({
    page: 1,
    limit: 10,
    category: undefined,
    startDate: '',
    endDate: '',
  })

  const { data: historyData, isLoading, error } = useMemberHistory(memberId, query)

  const updateQuery = (updates: Partial<MemberHistoryQuery>) => {
    setQuery(prev => ({ ...prev, ...updates, page: 1 })) // Reset to page 1 when filtering
  }

  const changePage = (page: number) => {
    setQuery(prev => ({ ...prev, page }))
  }

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            Member History - {memberName}
          </DialogTitle>
          <DialogDescription>
            Complete audit trail of all actions and events for this member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex-1">
              <Label className="text-xs font-medium text-gray-600">Category</Label>
              <Select value={query.category || 'all'} onValueChange={(value) => updateQuery({ category: value === 'all' ? undefined : value as any })}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label className="text-xs font-medium text-gray-600">Start Date</Label>
              <Input
                type="date"
                value={query.startDate || ''}
                onChange={(e) => updateQuery({ startDate: e.target.value })}
                className="h-8"
              />
            </div>
            
            <div className="flex-1">
              <Label className="text-xs font-medium text-gray-600">End Date</Label>
              <Input
                type="date"
                value={query.endDate || ''}
                onChange={(e) => updateQuery({ endDate: e.target.value })}
                className="h-8"
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuery({ page: 1, limit: 10, category: undefined, startDate: '', endDate: '' })}
                className="h-8"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* History List */}
          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-center">
                  <History className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Loading member history...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                Failed to load member history
              </div>
            ) : !historyData?.logs || historyData.logs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <History className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No history found</p>
                  <p className="text-xs text-gray-500">
                    {query.category || query.startDate || query.endDate 
                      ? 'Try adjusting your filters'
                      : 'This member has no recorded history yet'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto">
                  {historyData.logs.map((entry) => {
                    const ActionIcon = actionIcons[entry.action as keyof typeof actionIcons] || History
                    const actionStyle = actionColors[entry.action as keyof typeof actionColors] || 'text-gray-600 bg-gray-50 border-gray-200'
                    
                    return (
                      <div key={entry.id} className="border-b border-gray-100 last:border-0">
                        <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900">
                          <div className="flex items-start gap-3">
                            {/* Action Icon */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full border ${actionStyle} flex items-center justify-center`}>
                              <ActionIcon className="h-4 w-4" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {formatActionName(entry.action)}
                                </h4>
                                <time className="text-xs text-gray-500">
                                  {format(new Date(entry.performedAt), 'MMM dd, yyyy HH:mm')}
                                </time>
                              </div>
                              
                              {/* Details */}
                              <div className="space-y-1">
                                {entry.reason && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Reason:</span> {entry.reason}
                                  </p>
                                )}
                                
                                {entry.notes && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Notes:</span> {entry.notes}
                                  </p>
                                )}
                                
                                {(entry.previousState || entry.newState) && (
                                  <div className="flex items-center gap-2 text-xs">
                                    {entry.previousState && (
                                      <Badge variant="outline" className="text-gray-600">
                                        From: {entry.previousState}
                                      </Badge>
                                    )}
                                    {entry.previousState && entry.newState && (
                                      <span className="text-gray-400">→</span>
                                    )}
                                    {entry.newState && (
                                      <Badge variant="outline" className="text-blue-600">
                                        To: {entry.newState}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                
                                {/* Performer info */}
                                {entry.performer && (
                                  <p className="text-xs text-gray-500">
                                    <User className="inline h-3 w-3 mr-1" />
                                    Performed by: {entry.performer.firstName} {entry.performer.lastName} ({entry.performer.email})
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {historyData.pagination && historyData.pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">
                        Showing {((historyData.pagination.page - 1) * historyData.pagination.limit) + 1} to{' '}
                        {Math.min(historyData.pagination.page * historyData.pagination.limit, historyData.pagination.total)} of{' '}
                        {historyData.pagination.total} entries
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(historyData.pagination.page - 1)}
                        disabled={historyData.pagination.page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, historyData.pagination.pages) }, (_, i) => {
                          const pageNum = i + 1
                          const isActive = pageNum === historyData.pagination.page
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              onClick={() => changePage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                        
                        {historyData.pagination.pages > 5 && (
                          <>
                            <span className="text-sm text-gray-400">...</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => changePage(historyData.pagination.pages)}
                              className="w-8 h-8 p-0"
                            >
                              {historyData.pagination.pages}
                            </Button>
                          </>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(historyData.pagination.page + 1)}
                        disabled={historyData.pagination.page >= historyData.pagination.pages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
