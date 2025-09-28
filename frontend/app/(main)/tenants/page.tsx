'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { useTenants, useCreateTenant, useDeleteTenant, useUpdateTenant } from '@/lib/hooks/use-tenants'
import { useUpdateFreeBranchOverride } from '@/lib/hooks/use-subscription'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useTenantContext } from '@/lib/providers/tenant-context'
import { Tenant } from '@/types'
import { MoreHorizontal, Plus, Edit, Trash2, Crown, Gift, LogIn, ExternalLink, Building2, User, Palette, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import CreateTenantForm from '@/components/forms/create-tenant-form'
import { CreateTenantFormData } from '@/lib/schemas/tenant-schema'
import { toast } from 'sonner'

const businessCategories = [
  { value: 'GYM', label: 'Gym & Fitness' },
  { value: 'COFFEE_SHOP', label: 'Coffee Shop' },
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'OTHER', label: 'Other' },
]

export default function TenantsPage() {
  const { data: profile } = useProfile()
  const { setCurrentTenant } = useTenantContext()
  const router = useRouter()
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [overrideValue, setOverrideValue] = useState(0)
  const [editFormData, setEditFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    address: '',
    phoneNumber: '',
    email: '',
    websiteUrl: '',
    category: '',
    // Branding
    logoUrl: '',
    primaryColor: '',
    secondaryColor: ''
  })

  // All hooks must be called before any conditional returns
  const { data: tenantsData, isLoading } = useTenants()
  const createTenant = useCreateTenant()
  const deleteTenant = useDeleteTenant()
  const updateOverride = useUpdateFreeBranchOverride()
  const updateTenant = useUpdateTenant()

  // Check if user has Super Admin access (after hooks)
  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return (
      <div className="text-center py-12">
        <Crown className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You need Super Admin privileges to access tenant management.</p>
      </div>
    )
  }

  const tenants = tenantsData || []

  const handleCreateTenant = async (data: CreateTenantFormData) => {
    try {
      await createTenant.mutateAsync(data)
      toast.success('Tenant created successfully! Owner account and trial branch have been set up.')
    } catch (error) {
      console.error('Failed to create tenant:', error)
      toast.error('Failed to create tenant. Please try again.')
      throw error
    }
  }

  const handleUpdateOverride = async () => {
    if (!selectedTenant) return
    
    try {
      await updateOverride.mutateAsync({
        tenantId: selectedTenant.id,
        override: overrideValue,
      })
      toast.success(`Updated free branch override to ${overrideValue} for ${selectedTenant.name}`)
      setOverrideDialogOpen(false)
      setSelectedTenant(null)
    } catch (error) {
      console.error('Failed to update override:', error)
      toast.error('Failed to update free branch override')
    }
  }

  const openOverrideDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setOverrideValue(tenant.freeBranchOverride || 0)
    setOverrideDialogOpen(true)
  }

  const openEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setEditFormData({
      // Basic Information
      name: tenant.name,
      description: tenant.description || '',
      address: tenant.address || '',
      phoneNumber: tenant.phoneNumber || '',
      email: tenant.email || '',
      websiteUrl: tenant.websiteUrl || '',
      category: tenant.category || 'GYM',
      // Branding
      logoUrl: tenant.logoUrl || '',
      primaryColor: tenant.primaryColor || '',
      secondaryColor: tenant.secondaryColor || ''
    })
    setEditDialogOpen(true)
  }

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return
    
    try {
      const updateData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        address: editFormData.address.trim() || undefined,
        phoneNumber: editFormData.phoneNumber.trim() || undefined,
        email: editFormData.email.trim() || undefined,
        websiteUrl: editFormData.websiteUrl.trim() || undefined,
        category: editFormData.category,
        logoUrl: editFormData.logoUrl.trim() || undefined,
        primaryColor: editFormData.primaryColor.trim() || undefined,
        secondaryColor: editFormData.secondaryColor.trim() || undefined
      }
      
      await updateTenant.mutateAsync({
        id: selectedTenant.id,
        data: updateData
      })
      toast.success(`Updated tenant: ${editFormData.name}`)
      setEditDialogOpen(false)
      setSelectedTenant(null)
    } catch (error) {
      console.error('Failed to update tenant:', error)
      toast.error('Failed to update tenant details')
    }
  }

  const handleAccessTenant = (tenant: Tenant) => {
    // Switch to the tenant context
    setCurrentTenant(tenant)
    toast.success(`Switched to ${tenant.name}. You can now manage this tenant.`)
    // Navigate to the tenant's dashboard
    router.push('/dashboard')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tenant?')) {
      try {
        await deleteTenant.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete tenant:', error)
      }
    }
  }

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.getValue('category') as string
        return (
          <Badge variant="secondary">
            {category.replace('_', ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.getValue('description') as string
        return (
          <div className="max-w-[300px] truncate">
            {description || '-'}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return date.toLocaleDateString()
      },
    },
    {
      accessorKey: 'freeBranchOverride',
      header: 'Free Branches',
      cell: ({ row }) => {
        const override = row.getValue('freeBranchOverride') as number
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {1 + (override || 0)} free
            </Badge>
            {override > 0 && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                +{override} override
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const tenant = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAccessTenant(tenant)}>
                <LogIn className="mr-2 h-4 w-4" />
                Access Tenant
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(tenant)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openOverrideDialog(tenant)}>
                <Gift className="mr-2 h-4 w-4" />
                Free Branch Override
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(tenant.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (isLoading) {
    return <div>Loading tenants...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage your business tenants and their configurations.
          </p>
        </div>
        <Button onClick={() => setCreateFormOpen(true)} className="bg-amber-600 hover:bg-amber-700">
          <Crown className="mr-2 h-4 w-4" />
          Create Gym Tenant
        </Button>
      </div>
      
      <DataTable
        columns={columns}
        data={tenants}
        searchKey="name"
        searchPlaceholder="Search tenants..."
      />
      
      {/* Create Tenant Form */}
      <CreateTenantForm
        open={createFormOpen}
        onOpenChange={setCreateFormOpen}
        onSubmit={handleCreateTenant}
        isLoading={createTenant.isPending}
      />

      {/* Free Branch Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-500" />
              Free Branch Override
            </DialogTitle>
            <DialogDescription>
              Grant additional free branches to {selectedTenant?.name} for proof of concept.
              Standard is 1 trial branch. This allows extra free branches.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="override">Additional Free Branches</Label>
              <Input
                id="override"
                type="number"
                min="0"
                max="10"
                value={overrideValue}
                onChange={(e) => setOverrideValue(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Total free branches: {1 + overrideValue} (1 standard + {overrideValue} override)
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOverrideDialogOpen(false)}
              disabled={updateOverride.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateOverride}
              disabled={updateOverride.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {updateOverride.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Update Override
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Edit Tenant Details
            </DialogTitle>
            <DialogDescription>
              Update the complete details for {selectedTenant?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="grid gap-6">
                  {/* Name */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Tenant Name *</Label>
                    <Input
                      id="edit-name"
                      placeholder="Enter tenant name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  {/* Description */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Enter tenant description"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Address */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      placeholder="Enter business address"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  {/* Phone and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                      <Input
                        id="edit-phoneNumber"
                        placeholder="Enter phone number"
                        value={editFormData.phoneNumber}
                        onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        placeholder="Enter email address"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Website and Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-websiteUrl">Website URL</Label>
                      <Input
                        id="edit-websiteUrl"
                        placeholder="https://example.com"
                        value={editFormData.websiteUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, websiteUrl: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category">Business Category *</Label>
                      <Select
                        value={editFormData.category}
                        onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="branding" className="space-y-6 mt-6">
                <div className="grid gap-6">
                  {/* Logo URL */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-logoUrl">Logo URL</Label>
                    <Input
                      id="edit-logoUrl"
                      placeholder="https://example.com/logo.png"
                      value={editFormData.logoUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, logoUrl: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-primaryColor">Primary Color</Label>
                      <Input
                        id="edit-primaryColor"
                        placeholder="#000000"
                        value={editFormData.primaryColor}
                        onChange={(e) => setEditFormData({ ...editFormData, primaryColor: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-secondaryColor">Secondary Color</Label>
                      <Input
                        id="edit-secondaryColor"
                        placeholder="#ffffff"
                        value={editFormData.secondaryColor}
                        onChange={(e) => setEditFormData({ ...editFormData, secondaryColor: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              disabled={updateTenant.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTenant}
              disabled={updateTenant.isPending || !editFormData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateTenant.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Tenant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
