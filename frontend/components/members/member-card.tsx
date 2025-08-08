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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  useCustomerSubscription, 
  useCustomerTransactions,
  isSubscriptionExpired,
  getSubscriptionDaysRemaining 
} from '@/lib/hooks/use-customer-subscriptions'
import { useSoftDeleteUser } from '@/lib/hooks/use-users'
import { TransactionHistoryModal } from '@/components/modals/transaction-history-modal'
import { toast } from 'sonner'

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
  
  // Get current subscription and transaction data from new API
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } = useCustomerSubscription(member.id)
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useCustomerTransactions(member.id)
  
  // Soft delete user mutation
  const softDeleteUserMutation = useSoftDeleteUser()
  
  const isExpired = isSubscriptionExpired(subscription)
  const daysRemaining = getSubscriptionDaysRemaining(subscription)
  const lastTransaction = transactions?.[0] // Most recent transaction
  
  const handleDeleteMember = async () => {
    try {
      await softDeleteUserMutation.mutateAsync(member.id)
      toast.success(`Member ${memberName} has been removed successfully`)
      setShowDeleteModal(false)
    } catch (error: any) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member. Please try again.')
    }
  }
  
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
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => setShowDeleteModal(true)}
            >
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
      
      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Remove Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {memberName} from your gym? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Member Summary */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {memberName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold">{memberName}</h4>
                <p className="text-sm text-muted-foreground">{member.email}</p>
                {subscription && (
                  <p className="text-xs text-purple-600 font-medium">
                    Current Plan: {subscription.membershipPlan?.name || 'N/A'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> Removing this member will:
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                <li>Mark the member as inactive</li>
                <li>Remove them from the active members list</li>
                <li>Preserve all their data for record keeping</li>
                <li>Keep their transaction history intact</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)}
              disabled={softDeleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteMember}
              disabled={softDeleteUserMutation.isPending}
            >
              {softDeleteUserMutation.isPending ? (
                <>Removing...</>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
