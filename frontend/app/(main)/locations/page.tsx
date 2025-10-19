'use client'

import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useBranchesByTenant, useBranchesSystemWide, useCreateBranch, useUpdateBranch, useDeleteBranch, useBranchUsers, useBulkReassignUsers, useForceDeleteBranch } from '@/lib/hooks/use-branches'
import { useTenants } from '@/lib/hooks/use-tenants'
import { useRoleNavigation } from '@/lib/hooks/use-role-navigation'
import { Role, Tenant } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CollapsibleStatsOverview, type StatItem } from '@/components/ui/collapsible-stats-overview'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Branch } from '@/types'
import { toast } from 'react-toastify'

export default function LocationsPage() {
  const { data: profile } = useProfile()
  const { canAccess } = useRoleNavigation(profile?.role)
  const [searchTerm, setSearchTerm] = useState('')
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
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })

  // Role-based access control
  const userRole = profile?.role as Role
  const isSuperAdmin = userRole === Role.SUPER_ADMIN
  const canCreate = canAccess([Role.SUPER_ADMIN, Role.OWNER])
  const canEdit = canAccess([Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER])
  const canDelete = canAccess([Role.SUPER_ADMIN, Role.OWNER])

  // Fetch tenants for Super Admin tenant selector
  const { data: tenants } = useTenants(
    { page: 1, limit: 100 }, 
    { enabled: isSuperAdmin }
  )

  // Fetch locations using unified branches API - two-view architecture
  const { data: tenantLocationsData, isLoading: tenantLoading, error: tenantError } = useBranchesByTenant(
    isSuperAdmin ? (selectedTenantId || '') : (profile?.tenantId || '')
  )
  const { data: systemWideData, isLoading: systemLoading, error: systemError } = useBranchesSystemWide(
    isSuperAdmin && !selectedTenantId
  )

  // Combine loading and error states
  const isLoading = isSuperAdmin ? (selectedTenantId ? tenantLoading : systemLoading) : tenantLoading
  const error = isSuperAdmin ? (selectedTenantId ? tenantError : systemError) : tenantError

  const createLocation = useCreateBranch()
  const updateLocation = useUpdateBranch()
  const deleteLocation = useDeleteBranch()
  const bulkReassignUsers = useBulkReassignUsers()
  const forceDeleteBranch = useForceDeleteBranch()
  
  // Branch users query (only fetch when advanced delete dialog is open)
  const { data: branchUsers, isLoading: branchUsersLoading } = useBranchUsers(
    advancedDeleteDialogOpen && selectedLocation ? selectedLocation.id : ''
  )

  // Handle data based on view type
  const locations = isSuperAdmin && !selectedTenantId ? (systemWideData || []) : (tenantLocationsData || [])

  const filteredLocations = locations.filter((location: Branch) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.address?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: locations.length,
    active: locations.length, // All locations are considered active (soft delete is used)
    totalMembers: locations.reduce((sum: number, location: Branch) => sum + (location._count?.userBranches || 0), 0),
    totalStaff: locations.reduce((sum: number, location: Branch) => sum + (location._count?.staff || 0), 0)
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
      })
      toast.success('Location created successfully!')
      setCreateDialogOpen(false)
      setFormData({ name: '', address: '', phone: '', email: '' })
    } catch (error) {
      toast.error('Failed to create location. Please try again.')
      console.error('Failed to create location:', error)
    }
  }

  const handleDeleteLocation = async () => {
    if (!selectedLocation) return

    try {
      await deleteLocation.mutateAsync(selectedLocation.id)
      toast.success('Location deleted successfully!')
      setDeleteDialogOpen(false)
      setSelectedLocation(null)
    } catch (error) {
      toast.error('Failed to delete location. Please try again.')
      console.error('Failed to delete location:', error)
    }
  }

  const openEditDialog = (location: Branch) => {
    setSelectedLocation(location)
    setFormData({
      name: location.name,
      address: location.address || '',
      phone: location.phoneNumber || '',
      email: location.email || ''
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
          email: formData.email || undefined
        }
      })
      toast.success('Location updated successfully!')
      setEditDialogOpen(false)
      setSelectedLocation(null)
      setFormData({ name: '', address: '', phone: '', email: '' })
    } catch (error) {
      toast.error('Failed to update location. Please try again.')
      console.error('Failed to update location:', error)
    }
  }

  const isMainBranch = (location: Branch) => {
    // Consider first branch or branch with name containing "main", "primary", "headquarters"
    const mainKeywords = ['main', 'primary', 'headquarters', 'head office', 'central']
    const locationName = location.name.toLowerCase()
    return mainKeywords.some(keyword => locationName.includes(keyword)) || 
           locations.length > 0 && locations[0]?.id === location.id
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
            disabled={isSuperAdmin && !selectedTenantId}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
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
          <div className="flex gap-4 mb-6">
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
                        <Badge variant="default" className="mb-1">
                          ACTIVE
                        </Badge>
                        
                        {/* Member/staff info */}
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                            <Users className="h-3 w-3 mr-1" />
                            {location._count?.userBranches || 0} members
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
                    
                    {(canEditLocation(location) || canDeleteLocation(location)) && (
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
                        )}
                        {!canEditLocation(location) && !canDeleteLocation(location) && (
                          <DropdownMenuItem disabled>
                            <span className="text-muted-foreground text-xs">Read-only access</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                      </DropdownMenu>
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
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateDialogOpen(false)
                setFormData({ name: '', address: '', phone: '', email: '' })
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
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditDialogOpen(false)
                setSelectedLocation(null)
                setFormData({ name: '', address: '', phone: '', email: '' })
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
    </div>
  )
}
