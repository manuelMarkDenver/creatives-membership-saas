'use client'

import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-users'
import { useLocationsByTenant, useCreateLocation, useDeleteLocation } from '@/lib/hooks/use-locations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import { Location } from '@/types'
import { toast } from 'sonner'

export default function LocationsPage() {
  const { data: profile } = useProfile()
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })

  // Fetch locations using gym locations API
  const { data: tenantLocationsData, isLoading, error } = useLocationsByTenant(
    profile?.tenantId || ''
  )
  
  const createLocation = useCreateLocation()
  const deleteLocation = useDeleteLocation()

  const locations = tenantLocationsData || []

  const filteredLocations = locations.filter((location: Location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.address?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: locations.length,
    active: locations.filter((l: Location) => l.isActive !== false).length,
    totalMembers: locations.reduce((sum: number, location: Location) => sum + (location._count?.userBranches || 0), 0),
    totalStaff: locations.reduce((sum: number, location: Location) => sum + (location._count?.staff || 0), 0)
  }

  const handleCreateLocation = async () => {
    if (!profile?.tenantId || !formData.name || !formData.address) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await createLocation.mutateAsync({
        tenantId: profile.tenantId,
        name: formData.name,
        address: formData.address,
        phone: formData.phone || undefined,
        email: formData.email || undefined
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

  const openDeleteDialog = (location: Location) => {
    setSelectedLocation(location)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-8 w-8 text-blue-500" />
            Gym Locations
          </h1>
          <p className="text-muted-foreground">
            Manage your gym locations and their details
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Your gym locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently operating</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalMembers === 0 ? 'No members assigned yet' : 'Across all locations'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">All team members</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and List */}
      <Card>
        <CardHeader>
          <CardTitle>Location Directory</CardTitle>
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
              filteredLocations.map((location: Location) => (
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
                        <Badge variant={location.isActive ? "default" : "secondary"} className="mb-1">
                          {location.isActive ? 'ACTIVE' : 'INACTIVE'}
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
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Location
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => openDeleteDialog(location)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Location
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Location
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedLocation?.name}&quot;? This action cannot be undone.
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
