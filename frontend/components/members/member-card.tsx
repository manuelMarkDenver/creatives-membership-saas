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
  Trash2,
  History,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  useSoftDeleteUser, 
  useActivateUser, 
  useDeactivateUser, 
  useRestoreUser 
} from '@/lib/hooks/use-users'
import { useMemberStatus } from '@/lib/hooks/use-member-actions'
import { TransactionHistoryModal } from '@/components/modals/transaction-history-modal'
import { MemberActionsModal, type MemberActionType } from '@/components/modals/member-actions-modal'
import { MemberHistoryModal } from '@/components/modals/member-history-modal'
import { toast } from 'sonner'

interface MemberCardProps {
  member: User
  isSuperAdmin?: boolean
  onViewMemberInfo: (member: User) => void
  onViewTransactions: (member: User) => void
  onRenewSubscription: (member: User) => void
  onCancelSubscription: (member: User) => void
  onMemberDeleted?: () => void
}

export function MemberCard({
  member,
  isSuperAdmin = false,
  onViewMemberInfo,
  onViewTransactions,
  onRenewSubscription,
  onCancelSubscription,
  onMemberDeleted
}: MemberCardProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  // New member management modals
  const [showMemberActionsModal, setShowMemberActionsModal] = useState(false)
  const [currentAction, setCurrentAction] = useState<MemberActionType>('activate')
  const [showMemberHistoryModal, setShowMemberHistoryModal] = useState(false)
  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
  
  // Get member status from new API
  const { data: memberStatus, isLoading: statusLoading, error: statusError } = useMemberStatus(member.id)
  
  // User status mutations
  const softDeleteUserMutation = useSoftDeleteUser()
  const activateUserMutation = useActivateUser()
  const deactivateUserMutation = useDeactivateUser()
  const restoreUserMutation = useRestoreUser()
  
  // Get subscription info from member status
  const subscription = memberStatus?.subscription
  const isExpired = subscription && new Date(subscription.endDate) < new Date()
  const daysRemaining = subscription ? Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
  
  // Check if member is deleted/inactive
  const isDeleted = !member.isActive || member.deletedAt
  
  const handleDeleteMember = async () => {
    try {
      await softDeleteUserMutation.mutateAsync(member.id)
      toast.success(`Member ${memberName} has been removed successfully`)
      setShowDeleteModal(false)
      // Call the refresh callback if provided
      if (onMemberDeleted) {
        onMemberDeleted()
      }
    } catch (error: any) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member. Please try again.')
    }
  }

  const handleActivateMember = async () => {
    try {
      await activateUserMutation.mutateAsync(member.id)
      toast.success(`Member ${memberName} has been activated successfully`)
      setShowActivateModal(false)
      if (onMemberDeleted) {
        onMemberDeleted()
      }
    } catch (error: any) {
      console.error('Error activating member:', error)
      toast.error('Failed to activate member. Please try again.')
    }
  }

  const handleDeactivateMember = async () => {
    try {
      await deactivateUserMutation.mutateAsync(member.id)
      toast.success(`Member ${memberName} has been deactivated successfully`)
      setShowDeactivateModal(false)
      if (onMemberDeleted) {
        onMemberDeleted()
      }
    } catch (error: any) {
      console.error('Error deactivating member:', error)
      toast.error('Failed to deactivate member. Please try again.')
    }
  }

  const handleRestoreMember = async () => {
    try {
      await restoreUserMutation.mutateAsync(member.id)
      toast.success(`Member ${memberName} has been restored successfully`)
      setShowRestoreModal(false)
      if (onMemberDeleted) {
        onMemberDeleted()
      }
    } catch (error: any) {
      console.error('Error restoring member:', error)
      toast.error('Failed to restore member. Please try again.')
    }
  }

  // Helper function to open member action modal
  const openMemberActionModal = (action: MemberActionType) => {
    const currentState = getMemberStatus();
    console.log(`[DEBUG] Opening modal for member ${member.id} (${memberName}) - currentState: ${currentState}, action: ${action}`);
    setCurrentAction(action)
    setShowMemberActionsModal(true)
  }

  // Helper function to determine member status for actions
  const getMemberStatus = () => {
    // Use the actual currentState from member status API if available
    if (memberStatus?.currentState) {
      console.log(`[DEBUG] Member ${member.id} (${memberName}) - API currentState:`, memberStatus.currentState);
      return memberStatus.currentState
    }
    
    // Fallback to computed status
    const computedStatus = (() => {
      if (isDeleted) return 'DELETED'
      if (isExpired) return 'EXPIRED'
      if (subscription && !isExpired) return 'ACTIVE'
      return 'INACTIVE'
    })();
    
    console.log(`[DEBUG] Member ${member.id} (${memberName}) - Computed status:`, computedStatus, {
      isDeleted,
      isExpired, 
      hasSubscription: !!subscription,
      memberStatusLoading: statusLoading,
      memberStatusError: statusError
    });
    
    return computedStatus;
  }
  
  // Helper function to determine the appropriate action based on member state
  const getAppropriateAction = (): MemberActionType => {
    const currentState = getMemberStatus()
    
    switch (currentState) {
      case 'CANCELLED':
        return 'activate' // Cancelled members can be activated
      case 'EXPIRED':
        return 'renew' // Expired members need renewal
      case 'DELETED':
        return 'restore' // Deleted members can be restored
      case 'ACTIVE':
        return 'cancel' // Active members can be cancelled
      case 'INACTIVE':
      default:
        return 'activate' // Default to activate for inactive members
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
          {statusLoading ? (
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
              {/* Note: Transaction history would need separate API call if needed */}
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-red-500">No active subscription</div>
              <div className="text-xs text-muted-foreground">
                No payment history available
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Status Button - considers both subscription expiry AND member state */}
        {(() => {
          const currentState = getMemberStatus();
          
          // No subscription case
          if (!subscription || typeof subscription !== 'object' || !subscription.id) {
            return (
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
                onClick={() => onRenewSubscription(member)}
              >
                Start Subscription
              </Button>
            )
          }
          
          // Handle different member states
          switch (currentState) {
            case 'CANCELLED':
              return (
                <Button
                  variant="destructive"
                  size="sm"
                  className="hover:bg-red-600"
                  onClick={() => openMemberActionModal('activate')}
                >
                  Cancelled
                </Button>
              )
              
            case 'EXPIRED':
              return (
                <Button
                  variant="destructive"
                  size="sm"
                  className="hover:bg-red-600"
                  onClick={() => onRenewSubscription(member)}
                >
                  Expired
                </Button>
              )
              
            case 'ACTIVE':
              return (
                <Button
                  variant="default"
                  size="sm"
                  className="hover:bg-green-600"
                  onClick={() => onCancelSubscription(member)}
                >
                  Active
                </Button>
              )
              
            case 'DELETED':
              return (
                <Button
                  variant="secondary"
                  size="sm"
                  className="hover:bg-gray-600"
                  onClick={() => openMemberActionModal('restore')}
                >
                  Deleted
                </Button>
              )
              
            case 'INACTIVE':
            default:
              return (
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
                  onClick={() => openMemberActionModal('activate')}
                >
                  Inactive
                </Button>
              )
          }
        })()}
        
        {/* Deleted status badge */}
        {isDeleted && (
          <Badge variant="destructive" className="text-xs">
            Deleted
          </Badge>
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
            {/* Basic Info */}
            <DropdownMenuItem onClick={() => onViewMemberInfo(member)}>
              <Users className="mr-2 h-4 w-4" />
              Member Information
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowTransactionModal(true)}>
              <Receipt className="mr-2 h-4 w-4" />
              Transaction History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowMemberHistoryModal(true)}>
              <History className="mr-2 h-4 w-4" />
              Member History
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Member Actions - Use state-based logic */}
            {(() => {
              const currentState = getMemberStatus()
              const appropriateAction = getAppropriateAction()
              
              switch (currentState) {
                case 'DELETED':
                  return (
                    <DropdownMenuItem 
                      className="text-blue-600"
                      onClick={() => openMemberActionModal('restore')}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Restore Member
                    </DropdownMenuItem>
                  )
                
                case 'CANCELLED':
                  return (
                    <DropdownMenuItem 
                      className="text-green-600"
                      onClick={() => openMemberActionModal('activate')}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activate Member
                    </DropdownMenuItem>
                  )
                
                case 'EXPIRED':
                  return (
                    <DropdownMenuItem 
                      className="text-purple-600"
                      onClick={() => openMemberActionModal('renew')}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Renew Membership
                    </DropdownMenuItem>
                  )
                
                case 'ACTIVE':
                  return (
                    <DropdownMenuItem 
                      className="text-orange-600"
                      onClick={() => openMemberActionModal('cancel')}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Cancel Membership
                    </DropdownMenuItem>
                  )
                
                case 'INACTIVE':
                default:
                  return (
                    <DropdownMenuItem 
                      className="text-green-600"
                      onClick={() => openMemberActionModal('activate')}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activate Member
                    </DropdownMenuItem>
                  )
              }
            })()}
            
            <DropdownMenuSeparator />
            
            {/* General Actions */}
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
      
      {/* Member Actions Modal */}
      <MemberActionsModal
        isOpen={showMemberActionsModal}
        onClose={() => setShowMemberActionsModal(false)}
        memberId={member.id}
        actionType={currentAction}
        onActionComplete={() => {
          // Refresh member data after action
          if (onMemberDeleted) {
            onMemberDeleted()
          }
        }}
      />
      
      {/* Member History Modal */}
      <MemberHistoryModal
        isOpen={showMemberHistoryModal}
        onClose={() => setShowMemberHistoryModal(false)}
        memberId={member.id}
        memberName={memberName}
      />
    </div>
  )
}
