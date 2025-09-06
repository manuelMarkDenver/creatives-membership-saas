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
} from '@/lib/hooks/use-gym-users'
import { TransactionHistoryModal } from '@/components/modals/transaction-history-modal'
import { MemberActionsModal, type MemberActionType } from '@/components/modals/member-actions-modal'
import { MemberHistoryModal } from '@/components/modals/member-history-modal'
import { DeleteMemberModal } from '@/components/modals/delete-member-modal'
import { RestoreMemberModal } from '@/components/modals/restore-member-modal'
import { toast } from 'sonner'
import { calculateMemberStatus, getAvailableMemberActions, type MemberData } from '@/lib/utils/member-status'
import { getMemberStatusDisplay, getAvailableActions, getStatusColorClasses } from '@/lib/utils/member-status-display'

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
  const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Unknown'
  
  // Get current user profile for branch permissions
  const { data: profile } = useProfile()
  
  // User mutations (universal user management)
  const softDeleteMutation = useSoftDeleteUser()
  const activateMutation = useActivateUser()
  const deactivateMutation = useDeactivateUser()
  const restoreMutation = useRestoreUser()
  
  // Get subscription info from member gymSubscriptions (most recent subscription)
  const subscriptions = member.gymSubscriptions?.sort((a, b) => {
    const aCreated = new Date(a.createdAt || a.startDate).getTime()
    const bCreated = new Date(b.createdAt || b.startDate).getTime()
    return bCreated - aCreated // Most recent first
  })
  const subscription = subscriptions?.[0] // Get most recent subscription
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

  // Use our new status calculation and display utilities
  const memberStatus = calculateMemberStatus(member as MemberData)
  const memberDisplayInfo = getMemberStatusDisplay(memberStatus.displayStatus)
  
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
      case 'EXPIRING':
        return 'cancel' // Expiring members can still be cancelled
      case 'DELETED':
        return 'restore' // Deleted members can be restored
      case 'ACTIVE':
        return 'cancel' // Active members can be cancelled
      case 'NO_SUBSCRIPTION':
      case 'SUSPENDED':
      default:
        return 'activate' // Default to activate for members without subscription or suspended
    }
  }
  
  // Helper function to get member's branch ID from subscription
  const getMemberBranchId = (): string | null => {
    return member.gymSubscriptions?.[0]?.branchId || null
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
    <div className="flex flex-col p-5 border-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all min-w-0 space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:min-h-[140px]">
      <div className="flex items-start space-x-5 min-w-0 flex-1">
        {/* Member Photo - Much Larger for Gym Context */}
        <div className="relative flex-shrink-0 sm:self-start">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={memberName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full sm:rounded-lg object-cover border-3 border-gray-200 dark:border-gray-600 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full sm:rounded-lg flex items-center justify-center text-white font-bold text-xl sm:text-lg shadow-md">
              {memberName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2 sm:pr-8 sm:flex sm:flex-col sm:justify-between">
          <div className="space-y-1 min-h-[3rem] sm:min-h-[2.5rem] sm:flex sm:flex-col sm:justify-start">
            <h4 className="font-bold text-lg sm:text-base truncate text-gray-900 dark:text-gray-100">{memberName}</h4>
            {member.phoneNumber && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{member.phoneNumber}</p>
            )}
          </div>

          {/* Subscription Information - Better Organized */}
          {(subscription && typeof subscription === 'object' && subscription.id) ? (
            <div className="space-y-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg min-h-[60px] sm:min-h-[70px]">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-purple-700 dark:text-purple-400">
                  {subscription.membershipPlan?.name || 'Unknown Plan'}
                </span>
                <span className="font-bold text-green-700 dark:text-green-400">
                  ₱{subscription.price?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(subscription.startDate).toLocaleDateString()} - {' '}
                  {new Date(subscription.endDate).toLocaleDateString()}
                </span>
                {!isExpired && daysRemaining !== null && daysRemaining > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-blue-700 dark:text-blue-400">{daysRemaining} days left</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg space-y-1 min-h-[60px] sm:min-h-[70px]">
              <div className="text-sm font-medium text-red-700 dark:text-red-400">No active subscription</div>
              <div className="text-xs text-red-600 dark:text-red-500">
                Member needs to be assigned a plan
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section with centered buttons - fixed width for consistent layout */}
      <div className="flex flex-col w-full sm:w-[200px] items-center justify-center">
        {/* Additional info badges for super admin - positioned above buttons */}
        {isSuperAdmin && member.tenant && (
          <div className="flex justify-center mb-2">
            <Badge variant="outline" className="text-xs px-3 py-1 text-center">
              {member.tenant.name}
            </Badge>
          </div>
        )}

        <div className="flex flex-row items-center justify-center space-x-2 w-full">
         {/* Status Button - Larger and More Touch-Friendly */}
         {(() => {
           const canManage = canManageMember();
           const displayLabel = memberDisplayInfo.label;

           // Get appropriate click handler based on member status
           const getClickHandler = () => {
             if (!canManage) {
               return () => toast.info('You can only manage members from your assigned branches')
             }

             switch (memberStatus.displayStatus) {
               case 'DELETED':
                 return () => openMemberActionModal('restore')
               case 'CANCELLED':
                 return () => openMemberActionModal('activate')
               case 'EXPIRED':
                 return () => onRenewSubscription(member)
               case 'EXPIRING':
                 return () => onRenewSubscription(member)
               case 'ACTIVE':
                 return () => onCancelSubscription(member)
               case 'NO_SUBSCRIPTION':
               case 'SUSPENDED':
               default:
                 return () => openMemberActionModal('activate')
             }
           }

           // Get button styling based on status and management permissions
           const getButtonClasses = () => {
             const baseClasses = 'border font-semibold transition-colors shadow-sm'

             if (!canManage) {
               return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-not-allowed opacity-60`
             }

             switch (memberStatus.displayStatus) {
               case 'ACTIVE':
                 return `${baseClasses} bg-green-800 dark:bg-green-400 text-white dark:text-black border-green-800 dark:border-green-400 hover:bg-green-900 dark:hover:bg-green-500 hover:border-green-900 dark:hover:border-green-500 hover:shadow-md`
               case 'CANCELLED':
                 return `${baseClasses} bg-orange-700 dark:bg-orange-400 text-white dark:text-black border-orange-700 dark:border-orange-400 hover:bg-orange-800 dark:hover:bg-orange-500 hover:border-orange-800 dark:hover:border-orange-500 hover:shadow-md`
               case 'DELETED':
                 return `${baseClasses} bg-red-700 dark:bg-red-400 text-white dark:text-black border-red-700 dark:border-red-400 hover:bg-red-800 dark:hover:bg-red-500 hover:border-red-800 dark:hover:border-red-500 hover:shadow-md`
               case 'EXPIRED':
                 return `${baseClasses} bg-yellow-700 dark:bg-yellow-400 text-black dark:text-black border-yellow-700 dark:border-yellow-400 hover:bg-yellow-800 dark:hover:bg-yellow-500 hover:border-yellow-800 dark:hover:border-yellow-500 hover:shadow-md`
               case 'EXPIRING':
                 return `${baseClasses} bg-amber-700 dark:bg-amber-400 text-white dark:text-black border-amber-700 dark:border-amber-400 hover:bg-amber-800 dark:hover:bg-amber-500 hover:border-amber-800 dark:hover:border-500 hover:shadow-md`
               case 'NO_SUBSCRIPTION':
               case 'SUSPENDED':
               default:
                 return `${baseClasses} bg-slate-700 dark:bg-slate-400 text-white dark:text-black border-slate-700 dark:border-slate-400 hover:bg-slate-800 dark:hover:bg-slate-500 hover:border-slate-800 dark:hover:border-slate-500 hover:shadow-md`
             }
           }

           return (
             <button
               type="button"
               className={`px-3 py-2 text-sm rounded-lg font-semibold transition-all duration-200 min-h-[44px] w-auto min-w-[100px] max-w-[120px] ${getButtonClasses()}`}
               onClick={getClickHandler()}
               disabled={!canManage}
             >
               {canManage ? displayLabel : `${displayLabel}`}
             </button>
           )
         })()}

         {/* Mobile-Friendly Dropdown Menu */}
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button
               variant="ghost"
               size="lg"
               className="h-[44px] w-[44px] p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center"
             >
               <MoreHorizontal className="h-5 w-5 sm:h-4 sm:w-4" />
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
                
                case 'EXPIRING':
                  return (
                    <DropdownMenuItem 
                      className="text-orange-600"
                      onClick={() => openMemberActionModal('cancel')}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Cancel Membership
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
                
                case 'NO_SUBSCRIPTION':
                case 'SUSPENDED':
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
