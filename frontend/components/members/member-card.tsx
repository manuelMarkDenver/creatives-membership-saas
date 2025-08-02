'use client'

import { useState } from 'react'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  MoreHorizontal, 
  Users, 
  Receipt, 
  Edit, 
  Trash2 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  useCustomerSubscription, 
  useCustomerTransactions,
  isSubscriptionExpired,
  getSubscriptionDaysRemaining 
} from '@/lib/hooks/use-customer-subscriptions'
import { TransactionHistoryModal } from '@/components/modals/transaction-history-modal'

interface MemberCardProps {
  member: User
  isSuperAdmin?: boolean
  onViewMemberInfo: (member: User) => void
  onViewTransactions: (member: User) => void
  onRenewSubscription: (member: User) => void
  onCancelSubscription: (member: User) => void
}

export function MemberCard({
  member,
  isSuperAdmin = false,
  onViewMemberInfo,
  onViewTransactions,
  onRenewSubscription,
  onCancelSubscription
}: MemberCardProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
  
  // Get current subscription and transaction data from new API
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } = useCustomerSubscription(member.id)
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useCustomerTransactions(member.id)
  
  
  const isExpired = isSubscriptionExpired(subscription)
  const daysRemaining = getSubscriptionDaysRemaining(subscription)
  const lastTransaction = transactions?.[0] // Most recent transaction
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        {/* Member Photo */}
        <div className="relative">
          {member.photoUrl ? (
            <img 
              src={member.photoUrl} 
              alt={memberName}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {memberName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold">{memberName}</h4>
          <p className="text-sm text-muted-foreground">{member.email}</p>
          {member.phoneNumber && (
            <p className="text-xs text-muted-foreground">{member.phoneNumber}</p>
          )}
          
          {/* Subscription Information */}
          {subscriptionLoading ? (
            <div className="mt-2 text-xs text-muted-foreground">Loading subscription...</div>
          ) : (subscription && typeof subscription === 'object' && subscription.id) ? (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-purple-600">
                  {subscription.membershipPlan.name}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium text-green-600">
                  ₱{subscription.price.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(subscription.startDate).toLocaleDateString()} - {' '}
                  {new Date(subscription.endDate).toLocaleDateString()}
                </span>
                {!isExpired && daysRemaining > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">{daysRemaining} days left</span>
                  </>
                )}
              </div>
              {lastTransaction && (
                <div className="text-xs text-muted-foreground">
                  Last payment: ₱{lastTransaction.amount.toLocaleString()} 
                  ({new Date(lastTransaction.createdAt).toLocaleDateString()})
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-red-500">No active subscription</div>
              <div className="text-xs text-muted-foreground">
                {lastTransaction ? (
                  `Last payment: ₱${(typeof lastTransaction.amount === 'string' ? parseFloat(lastTransaction.amount) : lastTransaction.amount).toLocaleString()} (${new Date(lastTransaction.createdAt).toLocaleDateString()})`
                ) : (
                  'Never made a payment'
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Active/Expired Status Button or Start Subscription */}
        {(subscription && typeof subscription === 'object' && subscription.id) ? (
          <Button
            variant={isExpired ? "destructive" : "default"}
            size="sm"
            className={isExpired ? "hover:bg-red-600" : "hover:bg-green-600"}
            onClick={() => {
              if (isExpired) {
                onRenewSubscription(member)
              } else {
                onCancelSubscription(member)
              }
            }}
          >
            {isExpired ? 'Expired' : 'Active'}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
            onClick={() => onRenewSubscription(member)}
          >
            Start Subscription
          </Button>
        )}
        
        {/* Additional info badges for super admin */}
        {isSuperAdmin && member.tenant && (
          <Badge variant="outline" className="text-xs">
            {member.tenant.name}
          </Badge>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewMemberInfo(member)}>
              <Users className="mr-2 h-4 w-4" />
              Member Information
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowTransactionModal(true)}>
              <Receipt className="mr-2 h-4 w-4" />
              Transaction History
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Member
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Transaction History Modal */}
      <TransactionHistoryModal 
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        member={member}
      />
    </div>
  )
}
