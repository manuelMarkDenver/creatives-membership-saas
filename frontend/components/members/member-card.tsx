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
  Info,
  Building,
  Eye,
  Lock
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
  useProfile,
  useSoftDeleteUser,
  useActivateUser,
  useDeactivateUser,
  useRestoreUser
} from '@/lib/hooks/use-users'
import { TransactionHistoryModal } from '@/components/modals/transaction-history-modal'
import { MemberActionsModal, type MemberActionType } from '@/components/modals/member-actions-modal'
import { MemberHistoryModal } from '@/components/modals/member-history-modal'
import { DeleteMemberModal } from '@/components/modals/delete-member-modal'
import { RestoreMemberModal } from '@/components/modals/restore-member-modal'
import { toast } from 'sonner'
import { calculateMemberStatus, getAvailableMemberActions, type MemberData } from '@/lib/utils/member-status'

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
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  // New member management modals
  const [showMemberActionsModal, setShowMemberActionsModal] = useState(false)
  const [currentAction, setCurrentAction] = useState<MemberActionType>('activate')
  const [showMemberHistoryModal, setShowMemberHistoryModal] = useState(false)
  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
  
  // Get current user profile for branch permissions
  const { data: profile } = useProfile()
  
  // User mutations (universal user management)
  const softDeleteMutation = useSoftDeleteUser()
  const activateMutation = useActivateUser()
  const deactivateMutation = useDeactivateUser()
  const restoreMutation = useRestoreUser()
  
  // Get subscription info from member customerSubscriptions
  const subscription = member.customerSubscriptions?.[0] // Get most recent subscription
  const isExpired = subscription && new Date(subscription.endDate) < new Date()
  const daysRemaining = subscription ? Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
  
  // Check if member is deleted/inactive  
  const isDeleted = !member.isActive || member.deletedAt
  const isInactive = member.isActive && !member.deletedAt && !subscription

  // These handlers are no longer used - actions go through MemberActionsModal
  const handleActivateMember = async () => {
    // Redirect to member actions modal
    openMemberActionModal('activate')
  }

  const handleDeactivateMember = async () => {
    // Redirect to member actions modal  
    openMemberActionModal('cancel')
  }

  const handleRestoreMember = async () => {
    // Redirect to member actions modal
    openMemberActionModal('restore')
  }

  // Helper function to open member action modal
  const openMemberActionModal = (action: MemberActionType) => {
    setCurrentAction(action)
    setShowMemberActionsModal(true)
  }

  // Use our new status calculation utility
  const memberStatus = calculateMemberStatus(member as MemberData)
  const getMemberStatus = () => {
    return memberStatus.displayStatus
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
  
  // Helper function to get member's branch ID from subscription
  const getMemberBranchId = (): string | null => {
    return member.customerSubscriptions?.[0]?.branchId || null
  }

  // Helper function to check if current user can manage this member based on branch access
  const canManageMember = (): boolean => {
    // Super admin and owners can manage all members
    if (isSuperAdmin || profile?.role === 'SUPER_ADMIN' || profile?.role === 'OWNER') {
      return true
    }
    
    // For managers and staff, check if they have access to the member's branch
    if (profile?.userBranches && profile.userBranches.length > 0) {
      const memberBranchId = getMemberBranchId()
      
      // If member has no branchId, they can be managed by anyone in the tenant
      if (!memberBranchId) {
        return true
      }
      
      // Check if user has access to the member's branch
      return profile.userBranches.some((ub: any) => ub.branchId === memberBranchId)
    }
    
    // Default: if no branch restrictions, allow management
    return true
  }
  
  // Helper function to render an action that requires management permissions
  const renderManagedAction = (action: () => void, children: React.ReactNode, canManage: boolean = canManageMember()) => {
    if (!canManage) {
      // Return a disabled/read-only version
      return (
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>View Only - Different Branch</span>
        </div>
      )
    }
    return children
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
          {(subscription && typeof subscription === 'object' && subscription.id) ? (
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
          const canManage = canManageMember();
          
          // No subscription case
          if (!subscription || typeof subscription !== 'object' || !subscription.id) {
            return (
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
                onClick={() => canManage ? onRenewSubscription(member) : toast.info('You can only manage members from your assigned branches')}
                disabled={!canManage}
              >
                {canManage ? 'Start Subscription' : 'View Only'}
              </Button>
            )
          }
          
          // Handle different member states
          switch (currentState) {
            case 'CANCELLED':
              return (
                <Button
                  variant="outline"
                  size="sm"
                  className={canManage ? "bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600 hover:border-yellow-600 dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-500 dark:hover:text-black dark:border-yellow-400 dark:hover:border-yellow-500" : "bg-yellow-200 text-yellow-800 border-yellow-300"}
                  onClick={() => canManage ? openMemberActionModal('activate') : toast.info('You can only manage members from your assigned branches')}
                  disabled={!canManage}
                >
                  {canManage ? 'Cancelled' : 'Cancelled (View Only)'}
                </Button>
              )
              
            case 'EXPIRED':
              return (
                <Button
                  variant={canManage ? "destructive" : "outline"}
                  size="sm"
                  className={canManage ? "hover:bg-red-600" : "bg-red-100 text-red-800 border-red-300"}
                  onClick={() => canManage ? onRenewSubscription(member) : toast.info('You can only manage members from your assigned branches')}
                  disabled={!canManage}
                >
                  {canManage ? 'Expired' : 'Expired (View Only)'}
                </Button>
              )
              
            case 'ACTIVE':
              return (
                <Button
                  variant="outline"
                  size="sm"
                  className={canManage ? "bg-green-500 text-white border-green-500 hover:bg-green-600 hover:border-green-600 dark:bg-green-400 dark:text-black dark:hover:bg-green-500 dark:hover:text-black dark:border-green-400 dark:hover:border-green-500" : "bg-green-100 text-green-800 border-green-300"}
                  onClick={() => canManage ? onCancelSubscription(member) : toast.info('You can only manage members from your assigned branches')}
                  disabled={!canManage}
                >
                  {canManage ? 'Active' : 'Active (View Only)'}
                </Button>
              )
              
            case 'DELETED':
              return (
                <Button
                  variant={canManage ? "destructive" : "outline"}
                  size="sm"
                  className={canManage ? "bg-red-500 text-white hover:bg-red-600" : "bg-red-100 text-red-800 border-red-300"}
                  onClick={() => {
                    if (!canManage) {
                      toast.info('You can only manage members from your assigned branches')
                      return
                    }
                    setShowRestoreModal(true)
                  }}
                  disabled={!canManage}
                >
                  {canManage ? 'Deleted' : 'Deleted (View Only)'}
                </Button>
              )
              
            case 'INACTIVE':
            default:
              return (
                <Button
                  variant="outline"
                  size="sm"
                  className={canManage ? "hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700" : "bg-gray-100 text-gray-600 border-gray-300"}
                  onClick={() => canManage ? openMemberActionModal('activate') : toast.info('You can only manage members from your assigned branches')}
                  disabled={!canManage}
                >
                  {canManage ? 'Inactive' : 'Inactive (View Only)'}
                </Button>
              )
          }
        })()}
        
        
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
            
            {/* Member Actions - Use state-based logic with branch permissions */}
            {(() => {
              const currentState = getMemberStatus()
              const appropriateAction = getAppropriateAction()
              const canManage = canManageMember()
              
              // If user cannot manage this member, show a disabled item
              if (!canManage) {
                return (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    <Lock className="mr-2 h-4 w-4" />
                    View Only - Different Branch
                  </DropdownMenuItem>
                )
              }
              
              switch (currentState) {
                case 'DELETED':
                  return (
                    <DropdownMenuItem 
                      className="text-blue-600"
                      onClick={() => setShowRestoreModal(true)}
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
            
            {/* General Actions - with branch permissions */}
            {canManageMember() ? (
              <DropdownMenuItem onClick={() => onViewMemberInfo(member)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Member
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onViewMemberInfo(member)}>
                <Eye className="mr-2 h-4 w-4" />
                View Member Details
              </DropdownMenuItem>
            )}
            
            {/* Show Delete Member option only for non-deleted members */}
            {canManageMember() && getMemberStatus() !== 'DELETED' && (
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Member
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Transaction History Modal */}
      <TransactionHistoryModal 
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        member={member}
      />
      
      {/* Delete Member Modal with Reason */}
      <DeleteMemberModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        member={member}
        onDeleteComplete={() => {
          setShowDeleteModal(false)
          if (onMemberDeleted) {
            onMemberDeleted()
          }
        }}
      />
      
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
      
      {/* Restore Member Modal */}
      <RestoreMemberModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        member={member}
        onRestoreComplete={() => {
          setShowRestoreModal(false)
          if (onMemberDeleted) {
            onMemberDeleted()
          }
        }}
      />
    </div>
  )
}
