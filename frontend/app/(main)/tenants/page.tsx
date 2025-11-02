'use client'

import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { useTenants, useCreateTenant, useDeleteTenant, useUpdateTenant, useTenantOwner, useUpdateTenantOwner, useResetTenantOwnerPassword } from '@/lib/hooks/use-tenants'
import { useUpdateFreeBranchOverride } from '@/lib/hooks/use-subscription'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useTenantContext } from '@/lib/providers/tenant-context'
import { Tenant, BusinessCategory } from '@/types'
import { MoreHorizontal, Plus, Edit, Trash2, Crown, Gift, LogIn, ExternalLink, Building2, User, Palette, Settings, Copy, CheckCheck } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import CreateTenantForm from '@/components/forms/create-tenant-form'
import { CreateTenantFormData } from '@/lib/schemas/tenant-schema'
import { toast } from 'react-toastify'

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
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false)
  const [passwordResetData, setPasswordResetData] = useState<{ownerEmail: string, tempPassword: string, tenantName: string} | null>(null)
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
    secondaryColor: '',
    // Owner Details
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPhoneNumber: '',
    // Settings
    freeBranchOverride: 0,
    // Email Notification Preferences
    emailNotificationsEnabled: true,
    welcomeEmailEnabled: true,
    adminAlertEmailEnabled: true,
    tenantNotificationEmailEnabled: false,
    digestFrequency: '',
    adminEmailRecipients: [] as string[]
  })

  // All hooks must be called before any conditional returns
  const { data: tenantsData, isLoading } = useTenants()
  const createTenant = useCreateTenant()
  const deleteTenant = useDeleteTenant()
  const updateOverride = useUpdateFreeBranchOverride()
  const updateTenant = useUpdateTenant()
  const updateTenantOwner = useUpdateTenantOwner()
  const resetOwnerPassword = useResetTenantOwnerPassword()
  const { data: ownerData } = useTenantOwner(selectedTenant?.id || '')

  // Update form when owner data loads
  useEffect(() => {
    if (ownerData && selectedTenant) {
      setEditFormData(prev => ({
        ...prev,
        ownerFirstName: ownerData.firstName || '',
        ownerLastName: ownerData.lastName || '',
        ownerEmail: ownerData.email || '',
        ownerPhoneNumber: ownerData.phoneNumber || ''
      }))
    }
  }, [ownerData, selectedTenant])

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

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string = 'Text') => {
    try {
      await navigator.clipboard.writeText(text)
      // Toast notifications are now handled by the calling component
      return true
    } catch (error) {
      toast.error('Failed to copy to clipboard')
      return false
    }
  }

  const handleCreateTenant = async (data: CreateTenantFormData) => {
    try {
      const result = await createTenant.mutateAsync(data)
      
      // Show success message with temporary password if available
      if ((result as any)?.tempPassword) {
        const tempPassword = (result as any).tempPassword
        const ownerEmail = data.ownerEmail
        const tenantName = data.name
        
        // Set password reset data and open the modern modal
        setPasswordResetData({
          ownerEmail,
          tempPassword,
          tenantName
        })
        setPasswordResetModalOpen(true)
        
        // Show simple success toast
        toast.success(`🎉 Tenant "${tenantName}" created successfully!\nOwner account and trial branch have been set up.`, {
          autoClose: 5000
        })
      } else {
        toast.success('Tenant created successfully! Owner account and trial branch have been set up.')
      }
    } catch (error) {
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
      toast.error('Failed to update free branch override')
    }
  }

  const openOverrideDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setOverrideValue(tenant.freeBranchOverride || 0)
    setOverrideDialogOpen(true)
  }

  const openEditDialog = async (tenant: Tenant) => {
    setSelectedTenant(tenant)
    
    // Get owner details will be available via the hook when dialog opens
    // The useTenantOwner hook will automatically fetch when selectedTenant is set
    
    setEditFormData({
      // Basic Information
      name: tenant.name || '',
      description: tenant.description || '',
      address: tenant.address || '',
      phoneNumber: tenant.phoneNumber || '',
      email: tenant.email || '',
      websiteUrl: tenant.websiteUrl || '',
      category: tenant.category || 'GYM',
      // Branding
      logoUrl: tenant.logoUrl || '',
      primaryColor: tenant.primaryColor || '',
      secondaryColor: tenant.secondaryColor || '',
      // Owner Details - will be updated when ownerData loads
      ownerFirstName: ownerData?.firstName || '',
      ownerLastName: ownerData?.lastName || '',
      ownerEmail: ownerData?.email || '',
      ownerPhoneNumber: ownerData?.phoneNumber || '',
      // Settings
      freeBranchOverride: tenant.freeBranchOverride || 0,
      // Email Notification Preferences
      emailNotificationsEnabled: tenant.emailNotificationsEnabled ?? true,
      welcomeEmailEnabled: tenant.welcomeEmailEnabled ?? true,
      adminAlertEmailEnabled: tenant.adminAlertEmailEnabled ?? true,
      tenantNotificationEmailEnabled: tenant.tenantNotificationEmailEnabled ?? false,
      digestFrequency: tenant.digestFrequency || '',
      adminEmailRecipients: tenant.adminEmailRecipients || []
    })
    setEditDialogOpen(true)
  }

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return
    
    try {
      const tenantUpdateData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        address: editFormData.address.trim() || undefined,
        phoneNumber: editFormData.phoneNumber.trim() || undefined,
        email: editFormData.email.trim() || undefined,
        websiteUrl: editFormData.websiteUrl.trim() || undefined,
        category: editFormData.category as BusinessCategory,
        logoUrl: editFormData.logoUrl.trim() || undefined,
        primaryColor: editFormData.primaryColor.trim() || undefined,
        secondaryColor: editFormData.secondaryColor.trim() || undefined,
        freeBranchOverride: editFormData.freeBranchOverride,
        // Email Notification Preferences
        emailNotificationsEnabled: editFormData.emailNotificationsEnabled,
        welcomeEmailEnabled: editFormData.welcomeEmailEnabled,
        adminAlertEmailEnabled: editFormData.adminAlertEmailEnabled,
        tenantNotificationEmailEnabled: editFormData.tenantNotificationEmailEnabled,
        digestFrequency: editFormData.digestFrequency || undefined,
        adminEmailRecipients: editFormData.adminEmailRecipients
      }
      
      // Update tenant information
      await updateTenant.mutateAsync({
        id: selectedTenant.id,
        data: tenantUpdateData
      })
      
      // Update owner information if any fields are filled
      const ownerUpdateData = {
        firstName: editFormData.ownerFirstName.trim(),
        lastName: editFormData.ownerLastName.trim(),
        email: editFormData.ownerEmail.trim(),
        phoneNumber: editFormData.ownerPhoneNumber.trim() || undefined
      }
      
      // Update owner if any required fields are provided
      if (ownerUpdateData.firstName || ownerUpdateData.lastName || ownerUpdateData.email) {
        try {
          await updateTenantOwner.mutateAsync({
            tenantId: selectedTenant.id,
            data: ownerUpdateData
          })
          toast.success('Owner details updated successfully!')
        } catch (ownerError) {
          toast.error('Failed to update owner details: ' + (ownerError as Error).message)
          return // Exit early if owner update fails
        }
      }
      
      toast.success(`Updated tenant: ${editFormData.name}`)
      setEditDialogOpen(false)
      setSelectedTenant(null)
    } catch (error) {
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
      toast.error('Failed to delete tenant')
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="owner">Owner</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
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

              <TabsContent value="owner" className="space-y-6 mt-6">
                <div className="grid gap-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">
                      <strong>Owner Account:</strong> These are the details for the tenant owner who can log in to manage their business.
                    </p>
                  </div>

                  {/* Owner Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-ownerFirstName">Owner First Name *</Label>
                      <Input
                        id="edit-ownerFirstName"
                        placeholder="Enter first name"
                        value={editFormData.ownerFirstName}
                        onChange={(e) => setEditFormData({ ...editFormData, ownerFirstName: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-ownerLastName">Owner Last Name *</Label>
                      <Input
                        id="edit-ownerLastName"
                        placeholder="Enter last name"
                        value={editFormData.ownerLastName}
                        onChange={(e) => setEditFormData({ ...editFormData, ownerLastName: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Owner Contact */}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-ownerEmail">Owner Email *</Label>
                    <Input
                      id="edit-ownerEmail"
                      type="email"
                      placeholder="Enter owner email address"
                      value={editFormData.ownerEmail}
                      onChange={(e) => setEditFormData({ ...editFormData, ownerEmail: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-ownerPhoneNumber">Owner Phone Number</Label>
                    <Input
                      id="edit-ownerPhoneNumber"
                      placeholder="Enter owner phone number"
                      value={editFormData.ownerPhoneNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, ownerPhoneNumber: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  {/* Password Reset Section */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-amber-800">Password Management</h4>
                        <p className="text-xs text-amber-600 mt-1">
                          Generate a new temporary password for the tenant owner
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                          onClick={async () => {
                          if (!selectedTenant) {
                            toast.error('No tenant selected')
                            return
                          }
                          
                          try {
                            const result = await resetOwnerPassword.mutateAsync(selectedTenant.id)
                            
                            if (result && result.ownerEmail && result.tempPassword) {
                              setPasswordResetData(result)
                              setPasswordResetModalOpen(true)
                              
                              // Show success toast
                        toast.success(`🔑 Password reset successfully!\nNew temporary password generated for ${result.ownerEmail}`, {
                          autoClose: 4000
                        })
                            } else {
                              toast.error('Invalid response from server')
                            }
                          } catch (error) {
                            toast.error('Failed to reset owner password: ' + (error as Error).message)
                          }
                        }}
                        disabled={resetOwnerPassword.isPending}
                      >
                        {resetOwnerPassword.isPending ? 'Resetting...' : 'Reset Password'}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <div className="grid gap-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-medium">Super Admin Settings</h3>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-700">
                      <strong>Free Branch Override:</strong> Grant additional free branches for proof of concept. 
                      Default is 1 trial branch. Set to 0 for standard trial only.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-freeBranchOverride">Additional Free Branches</Label>
                    <Input
                      id="edit-freeBranchOverride"
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      value={editFormData.freeBranchOverride}
                      onChange={(e) => setEditFormData({ ...editFormData, freeBranchOverride: parseInt(e.target.value) || 0 })}
                      className="w-full"
                    />
                     <p className="text-xs text-muted-foreground">
                       Total free branches: {1 + editFormData.freeBranchOverride} (1 standard + {editFormData.freeBranchOverride} override)
                     </p>
                   </div>

                   {/* Email Notification Preferences */}
                   <div className="border-t pt-6 mt-6">
                     <div className="flex items-center gap-2 mb-4">
                       <Settings className="h-4 w-4 text-blue-500" />
                       <h3 className="text-sm font-medium">Email Notification Preferences</h3>
                     </div>

                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                           <Label htmlFor="edit-emailNotificationsEnabled">Enable Email Notifications</Label>
                           <p className="text-xs text-muted-foreground">
                             Allow this tenant to receive email notifications
                           </p>
                         </div>
                         <Switch
                           id="edit-emailNotificationsEnabled"
                           checked={editFormData.emailNotificationsEnabled}
                           onCheckedChange={(checked) => setEditFormData({ ...editFormData, emailNotificationsEnabled: checked })}
                         />
                       </div>

                       <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                           <Label htmlFor="edit-welcomeEmailEnabled">Welcome Emails</Label>
                           <p className="text-xs text-muted-foreground">
                             Send welcome emails to new members
                           </p>
                         </div>
                         <Switch
                           id="edit-welcomeEmailEnabled"
                           checked={editFormData.welcomeEmailEnabled}
                           onCheckedChange={(checked) => setEditFormData({ ...editFormData, welcomeEmailEnabled: checked })}
                           disabled={!editFormData.emailNotificationsEnabled}
                         />
                       </div>

                       <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                           <Label htmlFor="edit-adminAlertEmailEnabled">Admin Alerts</Label>
                           <p className="text-xs text-muted-foreground">
                             Send alerts when new tenants register
                           </p>
                         </div>
                         <Switch
                           id="edit-adminAlertEmailEnabled"
                           checked={editFormData.adminAlertEmailEnabled}
                           onCheckedChange={(checked) => setEditFormData({ ...editFormData, adminAlertEmailEnabled: checked })}
                           disabled={!editFormData.emailNotificationsEnabled}
                         />
                       </div>

                       <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                           <Label htmlFor="edit-tenantNotificationEmailEnabled">Tenant Notifications</Label>
                           <p className="text-xs text-muted-foreground">
                             Send notifications for member updates
                           </p>
                         </div>
                         <Switch
                           id="edit-tenantNotificationEmailEnabled"
                           checked={editFormData.tenantNotificationEmailEnabled}
                           onCheckedChange={(checked) => setEditFormData({ ...editFormData, tenantNotificationEmailEnabled: checked })}
                           disabled={!editFormData.emailNotificationsEnabled}
                         />
                       </div>

                       <div className="grid gap-2">
                         <Label htmlFor="edit-digestFrequency">Digest Frequency</Label>
                         <Select
                           value={editFormData.digestFrequency}
                           onValueChange={(value) => setEditFormData({ ...editFormData, digestFrequency: value })}
                           disabled={!editFormData.emailNotificationsEnabled}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="No digest emails" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="">No digest emails</SelectItem>
                             <SelectItem value="daily">Daily</SelectItem>
                             <SelectItem value="weekly">Weekly</SelectItem>
                             <SelectItem value="monthly">Monthly</SelectItem>
                           </SelectContent>
                         </Select>
                         <p className="text-xs text-muted-foreground">
                           Send periodic summary emails of tenant activity
                         </p>
                       </div>

                       <div className="grid gap-2">
                         <Label htmlFor="edit-adminEmailRecipients">Admin Email Recipients</Label>
                         <Textarea
                           id="edit-adminEmailRecipients"
                           placeholder="admin@example.com, support@example.com"
                           value={editFormData.adminEmailRecipients.join(', ')}
                           onChange={(e) => {
                             const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email)
                             setEditFormData({ ...editFormData, adminEmailRecipients: emails })
                           }}
                           disabled={!editFormData.emailNotificationsEnabled}
                           rows={2}
                         />
                         <p className="text-xs text-muted-foreground">
                           Comma-separated list of email addresses to receive admin alerts
                         </p>
                       </div>
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

      {/* Modern Password Reset Modal */}
      <Dialog open={passwordResetModalOpen} onOpenChange={setPasswordResetModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCheck className="h-5 w-5" />
              Password Reset Successful
            </DialogTitle>
            <DialogDescription>
              The tenant owner's password has been successfully reset. Please share these credentials securely.
            </DialogDescription>
          </DialogHeader>
          
          {passwordResetData && (
            <div className="space-y-4 py-4">
              {/* Tenant Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Tenant: {passwordResetData.tenantName}</p>
              </div>
              
              {/* Owner Email */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Owner Email</Label>
                <div className="flex items-center space-x-2 p-3 bg-muted/50 border rounded-lg">
                  <code className="flex-1 text-sm font-mono text-foreground bg-background px-2 py-1 rounded border">
                    {passwordResetData.ownerEmail}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-2 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-800 dark:hover:text-blue-200 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      try {
                        await navigator.clipboard.writeText(passwordResetData.ownerEmail)
                        toast.success('📧 Email copied!\nOwner email address copied to clipboard', {
                          autoClose: 2000
                        })
                      } catch (error) {
                        toast.error('Failed to copy email')
                      }
                    }}
                    title="Copy Email"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* New Password */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">New Temporary Password</Label>
                <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <code className="flex-1 text-sm font-mono text-foreground bg-background px-2 py-1 rounded border font-bold">
                    {passwordResetData.tempPassword}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-2 bg-amber-100 dark:bg-amber-800 hover:bg-amber-200 dark:hover:bg-amber-700 border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      try {
                        await navigator.clipboard.writeText(passwordResetData.tempPassword)
                        toast.success('🔑 Password copied!\nTemporary password copied to clipboard', {
                          autoClose: 2000
                        })
                      } catch (error) {
                        toast.error('Failed to copy password')
                      }
                    }}
                    title="Copy Password"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Security Note */}
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="flex items-start space-x-2">
                  <div className="text-amber-600 dark:text-amber-400 mt-0.5">🔐</div>
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">Security Note</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      The owner should change this password after their first login. Share this information through secure channels only.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPasswordResetModalOpen(false)
                setPasswordResetData(null)
              }}
            >
              Close
            </Button>
            <Button
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (passwordResetData) {
                  try {
                    await navigator.clipboard.writeText(passwordResetData.tempPassword)
                    toast.success('🔑 Password copied!\nTemporary password copied to clipboard - share it securely!', {
                      autoClose: 3000
                    })
                  } catch (error) {
                    toast.error('Failed to copy password')
                  }
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
