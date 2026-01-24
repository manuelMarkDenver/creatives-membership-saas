'use client'

import { useState } from 'react'
import { User } from '@/types'
import { toast } from 'react-toastify'
import { MemberActionType, MemberActionsModal } from '@/components/modals/member-actions-modal'
import { TransactionHistoryModal } from '@/components/modals/transaction-history-modal'
import { DeleteMemberModal } from '@/components/modals/delete-member-modal'
import { MemberHistoryModal } from '@/components/modals/member-history-modal'
import { RestoreMemberModal } from '@/components/modals/restore-member-modal'
import { ReclaimPendingModal } from '@/components/modals/reclaim-pending-modal'
import { useProfile, useSoftDeleteUser, useActivateUser, useDeactivateUser, useRestoreUser } from '@/lib/hooks/use-gym-users'
import { calculateMemberStatus, MemberData } from '@/lib/utils/member-status'
import { getMemberStatusDisplay } from '@/lib/utils/member-status-display'
import { membersApi } from '@/lib/api/gym-members'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Ban,
  CreditCard,
  Lock,
  Building,
  Settings,
  Eye,
} from "lucide-react"

interface MemberCardProps {
  member: User
  isSuperAdmin?: boolean
  onViewMemberInfo: (member: User) => void
  onViewTransactions: (member: User) => void
  onRenewSubscription: (member: User) => void
  onCancelSubscription: (member: User) => void
  onChangePlan: (member: User) => void
  onAssignCard: (member: User) => void
  onReplaceCard: (member: User) => void
  onMemberDeleted: () => void
}

export function MemberCard({
  member,
  isSuperAdmin = false,
  onViewMemberInfo,
  onViewTransactions,
  onRenewSubscription,
  onCancelSubscription,
  onChangePlan,
  onAssignCard,
  onReplaceCard,
  onMemberDeleted
}: MemberCardProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  // New member management modals
  const [showMemberActionsModal, setShowMemberActionsModal] = useState(false)
  const [currentAction, setCurrentAction] = useState<MemberActionType>('activate')
  const [showMemberHistoryModal, setShowMemberHistoryModal] = useState(false)
  const [showReclaimModal, setShowReclaimModal] = useState(false)
  const [reclaimInfo, setReclaimInfo] = useState<{ gymId: string; memberName: string; expiresAt: string } | null>(null)
  const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Unknown'

  const resumeReclaim = async () => {
    const gymId = member.gymMemberProfile?.primaryBranchId
    if (!gymId) {
      toast.error('Member has no associated gym')
      return
    }

    try {
      const pending = await membersApi.getPendingAssignment(gymId)
      if (!pending || pending.memberId !== member.id || pending.purpose !== 'RECLAIM') {
        toast.info('No reclaim pending for this member')
        return
      }

      setReclaimInfo({
        gymId,
        memberName,
        expiresAt: pending.expiresAt,
      })
      setShowReclaimModal(true)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load reclaim status')
    }
  }
  
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
  
  // Check if member is deleted at gym level (gym-specific soft delete)
  const isDeleted = Boolean(member.gymMemberProfile?.deletedAt)

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

  // Helper function to get card status information
  const getCardStatusInfo = () => {
    const cardStatus = member.gymMemberProfile?.cardStatus
    const hasActiveCard = member.gymMemberProfile?.cardUid && cardStatus === 'ACTIVE'

    if (hasActiveCard) {
      return {
        label: 'Card Active',
        variant: 'default' as const,
        icon: CreditCard,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
      }
    } else if (cardStatus === 'DISABLED') {
      return {
        label: 'Card Disabled',
        variant: 'secondary' as const,
        icon: Ban,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      }
    } else if (cardStatus === 'PENDING_CARD') {
      return {
        label: 'Card Pending',
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      }
    } else {
      return {
        label: 'No Card',
        variant: 'outline' as const,
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      }
    }
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
        return 'assign_plan' // Members without subscription need plan assignment
      case 'SUSPENDED':
      default:
        return 'activate' // Default to activate for suspended members
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
    <div className="flex flex-col p-4 sm:p-5 border-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all min-w-0 gap-4">
      {/* Top section: Photo and basic info */}
      <div className="flex gap-3 sm:gap-4 min-w-0">
        {/* Member Photo */}
        <div className="relative flex-shrink-0">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={memberName}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-md">
              {memberName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <h4 
            className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words line-clamp-2"
            onClick={() => onViewMemberInfo(member)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onViewMemberInfo(member)
              }
            }}
          >
            {memberName}
          </h4>
          {member.phoneNumber && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{member.phoneNumber}</p>
          )}
        </div>
      </div>

      {/* Subscription Information */}
      {(subscription && typeof subscription === 'object' && subscription.id) ? (
        <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-semibold text-sm sm:text-base text-purple-700 dark:text-purple-400">
              {subscription.gymMembershipPlan?.name || 'Unknown Plan'}
            </span>
            <span className="font-bold text-sm sm:text-base text-green-700 dark:text-green-400">
              ₱{subscription.price?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="break-all">
                {new Date(subscription.startDate).toLocaleDateString()} - {' '}
                {new Date(subscription.endDate).toLocaleDateString()}
              </span>
            </div>
            {!isExpired && daysRemaining !== null && daysRemaining > 0 && (
              <>
                <span>•</span>
                <span className="font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap">{daysRemaining} days left</span>
              </>
            )}
          </div>
          
          {/* Branch Information */}
          {member.gymMemberProfile?.primaryBranch && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-blue-700 dark:text-blue-400 font-medium">
                  {member.gymMemberProfile.primaryBranch.name || 'Unknown Branch'}
                </span>
              </div>
              {member.gymMemberProfile?.accessLevel && (
                <>
                  <span>•</span>
                  <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {member.gymMemberProfile.accessLevel === 'ALL_BRANCHES' ? 'All Branches' :
                     member.gymMemberProfile.accessLevel === 'MULTI_BRANCH' ? 'Multi-Branch' :
                     'Single Branch'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-sm font-medium text-red-700 dark:text-red-400">No active subscription</div>
          <div className="text-xs text-red-600 dark:text-red-500">
            Member needs to be assigned a plan
          </div>
        </div>
      )}

        {/* Action section */}
        <div className="flex flex-col gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {/* Card Status Badge */}
          <div className="flex items-center gap-2">
            {(() => {
              const cardStatus = getCardStatusInfo()
              const Icon = cardStatus.icon
              const badge = (
                <Badge variant={cardStatus.variant} className={`text-xs px-2 py-1 flex items-center gap-1 ${cardStatus.className}`}>
                  <Icon className="h-3 w-3" />
                  {cardStatus.label}
                </Badge>
              )

              // Show UID tooltip for active cards
              if (cardStatus.label === 'Card Active' && member.gymMemberProfile?.cardUid) {
                return (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {badge}
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <div className="text-xs font-medium">Card UID</div>
                          <div className="font-mono text-sm">{member.gymMemberProfile.cardUid}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              }

              return badge
            })()}

            {/* Additional info badges for super admin */}
            {isSuperAdmin && member.tenant && (
              <Badge variant="outline" className="text-xs px-3 py-1 w-fit">
                {member.tenant.name}
              </Badge>
            )}
          </div>

         <div className="flex flex-row items-center justify-end gap-2 w-full">
          {/* Primary Card Actions - Moved to right side */}
          {(() => {
            const cardStatus = member.gymMemberProfile?.cardStatus
            const canManage = canManageMember()
            const currentState = getMemberStatus()

            if (!canManage || currentState === 'DELETED') return null

            return (
              <>
                {/* Assign Card Button - for members without cards */}
                {(cardStatus === 'NO_CARD' || !cardStatus) && currentState === 'ACTIVE' && (
                  <button
                    type="button"
                    className="px-4 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md min-h-[44px] flex-1 sm:flex-initial sm:min-w-[120px] flex items-center justify-center gap-2"
                    onClick={() => onAssignCard(member)}
                  >
                    <CreditCard className="h-4 w-4" />
                    Assign Card
                  </button>
                )}

                {/* Replace Card Button - for members with active cards */}
                {cardStatus === 'ACTIVE' && currentState === 'ACTIVE' && (
                  <button
                    type="button"
                    className="px-4 py-2.5 text-sm bg-transparent hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md min-h-[44px] flex-1 sm:flex-initial sm:min-w-[120px] flex items-center justify-center gap-2"
                    onClick={() => onReplaceCard(member)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Replace Card
                  </button>
                )}
              </>
            )
          })()}
          {/* Status Button - Larger and More Touch-Friendly */}
          {(() => {
            const canManage = canManageMember();

            // Use action-oriented labels instead of status labels
            const getActionLabel = () => {
              switch (memberStatus.displayStatus) {
                case 'ACTIVE':
                  return 'Cancel Membership'
                case 'CANCELLED':
                  return 'Activate Member'
                case 'EXPIRED':
                  return 'Renew Membership'
                 case 'EXPIRING':
                   return 'Cancel Membership'
                case 'PENDING_CARD':
                  return 'Assign Card'
                case 'NO_SUBSCRIPTION':
                  return 'Assign Plan'
                case 'DELETED':
                  return 'Restore Account'
                default:
                  return memberDisplayInfo.label
              }
            }

            const displayLabel = getActionLabel();

           // Get appropriate click handler based on member status
           const getClickHandler = () => {
             if (!canManage) {
               return () => toast.info('You can only manage members from your assigned branches')
             }

               switch (memberStatus.displayStatus) {
                 case 'PENDING_CARD':
                   return () => onAssignCard?.(member)
                 case 'DELETED':
                   return () => openMemberActionModal('restore')
                 case 'CANCELLED':
                   return () => openMemberActionModal('activate')
                 case 'EXPIRED':
                   return () => onRenewSubscription(member)
                  case 'EXPIRING':
                    return () => onCancelSubscription(member)
                 case 'ACTIVE':
                   return () => onCancelSubscription(member)
                 case 'NO_SUBSCRIPTION':
                   return () => openMemberActionModal('assign_plan')
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
                case 'PENDING_CARD':
                  return `${baseClasses} bg-purple-700 dark:bg-purple-400 text-white dark:text-black border-purple-700 dark:border-purple-400 hover:bg-purple-800 dark:hover:bg-purple-500 hover:border-purple-800 dark:hover:border-purple-500 hover:shadow-md`
                 case 'ACTIVE':
                   return `${baseClasses} bg-orange-600 dark:bg-orange-500 text-white dark:text-black border-orange-600 dark:border-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 hover:border-orange-700 dark:hover:border-orange-600 hover:shadow-md`
                case 'CANCELLED':
                  return `${baseClasses} bg-orange-700 dark:bg-orange-400 text-white dark:text-black border-orange-700 dark:border-orange-400 hover:bg-orange-800 dark:hover:bg-orange-500 hover:border-orange-800 dark:hover:border-orange-500 hover:shadow-md`
                case 'DELETED':
                  return `${baseClasses} bg-red-700 dark:bg-red-400 text-white dark:text-black border-red-700 dark:border-red-400 hover:bg-red-800 dark:hover:bg-red-500 hover:border-red-800 dark:hover:border-red-500 hover:shadow-md`
               case 'EXPIRED':
                 return `${baseClasses} bg-red-700 dark:bg-red-400 text-white dark:text-black border-red-700 dark:border-red-400 hover:bg-red-800 dark:hover:bg-red-500 hover:border-red-800 dark:hover:border-red-500 hover:shadow-md`
                 case 'EXPIRING':
                   return `${baseClasses} bg-orange-600 dark:bg-orange-500 text-white dark:text-black border-orange-600 dark:border-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 hover:border-orange-700 dark:hover:border-orange-600 hover:shadow-md`
                 case 'NO_SUBSCRIPTION':
                   return `${baseClasses} bg-blue-700 dark:bg-blue-400 text-white dark:text-black border-blue-700 dark:border-blue-400 hover:bg-blue-800 dark:hover:bg-blue-500 hover:border-blue-800 dark:hover:border-blue-500 hover:shadow-md`
                 case 'SUSPENDED':
                 default:
                   return `${baseClasses} bg-slate-700 dark:bg-slate-400 text-white dark:text-black border-slate-700 dark:border-slate-400 hover:bg-slate-800 dark:hover:bg-slate-500 hover:border-slate-800 dark:hover:border-slate-500 hover:shadow-md`
              }
           }

           return (
             <button
               type="button"
               className={`px-4 py-2.5 text-sm rounded-lg font-semibold transition-all duration-200 min-h-[44px] flex-1 sm:flex-initial sm:min-w-[120px] ${getButtonClasses()}`}
               onClick={getClickHandler()}
               disabled={!canManage}
             >
               {canManage ? displayLabel : `${displayLabel}`}
             </button>
           )
         })()}

         {/* Dropdown Menu */}
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button
               variant="outline"
               size="lg"
               className="h-[44px] px-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all"
             >
               <MoreHorizontal className="h-4 w-4 sm:mr-2" />
               <span className="hidden sm:inline">Actions</span>
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
                    <>
                      {member.gymMemberProfile?.cardUid && (
                        <DropdownMenuItem
                          className="text-purple-600"
                          onClick={resumeReclaim}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Resume Card Reclaim
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-green-600"
                        onClick={() => openMemberActionModal('activate')}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate Member
                      </DropdownMenuItem>
                    </>
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
                      <>
                        <DropdownMenuItem
                          className="text-blue-600"
                          onClick={() => onChangePlan?.(member)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Change Plan
                        </DropdownMenuItem>
                        {member.gymMemberProfile?.cardStatus === 'ACTIVE' && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => openMemberActionModal('disable_card')}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Disable Card
                          </DropdownMenuItem>
                        )}
                        {member.gymMemberProfile?.cardStatus === 'DISABLED' && (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => openMemberActionModal('enable_card')}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Enable Card
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-orange-600"
                          onClick={() => openMemberActionModal('cancel')}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Cancel Membership
                        </DropdownMenuItem>
                      </>
                    )
                
                 case 'NO_SUBSCRIPTION':
                   return (
                     <DropdownMenuItem
                       className="text-blue-600"
                       onClick={() => openMemberActionModal('assign_plan')}
                     >
                       <UserPlus className="mr-2 h-4 w-4" />
                       Assign Membership Plan
                     </DropdownMenuItem>
                   )
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

       {reclaimInfo && (
         <ReclaimPendingModal
           gymId={reclaimInfo.gymId}
           memberName={reclaimInfo.memberName}
           initialExpiresAt={reclaimInfo.expiresAt}
           isOpen={showReclaimModal}
           onClose={() => setShowReclaimModal(false)}
         />
       )}
    </div>
  )
}
