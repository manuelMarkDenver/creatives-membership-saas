'use client'

import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useBranchesByTenant, useBranchesSystemWide, useCreateBranch, useUpdateBranch, useDeleteBranch, useBranchUsers, useBulkReassignUsers, useForceDeleteBranch, useRestoreBranch } from '@/lib/hooks/use-branches'
import { useTenants } from '@/lib/hooks/use-tenants'
import { useRoleNavigation } from '@/lib/hooks/use-role-navigation'
import { useSubscriptionStatus } from '@/lib/hooks/use-subscription-status'
import { Role, Tenant } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { CollapsibleStatsOverview, type StatItem } from '@/components/ui/collapsible-stats-overview'
import { BulkReassignMembersModal } from '@/components/modals/bulk-reassign-members-modal'
import { 
  MapPin, 
  Search, 
  Plus, 
  Building2,
  Users,
  Phone,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  RotateCcw
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Branch } from '@/types'
import { toast } from 'react-toastify'
import { branchesApi } from '@/lib/api'

export default function LocationsPage() {
  const { data: profile } = useProfile()
  const { canAccess } = useRoleNavigation(profile?.role)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [advancedDeleteDialogOpen, setAdvancedDeleteDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Branch | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [targetBranchId, setTargetBranchId] = useState<string>('')
  const [deleteReason, setDeleteReason] = useState('')
  const [forceDeleteConfirmation, setForceDeleteConfirmation] = useState('')
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [membersToReassign, setMembersToReassign] = useState<any[]>([])
  const [branchToDeleteId, setBranchToDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    isMainBranch: false
  })

  // Role-based access control
  const userRole = profile?.role as Role
  const isSuperAdmin = userRole === Role.SUPER_ADMIN
  const canCreate = canAccess([Role.SUPER_ADMIN, Role.OWNER])
  const canEdit = canAccess([Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER])
  const canDelete = canAccess([Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER]) // Temporary: Allow MANAGER to delete

  // Fetch tenants for Super Admin tenant selector
  const { data: tenants } = useTenants(
    { page: 1, limit: 100 }, 
    { enabled: isSuperAdmin }
  )

  // Fetch locations using unified branches API - two-view architecture
  const { data: tenantLocationsData, isLoading: tenantLoading, error: tenantError } = useBranchesByTenant(
    isSuperAdmin ? (selectedTenantId || '') : (profile?.tenantId || ''),
    { includeDeleted: showDeleted }
  )
  const { data: systemWideData, isLoading: systemLoading, error: systemError } = useBranchesSystemWide(
    isSuperAdmin && !selectedTenantId,
    showDeleted
  )

  // Combine loading and error states
  const isLoading = isSuperAdmin ? (selectedTenantId ? tenantLoading : systemLoading) : tenantLoading
  const error = isSuperAdmin ? (selectedTenantId ? tenantError : systemError) : tenantError

  const createLocation = useCreateBranch()
  const updateLocation = useUpdateBranch()
  const deleteLocation = useDeleteBranch()
  const restoreLocation = useRestoreBranch()
  const bulkReassignUsers = useBulkReassignUsers()
  const forceDeleteBranch = useForceDeleteBranch()
  
  // Branch users query (only fetch when advanced delete dialog is open)
  const { data: branchUsers, isLoading: branchUsersLoading } = useBranchUsers(
    advancedDeleteDialogOpen && selectedLocation ? selectedLocation.id : ''
  )

  // Fetch subscription status for branch limit checking
  // Only fetch when we have both profile and tenantId to avoid auth errors
  const targetTenantId = isSuperAdmin ? selectedTenantId : profile?.tenantId
  const shouldFetchSubscription = !!profile && !!targetTenantId
  const { data: subscriptionStatus } = useSubscriptionStatus(
    shouldFetchSubscription ? targetTenantId : undefined
  )

  // Handle data based on view type
  const locations = isSuperAdmin && !selectedTenantId ? (systemWideData || []) : (tenantLocationsData || [])
  
  // Count active locations for the current tenant
  const activeLocationsCount = locations.filter((loc: Branch) => loc.isActive).length
  const isLastActiveBranch = activeLocationsCount === 1

  const filteredLocations = locations.filter((location: Branch) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.address?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: locations.length,
    active: locations.filter((loc: Branch) => loc.isActive).length,
    totalMembers: locations.reduce((sum: number, location: Branch) => sum + ((location._count as any)?.gymUserBranches || (location._count as any)?.activeMembers || 0), 0),
    totalStaff: locations.reduce((sum: number, location: Branch) => sum + ((location._count as any)?.staff || 0), 0)
  }

  const handleCreateLocation = async () => {
    // For Super Admin, require tenant selection; for others, use their tenantId
    const targetTenantId = isSuperAdmin ? selectedTenantId : profile?.tenantId
    
    if (!targetTenantId || !formData.name || !formData.address) {
      toast.error(isSuperAdmin 
        ? 'Please select a tenant and fill in all required fields'
        : 'Please fill in all required fields'
      )
      return
    }

    try {
      await createLocation.mutateAsync({
        tenantId: targetTenantId,
        name: formData.name,
        address: formData.address,
        phoneNumber: formData.phone || undefined,
        email: formData.email || undefined,
        isMainBranch: formData.isMainBranch,
      })
      toast.success('Location created successfully!')
      setCreateDialogOpen(false)
      setFormData({ name: '', address: '', phone: '', email: '', isMainBranch: false })
    } catch (error: any) {
      // Extract and show the actual error message
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to create location. Please try again.'
      toast.error(errorMessage)
      // Don't log the full error to console in production
    }
  }

  const handleDeleteLocation = async () => {
    if (!selectedLocation) return

    try {
      await deleteLocation.mutateAsync(selectedLocation.id)
      toast.success('Location deleted successfully!')
      setDeleteDialogOpen(false)
      setSelectedLocation(null)
    } catch (error: any) {
      // Check if it's a 409 conflict (members assigned)
      if (error?.response?.status === 409) {
        // Close the delete dialog
        setDeleteDialogOpen(false)
        
        // Fetch the full member list for this branch
        try {
          const branchUsersResponse = await branchesApi.getBranchUsers(selectedLocation.id)
          const members = branchUsersResponse?.users?.byRole?.members || []
          
          if (members.length > 0) {
            // Show generic message
            const memberCount = members.length
            toast.error(`Cannot delete location: ${memberCount} member${memberCount !== 1 ? 's' : ''} must be reassigned first.`)
            
            // Store members and branch ID for reassignment
            setMembersToReassign(members)
            setBranchToDeleteId(selectedLocation.id)
            setReassignModalOpen(true)
          } else {
            toast.error('No members found to reassign. Please try again.')
          }
        } catch (fetchError) {
          console.error('Failed to fetch branch members:', fetchError)
          toast.error('Failed to load members. Please try again.')
        }
      } else {
        toast.error('Failed to delete location. Please try again.')
        console.error('Failed to delete location:', error)
      }
    }
  }

  const openEditDialog = (location: Branch) => {
    setSelectedLocation(location)
    setFormData({
      name: location.name,
      address: location.address || '',
      phone: location.phoneNumber || '',
      email: location.email || '',
      isMainBranch: location.isMainBranch || false
    })
    setEditDialogOpen(true)
  }

  const handleUpdateLocation = async () => {
    if (!selectedLocation || !formData.name || !formData.address) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await updateLocation.mutateAsync({
        id: selectedLocation.id,
        data: {
          name: formData.name,
          address: formData.address,
          phoneNumber: formData.phone || undefined,
          email: formData.email || undefined,
          isMainBranch: formData.isMainBranch
        }
      })
      toast.success('Location updated successfully!')
      setEditDialogOpen(false)
      setSelectedLocation(null)
      setFormData({ name: '', address: '', phone: '', email: '', isMainBranch: false })
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to update location. Please try again.'
      toast.error(errorMessage)
    }
  }

  const isMainBranch = (location: Branch) => {
    // Use the actual isMainBranch field from database
    return location.isMainBranch === true
  }

  const canEditLocation = (location: Branch) => {
    if (!canEdit) return false
    // Main branch can only be edited by SUPER_ADMIN or OWNER
    if (isMainBranch(location)) {
      return userRole === Role.SUPER_ADMIN || userRole === Role.OWNER
    }
    return true
  }

  const canDeleteLocation = (location: Branch) => {
    if (!canDelete) return false
    // Main branch can only be deleted by SUPER_ADMIN or OWNER with special confirmation
    if (isMainBranch(location)) {
      return userRole === Role.SUPER_ADMIN || userRole === Role.OWNER
    }
    return true
  }

  const openDeleteDialog = (location: Branch) => {
    const hasAssignedUsers = (location._count?.userBranches || 0) > 0
    
    setSelectedLocation(location)
    
    if (hasAssignedUsers || isMainBranch(location)) {
      // Open advanced deletion workflow for complex scenarios
      setSelectedUserIds([])
      setTargetBranchId('')
      setDeleteReason('')
      setForceDeleteConfirmation('')
      setAdvancedDeleteDialogOpen(true)
    } else {
      // Simple deletion for branches without users
      setDeleteDialogOpen(true)
    }
  }

  const handleRestoreLocation = async (location: Branch) => {
    try {
      await restoreLocation.mutateAsync(location.id)
      toast.success(`Location "${location.name}" restored successfully!`)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to restore location'
      toast.error(errorMessage)
      console.error('Failed to restore location:', error)
    }
  }

  // Prepare stats for mobile-first layout
  const locationStats: StatItem[] = [
    {
      key: 'total',
      label: 'Total',
      value: stats.total,
      icon: Building2,
      color: 'text-gray-700 dark:text-gray-300',
      description: 'Your gym locations'
    },
    {
      key: 'active',
      label: 'Active',
      value: stats.active,
      icon: MapPin,
      color: 'text-green-700 dark:text-green-400',
      description: 'Currently operating'
    },
    {
      key: 'totalMembers',
      label: 'Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'text-blue-700 dark:text-blue-400',
      description: stats.totalMembers === 0 ? 'No members yet' : 'Across all locations'
    },
    {
      key: 'totalStaff',
      label: 'Staff',
      value: stats.totalStaff,
      icon: Users,
      color: 'text-purple-700 dark:text-purple-400',
      description: 'All team members'
    }
  ]

  // Compact summary for mobile (first 3 most important stats)
  const compactSummary = [
    locationStats[0], // Total
    locationStats[1], // Active
    locationStats[2], // Members
  ]

  return (
    <div className="space-y-4">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            {isSuperAdmin ? 'System Locations' : 'Gym Locations'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isSuperAdmin 
              ? 'Manage all gym locations across tenants' 
              : 'Manage your gym locations and their details'
            }
          </p>
          
          {/* Role badge */}
          <div className="mt-2">
            <Badge variant={isSuperAdmin ? 'default' : 'secondary'} className="text-xs">
              {userRole} ACCESS
            </Badge>
          </div>
        </div>
        {canCreate && (
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="w-full sm:w-auto"
            disabled={(isSuperAdmin && !selectedTenantId) || (subscriptionStatus && !subscriptionStatus.canCreate)}
            title={subscriptionStatus && !subscriptionStatus.canCreate ? subscriptionStatus.reason : undefined}
          >
            <Plus className="w-4 h-4 mr-2" />
            {subscriptionStatus && !subscriptionStatus.canCreate ? 'Branch Limit Reached' : 'Add Location'}
          </Button>
        )}
      </div>

      {/* Mobile-First Stats Overview */}
      <CollapsibleStatsOverview 
        title="Location Statistics"
        stats={locationStats}
        compactSummary={compactSummary}
      />

      {/* Super Admin Tenant Selector */}
      {isSuperAdmin && (
        <Card className="border-2 shadow-md bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Building2 className="h-5 w-5" />
              Tenant Filter
            </CardTitle>
            <CardDescription>
              Select a specific tenant to manage their locations, or view all locations system-wide
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select
                  value={selectedTenantId || 'all'}
                  onValueChange={(value) => setSelectedTenantId(value === 'all' ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tenant to manage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">All Tenants</span>
                        <Badge variant="secondary" className="ml-2">System View</Badge>
                      </div>
                    </SelectItem>
                    {tenants?.data?.map((tenant: Tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full" />
                          <span>{tenant.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {tenant._count?.branches || 0} locations
                          </Badge>
                        </div>
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTenantId && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Managing:</span>
                  <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {tenants?.data?.find((t: Tenant) => t.id === selectedTenantId)?.name || 'Selected Tenant'}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Directory - Priority Position for Mobile */}
      <Card className="border-2 shadow-md bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Location Directory
          </CardTitle>
          <CardDescription>
            Manage your gym locations and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showDeleted"
                checked={showDeleted}
                onCheckedChange={(checked) => setShowDeleted(checked as boolean)}
              />
              <Label htmlFor="showDeleted" className="text-sm font-medium whitespace-nowrap">
                Show deleted
              </Label>
            </div>
          </div>

          {/* Locations List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">Loading locations...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                Failed to load locations. Please try again.
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No locations found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Try adjusting your search.' : 'Get started by adding your first gym location.'}
                </p>
              </div>
            ) : (
              filteredLocations.map((location: Branch) => (
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      {location.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{location.name}</h4>
                        {isMainBranch(location) && (
                          <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 bg-amber-50">
                            MAIN
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {location.address}
                        </div>
                        {location.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {location.phoneNumber}
                          </div>
                        )}
                        {location.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {location.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={location.isActive ? "default" : "destructive"} className="mb-1">
                          {location.isActive ? 'ACTIVE' : 'DELETED'}
                        </Badge>
                        
                        {/* Member/staff info */}
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                            <Users className="h-3 w-3 mr-1" />
                            {(location._count as any)?.gymUserBranches || (location._count as any)?.activeMembers || 0} members
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                            <Users className="h-3 w-3 mr-1" />
                            {location._count?.staff || 0} staff
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Created: {new Date(location.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {location.isActive ? (
                      // Active locations - show edit/delete options
                      (canEditLocation(location) || canDeleteLocation(location)) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditLocation(location) && (
                            <DropdownMenuItem onClick={() => openEditDialog(location)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Location
                              {isMainBranch(location) && (
                                <Badge variant="outline" className="ml-2 text-xs border-amber-200 text-amber-700">
                                  Main
                                </Badge>
                              )}
                            </DropdownMenuItem>
                          )}
                          {canDeleteLocation(location) && (
                            isLastActiveBranch && location.isActive ? (
                              <DropdownMenuItem disabled>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cannot Delete Last Location
                                <Badge variant="outline" className="ml-2 text-xs border-amber-200 text-amber-700">
                                  Required
                                </Badge>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => openDeleteDialog(location)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Location
                                {isMainBranch(location) && (
                                  <Badge variant="outline" className="ml-2 text-xs border-red-200 text-red-700">
                                    Restricted
                                  </Badge>
                                )}
                              </DropdownMenuItem>
                            )
                          )}
                          {!canEditLocation(location) && !canDeleteLocation(location) && (
                            <DropdownMenuItem disabled>
                              <span className="text-muted-foreground text-xs">Read-only access</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                        </DropdownMenu>
                      )
                    ) : (
                      // Deleted locations - show restore option if user has permission AND within branch limit
                      canDelete && (
                        (subscriptionStatus && !subscriptionStatus.canCreate) ? (
                          // Show info message when branch limit is reached
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                              Limit Reached
                            </Badge>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[150px] text-right">
                              {subscriptionStatus.reason}
                            </p>
                          </div>
                        ) : (
                          // Show restore button when within limit
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreLocation(location)}
                            disabled={restoreLocation.isPending}
                            className="text-green-600 hover:text-green-700"
                          >
                            {restoreLocation.isPending ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <RotateCcw className="w-4 h-4 mr-2" />
                            )}
                            Restore
                            {isMainBranch(location) && (
                              <Badge variant="outline" className="ml-2 text-xs border-amber-200 text-amber-700">
                                Main
                              </Badge>
                            )}
                          </Button>
                        )
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Location Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Add New Location
            </DialogTitle>
            <DialogDescription>
              Create a new gym location for your business.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Downtown Gym"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="123 Fitness Street, City, Country"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="location@gym.com"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isMainBranch"
                checked={formData.isMainBranch}
                onCheckedChange={(checked) => setFormData({...formData, isMainBranch: checked as boolean})}
              />
              <Label htmlFor="isMainBranch" className="text-sm font-medium cursor-pointer">
                Set as Main Branch
              </Label>
            </div>
            {formData.isMainBranch && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>Note:</strong> If another branch is already set as main, it will be automatically unset.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateDialogOpen(false)
                setFormData({ name: '', address: '', phone: '', email: '', isMainBranch: false })
              }}
              disabled={createLocation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLocation}
              disabled={createLocation.isPending || !formData.name || !formData.address}
            >
              {createLocation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Location
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Edit Location
              {selectedLocation && isMainBranch(selectedLocation) && (
                <Badge variant="outline" className="ml-2 text-xs border-amber-200 text-amber-700 bg-amber-50">
                  Main Branch
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Update the details for "{selectedLocation?.name}".
            </DialogDescription>
            {selectedLocation && isMainBranch(selectedLocation) && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                ⚠️ This appears to be your main branch. Changes will affect your primary location.
              </div>
            )}
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Location Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Downtown Gym"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Address *</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="123 Fitness Street, City, Country"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="location@gym.com"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="edit-isMainBranch"
                checked={formData.isMainBranch}
                onCheckedChange={(checked) => setFormData({...formData, isMainBranch: checked as boolean})}
              />
              <Label htmlFor="edit-isMainBranch" className="text-sm font-medium cursor-pointer">
                Set as Main Branch
              </Label>
            </div>
            {formData.isMainBranch && !selectedLocation?.isMainBranch && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>Note:</strong> If another branch is already set as main, it will be automatically unset.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditDialogOpen(false)
                setSelectedLocation(null)
                setFormData({ name: '', address: '', phone: '', email: '', isMainBranch: false })
              }}
              disabled={updateLocation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateLocation}
              disabled={updateLocation.isPending || !formData.name || !formData.address}
            >
              {updateLocation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Location
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Location
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedLocation?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedLocation(null)
              }}
              disabled={deleteLocation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteLocation}
              disabled={deleteLocation.isPending}
            >
              {deleteLocation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Location
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reassign Members Modal */}
      <BulkReassignMembersModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        branchToDelete={selectedLocation}
        members={membersToReassign}
        availableBranches={locations.filter((loc: Branch) => loc.id !== branchToDeleteId && loc.isActive)}
        onReassignComplete={async () => {
          // After successful reassignment, retry deletion
          if (branchToDeleteId) {
            try {
              await deleteLocation.mutateAsync(branchToDeleteId)
              toast.success('Members reassigned and location deleted successfully!')
              setReassignModalOpen(false)
              setMembersToReassign([])
              setBranchToDeleteId(null)
              setSelectedLocation(null)
            } catch (error: any) {
              toast.error('Failed to delete location after reassignment. Please try again.')
              console.error('Failed to delete after reassignment:', error)
            }
          }
        }}
      />

      {/* Advanced Delete Dialog - For main branches and locations with users */}
      <Dialog open={advancedDeleteDialogOpen} onOpenChange={setAdvancedDeleteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Advanced Delete: {selectedLocation?.name}
            </DialogTitle>
            <DialogDescription>
              This location requires advanced deletion workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedLocation && isMainBranch(selectedLocation) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 font-medium">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  Main Branch Protection
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  This appears to be your main branch. Deleting it may affect your business operations.
                </p>
              </div>
            )}

            {branchUsers && branchUsers.users?.total > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <Users className="w-4 h-4" />
                  Users Assigned ({branchUsers.users.total})
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {branchUsers.users.byRole.staff.length} staff, {branchUsers.users.byRole.members.length} members
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Users will be unassigned when this location is deleted.
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="delete-reason">Reason for deletion *</Label>
              <Input
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g., Location closed, consolidating operations"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="force-confirmation">Type "FORCE DELETE" to confirm *</Label>
              <Input
                id="force-confirmation"
                value={forceDeleteConfirmation}
                onChange={(e) => setForceDeleteConfirmation(e.target.value)}
                placeholder="FORCE DELETE"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setAdvancedDeleteDialogOpen(false)
                setSelectedLocation(null)
                setDeleteReason('')
                setForceDeleteConfirmation('')
              }}
              disabled={forceDeleteBranch.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                if (!selectedLocation || !deleteReason || forceDeleteConfirmation !== 'FORCE DELETE') {
                  toast.error('Please fill in all required fields and type "FORCE DELETE" to confirm')
                  return
                }

                try {
                  await forceDeleteBranch.mutateAsync({
                    branchId: selectedLocation.id,
                    data: {
                      reason: deleteReason,
                      confirmationText: forceDeleteConfirmation
                    }
                  })
                  toast.success('Location deleted successfully!')
                  setAdvancedDeleteDialogOpen(false)
                  setSelectedLocation(null)
                  setDeleteReason('')
                  setForceDeleteConfirmation('')
                } catch (error) {
                  toast.error('Failed to delete location. Please try again.')
                  console.error('Failed to force delete location:', error)
                }
              }}
              disabled={forceDeleteBranch.isPending || !deleteReason || forceDeleteConfirmation !== 'FORCE DELETE'}
            >
              {forceDeleteBranch.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Location
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
