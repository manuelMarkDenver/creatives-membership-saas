'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfile, useUsersByTenant, userKeys } from '@/lib/hooks/use-gym-users'
import { useSystemMemberStats } from '@/lib/hooks/use-stats'
import { useActiveMembershipPlans } from '@/lib/hooks/use-membership-plans'
import { gymMemberKeys } from '@/lib/hooks/use-gym-members'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Search, 
  Plus, 
  UserCheck,
  UserX,
  Calendar,
  Building,
  Globe,
  Receipt,
  AlertTriangle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { User, Role } from '@/types'
import { MemberInfoModal } from '@/components/modals/member-info-modal'
import { AddMemberModal } from '@/components/modals/add-member-modal'
import { MembershipPlansRequiredModal } from '@/components/modals/membership-plans-required-modal'
import { ChangePlanModal } from '@/components/modals/change-plan-modal'
import { AssignCardModal } from '@/components/modals/assign-card-modal'
import { MemberCard } from '@/components/members/member-card'
import { StatsOverview } from '@/components/members/stats-overview'
import { useRenewMemberSubscription, useCancelMember } from '@/lib/hooks/use-gym-member-actions'
import { toast } from 'react-toastify'
import { filterMembersByStatus, calculateMemberStats, type MemberData } from '@/lib/utils/member-status'
import { useExpiringMembersCount } from '@/lib/hooks/use-expiring-members'
import { useGymSubscriptionStats } from '@/lib/hooks/use-gym-subscriptions'
import { membersApi } from '@/lib/api/gym-members'

export default function MembersPage() {
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'expired' | 'expiring' | 'cancelled' | 'deleted'>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedMember, setSelectedMember] = useState<User | null>(null)
  const [showMemberInfoModal, setShowMemberInfoModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<User | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationNotes, setCancellationNotes] = useState('')
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedMemberForTransactions, setSelectedMemberForTransactions] = useState<User | null>(null)
  const [showPlansRequiredModal, setShowPlansRequiredModal] = useState(false)
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [selectedMemberForChangePlan, setSelectedMemberForChangePlan] = useState<User | null>(null)
  const [showAssignCardModal, setShowAssignCardModal] = useState(false)
  const [selectedMemberForAssignCard, setSelectedMemberForAssignCard] = useState<User | null>(null)

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN'

  // Fetch data based on user role - useUsersByTenant already returns complete gym member data with gymSubscriptions and membershipPlan
  const { data: membersData, isLoading: isLoadingTenantMembers, error: tenantMembersError, refetch: refetchTenantMembers } = useUsersByTenant(
    profile?.tenantId || '',
    {} // Remove role filter since backend API filtering is not working correctly
  )

  const { data: systemMemberStats, isLoading: isLoadingSystemMembers, error: systemMembersError } = useSystemMemberStats({
    enabled: isSuperAdmin
  })

  // Fetch membership plans for the current tenant
  const { data: membershipPlans, isLoading: isLoadingPlans, error: plansError } = useActiveMembershipPlans()
  
  // Fetch branches for the current tenant (for branch filter)
  const { data: branches, isLoading: isLoadingBranches } = useBranchesByTenant(
    profile?.tenantId || '',
    { includeDeleted: false }
  )
  
  // Ensure membershipPlans is always an array
  const safeMembershipPlans = Array.isArray(membershipPlans) ? membershipPlans : []
  
  // Get backend gym subscription stats for current tenant (non-super admin only)
  const { data: gymSubscriptionStats, error: subscriptionStatsError } = useGymSubscriptionStats({
    enabled: !isSuperAdmin && !!profile?.tenantId
  })
  
  // Get backend expiring count - this is the authoritative count with proper branch filtering
  useExpiringMembersCount(
    profile?.tenantId || '',
    7, // 7 days ahead
    { enabled: !!profile?.tenantId && !isSuperAdmin }
  )

  // Get pending assignment for dashboard banner
  const { data: pendingAssignment } = useQuery({
    queryKey: ['pending-assignment-dashboard', profile?.tenantId],
    queryFn: async () => {
      if (!profile?.tenantId) return null
      // For dashboard, we need to check all gyms in the tenant
      // For simplicity, let's assume we check the first gym or need to modify API
      // For now, we'll skip the banner until we have a proper endpoint
      return null
    },
    enabled: !!profile?.tenantId && !isSuperAdmin,
    refetchInterval: 5000, // Poll every 5 seconds
  })
  
  // Mutation hooks for membership operations
  const renewMembershipMutation = useRenewMemberSubscription()
  const cancelMembershipMutation = useCancelMember()
  
  // Helper function to refresh all members data
  const refreshMembersData = async () => {
    try {
      // Invalidate all user-related queries first
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      await queryClient.invalidateQueries({
        queryKey: userKeys.byTenant(profile?.tenantId || '', {})
      })
      
      // Invalidate gym members with subscriptions queries
      await queryClient.invalidateQueries({
        queryKey: gymMemberKeys.withSubscriptions(profile?.tenantId || '')
      })
      
      // Invalidate all gym member related queries
      await queryClient.invalidateQueries({ queryKey: gymMemberKeys.all })
      
      // Invalidate subscription-related queries
      await queryClient.invalidateQueries({ queryKey: ['gym-subscriptions'] })
      
      // Invalidate membership plans queries
      await queryClient.invalidateQueries({ queryKey: ['membership-plans'] })
      
      // Force refetch for immediate UI update
      if (isSuperAdmin) {
        await refetchTenantMembers()
      }
      
    } catch (error) {
      // Silent error handling for data refresh
    }
  }

  // Helper functions
  const handleRenewal = () => {
    if (!selectedMemberForAction || !selectedPlanId) {
      toast.error('Please select a member and plan')
      return
    }

    const selectedPlan = safeMembershipPlans.find(plan => plan.id === selectedPlanId)
    if (!selectedPlan) {
      toast.error('Selected plan not found')
      return
    }

    const memberName = `${selectedMemberForAction.firstName} ${selectedMemberForAction.lastName}`
    
    renewMembershipMutation.mutate({
      memberId: selectedMemberForAction.id,
      data: { gymMembershipPlanId: selectedPlanId }
    }, {
      onSuccess: async (result) => {
        toast.success(`Membership renewed successfully for ${memberName}!\n${result.message}`, {
          autoClose: 5000
        })
        
        // Refresh members data to show updated status
        await refreshMembersData()
        
        setShowRenewalModal(false)
        setSelectedMemberForAction(null)
        setSelectedPlanId('')
      },
      onError: (error: unknown) => {
        const errorMessage = error && typeof error === 'object' && 'response' in error 
          ? (error.response as { data?: { message?: string } })?.data?.message 
          : 'Please try again.'
        toast.error(`Failed to renew membership\n${errorMessage || 'Please try again.'}`, {
          autoClose: 5000
        })
      }
    })
  }

  const handleCancellation = () => {
    if (!selectedMemberForAction) {
      toast.error('No member selected for cancellation')
      return
    }

    const memberName = `${selectedMemberForAction.firstName} ${selectedMemberForAction.lastName}`
    
    cancelMembershipMutation.mutate({
      memberId: selectedMemberForAction.id,
      data: { reason: cancellationReason || 'No reason specified', notes: cancellationNotes }
    }, {
      onSuccess: async (result) => {
        toast.success(`Membership cancelled successfully for ${memberName}\n${result.message}`, {
          autoClose: 5000
        })
        
        // Refresh members data to show updated status
        await refreshMembersData()
        
        setShowCancellationModal(false)
        setSelectedMemberForAction(null)
        setCancellationReason('')
        setCancellationNotes('')
      },
      onError: (error: unknown) => {
        const errorMessage = error && typeof error === 'object' && 'response' in error 
          ? (error.response as { data?: { message?: string } })?.data?.message 
          : 'Please try again.'
        toast.error(`Failed to cancel membership\n${errorMessage || 'Please try again.'}`, {
          autoClose: 5000
        })
      }
    })
  }

  // Helper function to get member's branch ID (use primaryBranchId as source of truth)
  const getMemberBranchId = (member: MemberData): string | null => {
    return member.gymMemberProfile?.primaryBranchId || member.gymSubscriptions?.[0]?.branchId || null
  }

  // Helper function to check if current user can manage a member based on branch access
  // This should match the logic in MemberCard component
  const canManageMember = (member: MemberData): boolean => {
    // Super admin and owners can manage all members
    if (isSuperAdmin || profile?.role === 'SUPER_ADMIN' || profile?.role === 'OWNER') {
      return true
    }
    
    // For managers and staff, check if they have access to the member's branch
    if (profile?.userBranches && profile.userBranches.length > 0) {
      const memberBranchId = getMemberBranchId(member)
      
      // If member has no branchId, they can be managed by anyone in the tenant
      if (!memberBranchId) {
        return true
      }
      
      // Check if user has access to the member's branch
      return profile.userBranches.some((ub: { branchId: string }) => ub.branchId === memberBranchId)
    }
    
    // Default: if no branch restrictions, allow management
    return true
  }

  // Determine data source based on user role
  const isLoading = isSuperAdmin ? isLoadingSystemMembers : isLoadingTenantMembers
  const error = isSuperAdmin ? systemMembersError : tenantMembersError
  const rawMembers = isSuperAdmin ? 
    (systemMemberStats?.members || []).filter(m => ['CLIENT', 'ECOM_CUSTOMER', 'COFFEE_CUSTOMER'].includes(m.role)) :
    (membersData || []).filter((m: any) => m.role === 'CLIENT') // Filter for CLIENT role users only
  
  // Apply branch filtering to ensure consistency between stats and displayed members
  const allMembers = rawMembers.filter((member: MemberData) => {
    return canManageMember(member)
  })


  // Apply search term filtering first
  const searchFilteredMembers = allMembers.filter((member: MemberData) => {
    const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
    return !searchTerm || 
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  // Apply branch filtering
  const branchFilteredMembers = searchFilteredMembers.filter((member: MemberData) => {
    if (branchFilter === 'all') return true
    
    const memberBranchId = getMemberBranchId(member)
    
    // Show members without branch assignments if "no-branch" is selected
    if (branchFilter === 'no-branch') {
      return !memberBranchId
    }
    
    // Show members assigned to specific branch
    return memberBranchId === branchFilter
  })

  // Apply status filtering using our new utility
  // NOTE: When filtering by 'expiring', this uses frontend logic which may show different 
  // results than the backend API count due to branch filtering differences.
  // The stats panel uses backend API count for consistency with badge/overview.
  const filteredMembers = filterMembersByStatus(
    branchFilteredMembers as MemberData[], 
    memberStatusFilter, 
    showDeleted
  )

  // Calculate stats - use backend subscription stats for more accurate counts when available
  const frontendStats = calculateMemberStats(branchFilteredMembers as MemberData[])
  
  const stats = isSuperAdmin ? {
    ...frontendStats,
    byCategory: systemMemberStats?.summary?.byCategory || []
  } : {
    // For tenant admins, use backend gym subscription stats when available for better accuracy
    // This counts unique gym members by their current subscription status with proper filtering
    total: gymSubscriptionStats?.total || frontendStats.total,
    active: gymSubscriptionStats?.active || frontendStats.active,
    expired: gymSubscriptionStats?.expired || frontendStats.expired,
    cancelled: gymSubscriptionStats?.cancelled || frontendStats.cancelled,
    // Frontend calculation for other stats that backend doesn't provide
    expiring: frontendStats.expiring,
    deleted: frontendStats.deleted
  }



  return (
    <div className="space-y-4">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            {isSuperAdmin ? <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" /> : <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />}
            {isSuperAdmin ? 'All Members' : 'Members'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isSuperAdmin ? 'View all members across all tenants' : 'Manage gym members and their memberships'}
          </p>
        </div>
        {!isSuperAdmin && (
          <Button 
            onClick={() => {
              if (safeMembershipPlans.length === 0) {
                setShowPlansRequiredModal(true)
              } else {
                setShowAddMemberModal(true)
              }
            }}
            size="lg"
            title={safeMembershipPlans.length === 0 ? 'Create membership plans first' : 'Add a new member'}
            className="w-full sm:w-auto"
          >
            {safeMembershipPlans.length === 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Create Plans First
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </>
            )}
          </Button>
        )}
      </div>

      {/* Mobile-First Stats Overview */}
      <StatsOverview stats={stats} isSuperAdmin={isSuperAdmin} />

      {/* Search and Filters - Priority Position for Mobile */}
      <Card className="border-2 shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <CardTitle className="text-gray-900 dark:text-gray-100">Member Directory</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">Search and filter gym members</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 mb-6">
            {/* Search bar - full width */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            
            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Select value={memberStatusFilter} onValueChange={(value) => setMemberStatusFilter(value as 'all' | 'active' | 'expired' | 'expiring' | 'cancelled' | 'deleted')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
              {!isSuperAdmin && (
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-500" />
                        All Branches
                      </div>
                    </SelectItem>
                    {branches && branches.length > 0 && branches.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          {branch.name}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="no-branch">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-orange-500" />
                        No Branch Assigned
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center space-x-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md">
                <Checkbox
                  id="showDeleted"
                  checked={showDeleted}
                  onCheckedChange={(checked) => setShowDeleted(checked as boolean)}
                />
                <Label htmlFor="showDeleted" className="text-sm font-medium whitespace-nowrap cursor-pointer">
                  Show deleted
                </Label>
              </div>
            </div>
            
            {/* Filter status indicator */}
            {(memberStatusFilter !== 'all' || branchFilter !== 'all' || showDeleted || searchTerm) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <span>Showing:</span>
                {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
                )}
                {memberStatusFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {memberStatusFilter} members
                  </Badge>
                )}
                {branchFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    <Building className="h-3 w-3 mr-1" />
                    {branchFilter === 'no-branch' ? 'No Branch' : branches?.find((b: any) => b.id === branchFilter)?.name || 'Branch'}
                  </Badge>
                )}
                {showDeleted && (
                  <Badge variant="destructive" className="text-xs">
                    Including deleted
                  </Badge>
                )}
                <span className="text-xs">({filteredMembers.length} found)</span>
              </div>
            )}
          </div>

          {/* Members List */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">Loading members...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                Failed to load members. Please try again.
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No members found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Try adjusting your search.' : 'Get started by adding your first member.'}
                </p>
              </div>
            ) : (
              filteredMembers.map((member: MemberData) => (
                 <MemberCard
                   key={member.id}
                   member={member as User}
                   isSuperAdmin={isSuperAdmin}
                   onViewMemberInfo={(member) => {
                     setSelectedMember(member)
                     setShowMemberInfoModal(true)
                   }}
                   onViewTransactions={(member) => {
                     setSelectedMemberForTransactions(member)
                     setShowTransactionModal(true)
                   }}
                    onRenewSubscription={(member) => {
                      setSelectedMemberForAction(member)
                      setShowRenewalModal(true)
                    }}
                    onCancelSubscription={(member) => {
                      setSelectedMemberForAction(member)
                      setShowCancellationModal(true)
                    }}
                    onChangePlan={(member) => {
                      setSelectedMemberForChangePlan(member)
                      setShowChangePlanModal(true)
                    }}
                    onAssignCard={(member) => {
                      setSelectedMemberForAssignCard(member)
                      setShowAssignCardModal(true)
                    }}
                   onMemberDeleted={async () => {
                     // Refresh members list after deletion
                     await refreshMembersData()
                   }}
                 />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Member Information Modal */}
      {showMemberInfoModal && selectedMember && (
        <MemberInfoModal
          isOpen={showMemberInfoModal}
          onClose={() => {
            setShowMemberInfoModal(false)
            setSelectedMember(null)
          }}
          member={selectedMember}
          onMemberUpdated={async () => {
            // Refresh the members list after member update
            await refreshMembersData()
          }}
        />
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onMemberAdded={async () => {
          // Refresh the members list
          await refreshMembersData()
          setShowAddMemberModal(false)
        }}
      />

      {/* Membership Plans Required Modal */}
      <MembershipPlansRequiredModal
        open={showPlansRequiredModal}
        onOpenChange={setShowPlansRequiredModal}
        tenantName={profile?.tenant?.name || 'your gym'}
      />

      {/* Change Plan Modal */}
      <ChangePlanModal
        isOpen={showChangePlanModal}
        onClose={() => {
          setShowChangePlanModal(false)
          setSelectedMemberForChangePlan(null)
        }}
        member={selectedMemberForChangePlan}
        onPlanChanged={async () => {
          // Refresh members data to show updated plan
          await refreshMembersData()
          setShowChangePlanModal(false)
          setSelectedMemberForChangePlan(null)
        }}
      />

      {/* Assign Card Modal */}
      <AssignCardModal
        isOpen={showAssignCardModal}
        onClose={() => {
          setShowAssignCardModal(false)
          setSelectedMemberForAssignCard(null)
        }}
        member={selectedMemberForAssignCard}
        onCardAssigned={async () => {
          // Refresh members data to show updated card status
          await refreshMembersData()
          setShowAssignCardModal(false)
          setSelectedMemberForAssignCard(null)
        }}
      />

      {/* Membership Renewal Modal */}
      <Dialog open={showRenewalModal} onOpenChange={setShowRenewalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              Renew Membership
            </DialogTitle>
            <DialogDescription>
              Renew the expired membership for {`${selectedMemberForAction?.firstName} ${selectedMemberForAction?.lastName}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedMemberForAction?.gymSubscriptions?.[0] && (
              <div className="space-y-2">
                <Label>Current Plan</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium text-gray-900">{selectedMemberForAction.gymSubscriptions[0].gymMembershipPlan?.name}</p>
                  <p className="text-sm text-gray-700">₱{selectedMemberForAction.gymSubscriptions[0].price}</p>
                  <p className="text-xs text-red-600">Expired: {new Date(selectedMemberForAction.gymSubscriptions[0].endDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Select New Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a membership plan" />
                </SelectTrigger>
                <SelectContent>
                  {safeMembershipPlans.length === 0 ? (
                    <SelectItem value="no-plans" disabled>No membership plans available</SelectItem>
                  ) : (
                    safeMembershipPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ₱{plan.price} ({plan.duration} days)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPlanId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Selected Plan:</strong> {safeMembershipPlans.find(p => p.id === selectedPlanId)?.name}
                </p>
                <p className="text-sm text-green-700">
                  Price: ₱{safeMembershipPlans.find(p => p.id === selectedPlanId)?.price}
                </p>
                <p className="text-sm text-green-700">
                  Duration: {safeMembershipPlans.find(p => p.id === selectedPlanId)?.duration} days
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRenewalModal(false)
                setSelectedMemberForAction(null)
                setSelectedPlanId('')
              }}
            >
              Cancel
            </Button>
            <Button 
              disabled={!selectedPlanId || renewMembershipMutation.isPending}
              onClick={handleRenewal}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              {renewMembershipMutation.isPending ? 'Renewing...' : 'Renew Membership'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Membership Cancellation Modal */}
      <Dialog open={showCancellationModal} onOpenChange={setShowCancellationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <UserX className="h-5 w-5" />
              Cancel Membership
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the active membership for {`${selectedMemberForAction?.firstName} ${selectedMemberForAction?.lastName}`}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedMemberForAction?.gymSubscriptions?.[0] && (
              <div className="space-y-2">
                <Label>Current Plan</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium text-gray-900">{selectedMemberForAction.gymSubscriptions[0].gymMembershipPlan?.name}</p>
                  <p className="text-sm text-gray-700">₱{selectedMemberForAction.gymSubscriptions[0].price}</p>
                  <p className="text-xs text-green-600">Valid until: {new Date(selectedMemberForAction.gymSubscriptions[0].endDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Canceling this membership will immediately revoke access to gym facilities. This action cannot be undone.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Reason for Cancellation <span className="text-red-500">*</span></Label>
              <Select value={cancellationReason} onValueChange={setCancellationReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NON_PAYMENT">Non-payment</SelectItem>
                  <SelectItem value="POLICY_VIOLATION">Policy violation</SelectItem>
                  <SelectItem value="MEMBER_REQUEST">Member request</SelectItem>
                  <SelectItem value="FACILITY_ABUSE">Facility abuse</SelectItem>
                  <SelectItem value="ADMIN_DECISION">Admin decision</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {cancellationReason === 'OTHER' && (
              <div className="space-y-2">
                <Label>Please specify the reason</Label>
                <Textarea 
                  placeholder="Enter details about the cancellation reason..."
                  value={cancellationNotes}
                  onChange={(e) => setCancellationNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCancellationModal(false)
                setSelectedMemberForAction(null)
              }}
            >
              Keep Active
            </Button>
            <Button 
              variant="destructive"
              disabled={!cancellationReason || cancelMembershipMutation.isPending}
              onClick={handleCancellation}
            >
              <UserX className="w-4 h-4 mr-2" />
              {cancelMembershipMutation.isPending ? 'Cancelling...' : 'Cancel Membership'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Modal */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              Transaction History
            </DialogTitle>
            <DialogDescription>
              Payment and transaction history for {`${selectedMemberForTransactions?.firstName} ${selectedMemberForTransactions?.lastName}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Member Summary */}
            {selectedMemberForTransactions && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(selectedMemberForTransactions?.firstName || selectedMemberForTransactions?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold">{`${selectedMemberForTransactions?.firstName || ''} ${selectedMemberForTransactions?.lastName || ''}`}</h4>
                  <p className="text-sm text-muted-foreground">{selectedMemberForTransactions?.email}</p>
                  {selectedMemberForTransactions.gymSubscriptions?.[0] && (
                    <p className="text-xs text-purple-600 font-medium">
                      Current Plan: {selectedMemberForTransactions.gymSubscriptions[0].gymMembershipPlan?.name} - ₱{selectedMemberForTransactions.gymSubscriptions[0].price}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-auto max-h-96">
                {/* Payment history is now handled through the transaction history API */}
                {false ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-gray-900">Date</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-900">Amount</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-900">Type</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-900">Plan</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-900">Method</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-900">Status</th>
                      </tr>
                    </thead>
                      <tbody className="divide-y divide-gray-200">
                        {/* Payment history is now handled through transaction API */}
                        {/* Temporarily disabled - payment history moved to transaction API */}
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-500">
                            Transaction history temporarily disabled
                          </td>
                        </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No Transaction History</h3>
                    <p className="text-sm text-gray-500">
                      This member doesn&apos;t have any recorded transactions yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Summary - Payment history now handled through transaction API */}
            {false && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-800 font-medium">Total Paid</div>
                  <div className="text-2xl font-bold text-green-600">
                    ₱0.00 {/* Payment history moved to transaction API */}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800 font-medium">Total Transactions</div>
                  <div className="text-2xl font-bold text-blue-600">
                    0 {/* Payment history moved to transaction API */}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-800 font-medium">Latest Payment</div>
                  <div className="text-lg font-bold text-purple-600">
                    {new Date(
                      new Date().toISOString() /* Payment history moved to transaction API */
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTransactionModal(false)
                setSelectedMemberForTransactions(null)
              }}
            >
              Close
            </Button>
            {/* Add Export or Print functionality later */}
            <Button variant="default">
              <Receipt className="w-4 h-4 mr-2" />
              Export Transactions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
