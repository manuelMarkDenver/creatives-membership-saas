'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { FormField, TextareaField, SelectField } from './form-field'
import { 
  createTenantSchema, 
  CreateTenantFormData, 
  defaultTenantValues 
} from '@/lib/schemas/tenant-schema'
import { Crown, User, Building2, Palette } from 'lucide-react'

interface CreateTenantFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTenantFormData) => Promise<void>
  isLoading?: boolean
}

const businessCategories = [
  { value: 'GYM', label: 'Gym & Fitness' },
  { value: 'COFFEE_SHOP', label: 'Coffee Shop' },
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'OTHER', label: 'Other' },
]

export default function CreateTenantForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateTenantFormProps) {
  const form = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: defaultTenantValues,
  })

  const handleSubmit = async (data: CreateTenantFormData) => {
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Create New Gym Tenant
          </DialogTitle>
          <DialogDescription>
            Set up a new gym tenant with owner details and trial access. This will create the tenant, 
            owner account, and first trial branch automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="owner">Owner</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-medium">Business Information</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  name="name"
                  label="Business Name"
                  form={form}
                  required
                  placeholder="e.g., FitZone Gym"
                  description="This will be the main identifier for the gym"
                />

                <SelectField
                  name="category"
                  label="Business Category"
                  form={form}
                  required
                  placeholder="Select category"
                  options={businessCategories}
                />

                <TextareaField
                  name="description"
                  label="Description"
                  form={form}
                  placeholder="Brief description of the business..."
                  rows={3}
                />

                <FormField
                  name="address"
                  label="Address"
                  form={form}
                  placeholder="123 Fitness Street, City, Country"
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="phoneNumber"
                    label="Phone Number"
                    form={form}
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                  />

                  <FormField
                    name="email"
                    label="Business Email"
                    form={form}
                    type="email"
                    placeholder="info@fitzonegym.com"
                  />
                </div>

                <FormField
                  name="websiteUrl"
                  label="Website URL"
                  form={form}
                  type="url"
                  placeholder="https://fitzonegym.com"
                />
              </div>
            </TabsContent>

            {/* Owner Information Tab */}
            <TabsContent value="owner" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-green-500" />
                <h3 className="text-sm font-medium">Owner Account Details</h3>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> This will create the owner's account automatically. 
                  They'll be assigned as the owner with full access to their gym tenant.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="ownerFirstName"
                    label="First Name"
                    form={form}
                    required
                    placeholder="John"
                  />

                  <FormField
                    name="ownerLastName"
                    label="Last Name"
                    form={form}
                    required
                    placeholder="Smith"
                  />
                </div>

                <FormField
                  name="ownerEmail"
                  label="Owner Email"
                  form={form}
                  type="email"
                  required
                  placeholder="john@fitzonegym.com"
                  description="This will be used for the owner's login account"
                />

                <FormField
                  name="ownerPhoneNumber"
                  label="Owner Phone"
                  form={form}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </TabsContent>

            {/* Admin Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
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

              <FormField
                name="freeBranchOverride"
                label="Additional Free Branches"
                form={form}
                type="number"
                placeholder="0"
                description="Extra free branches beyond the standard 1 trial branch (max: 10)"
              />
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-4 w-4 text-purple-500" />
                <h3 className="text-sm font-medium">Branding & Appearance</h3>
              </div>

              <FormField
                name="logoUrl"
                label="Logo URL"
                form={form}
                type="url"
                placeholder="https://example.com/logo.png"
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="primaryColor"
                  label="Primary Color"
                  form={form}
                  placeholder="#3B82F6"
                  description="Main brand color (hex code)"
                />

                <FormField
                  name="secondaryColor"
                  label="Secondary Color"
                  form={form}
                  placeholder="#8B5CF6"
                  description="Accent color (hex code)"
                />
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !form.formState.isValid}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Tenant...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Create Tenant
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
