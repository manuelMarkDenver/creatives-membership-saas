'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useProfile, useUsersByTenant, userKeys } from '@/lib/hooks/use-users'
import { useSystemMemberStats } from '@/lib/hooks/use-stats'
import { useActiveMembershipPlans } from '@/lib/hooks/use-membership-plans'
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
  Receipt
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
import { User } from '@/types'
import { MemberInfoModal } from '@/components/modals/member-info-modal'
import { AddMemberModal } from '@/components/modals/add-member-modal'
import { MemberCard } from '@/components/members/member-card'
import { useRenewMemberSubscription, useCancelMember } from '@/lib/hooks/use-member-actions'
import { toast } from 'sonner'
import { filterMembersByStatus, calculateMemberStats, type MemberData } from '@/lib/utils/member-status'
import { useExpiringMembersCount } from '@/lib/hooks/use-expiring-members'

export default function MembersPage() {
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'expired' | 'expiring' | 'cancelled' | 'deleted'>('all')
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showMemberInfoModal, setShowMemberInfoModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [selectedMemberForAction, setSelectedMemberForAction] = useState(null)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationNotes, setCancellationNotes] = useState('')
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedMemberForTransactions, setSelectedMemberForTransactions] = useState(null)

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN'

  // Fetch data based on user role
  const { data: membersData, isLoading: isLoadingTenantMembers, error: tenantMembersError, refetch: refetchTenantMembers } = useUsersByTenant(
    profile?.tenantId || '', 
    { role: 'GYM_MEMBER' }
  )

  const { data: systemMemberStats, isLoading: isLoadingSystemMembers, error: systemMembersError } = useSystemMemberStats({
    enabled: isSuperAdmin
  })

  // Fetch membership plans for the current tenant
  const { data: membershipPlans = [] } = useActiveMembershipPlans()
  
  // Get backend expiring count - this is the authoritative count with proper branch filtering
  const { data: expiringCountData, error: expiringCountError } = useExpiringMembersCount(
    profile?.tenantId || '', 
    7, // 7 days ahead
    { enabled: !!profile?.tenantId && !isSuperAdmin }
  )
  
  // API data is loaded and working correctly
  
  // Mutation hooks for membership operations
  const renewMembershipMutation = useRenewMemberSubscription()
  const cancelMembershipMutation = useCancelMember()
  
  // Helper function to refresh all members data
  const refreshMembersData = async () => {
    try {
      // Invalidate and refetch tenant members query
      await queryClient.invalidateQueries({ 
        queryKey: userKeys.byTenant(profile?.tenantId || '', { role: 'GYM_MEMBER' })
      })
      
      // Also invalidate all user queries to ensure consistency  
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      
      // Force refetch
      await refetchTenantMembers()
      
      console.log('Members data refreshed successfully')
    } catch (error) {
      console.error('Error refreshing members data:', error)
    }
  }

  // Helper functions
  const handleRenewal = () => {
    if (!selectedMemberForAction || !selectedPlanId) {
      console.error('Missing member or plan selection')
      return
    }

    const selectedPlan = membershipPlans.find(plan => plan.id === selectedPlanId)
    if (!selectedPlan) {
      console.error('Selected plan not found')
      return
    }

    const memberName = selectedMemberForAction.name || `${selectedMemberForAction.firstName} ${selectedMemberForAction.lastName}`
    
    renewMembershipMutation.mutate({
      memberId: selectedMemberForAction.id,
      data: { membershipPlanId: selectedPlanId }
    }, {
      onSuccess: (result) => {
        toast.success(`Membership renewed successfully for ${memberName}!`, {
          description: result.message
        })
        
        setShowRenewalModal(false)
        setSelectedMemberForAction(null)
        setSelectedPlanId('')
      },
      onError: (error: unknown) => {
        console.error('Renewal failed:', error)
        const errorMessage = error && typeof error === 'object' && 'response' in error 
          ? (error.response as { data?: { message?: string } })?.data?.message 
          : 'Please try again.'
        toast.error('Failed to renew membership', {
          description: errorMessage || 'Please try again.'
        })
      }
    })
  }

  const handleCancellation = () => {
    if (!selectedMemberForAction) {
      console.error('No member selected for cancellation')
      return
    }

    const memberName = selectedMemberForAction.name || `${selectedMemberForAction.firstName} ${selectedMemberForAction.lastName}`
    
    cancelMembershipMutation.mutate({
      memberId: selectedMemberForAction.id,
      data: { reason: cancellationReason || 'No reason specified', notes: cancellationNotes }
    }, {
      onSuccess: (result) => {
        toast.success(`Membership cancelled successfully for ${memberName}`, {
          description: result.message
        })
        
        setShowCancellationModal(false)
        setSelectedMemberForAction(null)
        setCancellationReason('')
        setCancellationNotes('')
      },
      onError: (error: unknown) => {
        console.error('Cancellation failed:', error)
        const errorMessage = error && typeof error === 'object' && 'response' in error 
          ? (error.response as { data?: { message?: string } })?.data?.message 
          : 'Please try again.'
        toast.error('Failed to cancel membership', {
          description: errorMessage || 'Please try again.'
        })
      }
    })
  }

  // Helper function to get member's branch ID from subscription
  const getMemberBranchId = (member: MemberData): string | null => {
    return member.customerSubscriptions?.[0]?.branchId || null
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
    (systemMemberStats?.members || []).filter(m => ['GYM_MEMBER', 'ECOM_CUSTOMER', 'COFFEE_CUSTOMER'].includes(m.role)) :
    (membersData || [])
  
  // Apply branch filtering to ensure consistency between stats and displayed members
  const allMembers = rawMembers.filter(member => canManageMember(member))


  // Apply search term filtering first
  const searchFilteredMembers = allMembers.filter((member: MemberData) => {
    const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
    return !searchTerm || 
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  // Apply status filtering using our new utility
  const filteredMembers = filterMembersByStatus(
    searchFilteredMembers as MemberData[], 
    memberStatusFilter, 
    showDeleted
  )

  // Calculate stats using our new utility function
  // Stats should be constant and not affected by filters (except search)
  // This gives consistent stats regardless of filter selections
  const baseStats = calculateMemberStats(searchFilteredMembers as MemberData[])
  const stats = isSuperAdmin ? {
    ...baseStats,
    byCategory: systemMemberStats?.summary?.byCategory || []
  } : {
    ...baseStats,
    // Use backend count API result with fallback to frontend calculation if API fails
    expiring: expiringCountError ? baseStats.expiring : (expiringCountData?.count ?? 0)
  }
  
  // Stats are now consistent between API and frontend filtering



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {isSuperAdmin ? <Globe className="h-8 w-8 text-blue-500" /> : <Users className="h-8 w-8 text-blue-500" />}
            {isSuperAdmin ? 'All Members' : 'Members'}
          </h1>
          <p className="text-muted-foreground">
            {isSuperAdmin ? 'View all members across all tenants' : 'Manage gym members and their memberships'}
          </p>
        </div>
        {!isSuperAdmin && (
          <Button onClick={() => setShowAddMemberModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All registered members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        {!isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.expiring ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Expiring within 7 days
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Subscription expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">Subscription cancelled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isSuperAdmin ? 'Categories' : 'Deleted'}</CardTitle>
            <Building className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{isSuperAdmin ? stats.byCategory.length : stats.deleted}</div>
            <p className="text-xs text-muted-foreground">{isSuperAdmin ? 'Business types' : 'Soft deleted'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Debug component removed - expiring members count issue resolved */}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Member Directory</CardTitle>
          <CardDescription>Search and filter gym members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={memberStatusFilter} onValueChange={setMemberStatusFilter}>
                  <SelectTrigger className="w-[180px]">
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showDeleted"
                    checked={showDeleted}
                    onCheckedChange={setShowDeleted}
                  />
                  <Label htmlFor="showDeleted" className="text-sm font-medium whitespace-nowrap">
                    Show deleted
                  </Label>
                </div>
              </div>
            </div>
            
            {/* Filter status indicator */}
            {(memberStatusFilter !== 'all' || showDeleted || searchTerm) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing:</span>
                {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: &quot;{searchTerm}&quot;
                </Badge>
                )}
                {memberStatusFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {memberStatusFilter} members
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
          <div className="space-y-4">
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
              filteredMembers.map((member: User) => (
                <MemberCard
                  key={member.id}
                  member={member}
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

      {/* Membership Renewal Modal */}
      <Dialog open={showRenewalModal} onOpenChange={setShowRenewalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              Renew Membership
            </DialogTitle>
            <DialogDescription>
              Renew the expired membership for {selectedMemberForAction?.name || `${selectedMemberForAction?.firstName} ${selectedMemberForAction?.lastName}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedMemberForAction?.businessData?.membership && (
              <div className="space-y-2">
                <Label>Current Plan</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{selectedMemberForAction.businessData.membership.planName}</p>
                  <p className="text-sm text-muted-foreground">₱{selectedMemberForAction.businessData.membership.price}</p>
                  <p className="text-xs text-red-600">Expired: {new Date(selectedMemberForAction.businessData.membership.endDate).toLocaleDateString()}</p>
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
                  {membershipPlans.length === 0 ? (
                    <SelectItem value="no-plans" disabled>No membership plans available</SelectItem>
                  ) : (
                    membershipPlans.map((plan) => (
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
                  <strong>Selected Plan:</strong> {membershipPlans.find(p => p.id === selectedPlanId)?.name}
                </p>
                <p className="text-sm text-green-700">
                  Price: ₱{membershipPlans.find(p => p.id === selectedPlanId)?.price}
                </p>
                <p className="text-sm text-green-700">
                  Duration: {membershipPlans.find(p => p.id === selectedPlanId)?.duration} days
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
              Are you sure you want to cancel the active membership for {selectedMemberForAction?.name || `${selectedMemberForAction?.firstName} ${selectedMemberForAction?.lastName}`}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedMemberForAction?.businessData?.membership && (
              <div className="space-y-2">
                <Label>Current Plan</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{selectedMemberForAction.businessData.membership.planName}</p>
                  <p className="text-sm text-muted-foreground">₱{selectedMemberForAction.businessData.membership.price}</p>
                  <p className="text-xs text-green-600">Valid until: {new Date(selectedMemberForAction.businessData.membership.endDate).toLocaleDateString()}</p>
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
              Payment and transaction history for {selectedMemberForTransactions?.name || `${selectedMemberForTransactions?.firstName} ${selectedMemberForTransactions?.lastName}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Member Summary */}
            {selectedMemberForTransactions && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(selectedMemberForTransactions.name || selectedMemberForTransactions.firstName || selectedMemberForTransactions.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold">{selectedMemberForTransactions.name || `${selectedMemberForTransactions.firstName} ${selectedMemberForTransactions.lastName}`}</h4>
                  <p className="text-sm text-muted-foreground">{selectedMemberForTransactions.email}</p>
                  {selectedMemberForTransactions.businessData?.membership && (
                    <p className="text-xs text-purple-600 font-medium">
                      Current Plan: {selectedMemberForTransactions.businessData.membership.planName} - ₱{selectedMemberForTransactions.businessData.membership.price}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-auto max-h-96">
                {selectedMemberForTransactions?.businessData?.paymentHistory && selectedMemberForTransactions.businessData.paymentHistory.length > 0 ? (
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
                      {selectedMemberForTransactions.businessData.paymentHistory
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-3 text-sm">
                            {new Date(transaction.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="p-3 text-sm font-medium text-green-600">
                            ₱{transaction.amount}
                          </td>
                          <td className="p-3 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {transaction.type || 'Payment'}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-purple-600">
                            {transaction.planName || 'N/A'}
                          </td>
                          <td className="p-3 text-sm">
                            <Badge variant="secondary" className="text-xs">
                              {transaction.method || 'Cash'}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            <Badge 
                              variant={transaction.status === 'completed' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {transaction.status || 'Completed'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
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

            {/* Transaction Summary */}
            {selectedMemberForTransactions?.businessData?.paymentHistory && selectedMemberForTransactions.businessData.paymentHistory.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-800 font-medium">Total Paid</div>
                  <div className="text-2xl font-bold text-green-600">
                    ₱{selectedMemberForTransactions.businessData.paymentHistory
                      .reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0)
                      .toFixed(2)}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800 font-medium">Total Transactions</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedMemberForTransactions.businessData.paymentHistory.length}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-800 font-medium">Latest Payment</div>
                  <div className="text-lg font-bold text-purple-600">
                    {new Date(
                      selectedMemberForTransactions.businessData.paymentHistory
                        .sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
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
