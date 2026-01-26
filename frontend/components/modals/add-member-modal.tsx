'use client'

import { useState } from 'react'

import { useProfile } from '@/lib/hooks/use-gym-users'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { useSendWelcomeEmail } from '@/lib/hooks/use-email'
import { useTenantSettings } from '@/lib/hooks/use-tenant-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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

import { 
  Mail, 
  Phone,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'
import { toast } from 'react-toastify'
import { membersApi } from '@/lib/api/gym-members'
import { gymMemberPhotosApi } from '@/lib/api/gym-member-photos'
import PhotoUpload from '@/components/members/photo-upload'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { splitName } from '@/lib/utils/member-helpers'

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onMemberAdded?: () => void
}

export function AddMemberModal({
  isOpen,
  onClose,
  onMemberAdded
}: AddMemberModalProps) {
  const { data: profile } = useProfile()
  const { data: tenantSettings } = useTenantSettings()
   const queryClient = useQueryClient()

   // Email hooks
   const sendWelcomeEmailMutation = useSendWelcomeEmail()

   // Create gym member mutation (creates both User + GymMemberProfile)
  const createGymMemberMutation = useMutation({
    mutationFn: (data: any) => membersApi.createGymMember(data),
    onSuccess: () => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['gym-members'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showOptionalDetails, setShowOptionalDetails] = useState(false)
  
   // Form data with single name field (required)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    photoFile: null as File | null,
    photoPreviewUrl: null as string | null,
    
    // Days selection (like renewal modal)
    selectedDays: 30 as number | null,
    showCustomDaysInput: false,
    paymentAmount: '',
    
    // Optional details (collapsed by default)
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    fitnessGoals: '',
    fitnessLevel: '',
    
    // Emergency contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    
    // Notes
    notes: '',
    
    // Branch assignment
    selectedBranchId: '',
  })

  const { data: branches, isLoading: branchesLoading } = useBranchesByTenant(profile?.tenantId || '')
  
  // Ensure branches is always an array and filter active ones
  const safeBranches = Array.isArray(branches) ? branches.filter((b: any) => b.isActive) : []
  const showBranchSelection = safeBranches.length > 1


  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handlePhotoChange = (file: File | null, previewUrl: string | null) => {
    setFormData(prev => ({
      ...prev,
      photoFile: file,
      photoPreviewUrl: previewUrl
    }))
    setPhotoPreview(previewUrl)
  }

  // Days selection handlers (same as renewal modal)
  const handleDaysChange = (days: number) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: days,
      showCustomDaysInput: false
    }))
  }

  const handleCustomDaysChange = (days: number) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: days
    }))
  }

  const handleShowCustomDays = () => {
    setFormData(prev => ({
      ...prev,
      selectedDays: null,
      showCustomDaysInput: true
    }))
  }


  // Validation logic - name, days, and payment amount are required
  const getValidation = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    // Validate days (same as renewal modal)
    if (!formData.selectedDays || formData.selectedDays <= 0 || formData.selectedDays > 365) {
      errors.selectedDays = 'Please select valid days (1-365)'
    }
    
    // Validate payment amount
    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
      errors.paymentAmount = 'Payment amount must be greater than 0'
    }
    
    // Email validation only if provided (optional)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    // Branch validation - only required if multiple branches exist
    if (showBranchSelection && !formData.selectedBranchId) {
      errors.selectedBranchId = 'Please select a branch location'
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // Get current validation errors for display
  const currentErrors = getValidation().errors

  const validateForm = () => {
    const validation = getValidation()
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      try {
        toast.error(firstError)
      } catch {
        alert(firstError)
      }
    }
    return validation.isValid
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Prepare gym member data with backward compatibility
    const { firstName, lastName } = splitName(formData.name.trim())
    const gymMemberData = {
      name: formData.name.trim(),
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: formData.email.trim() || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      emergencyContactName: formData.emergencyContactName || undefined,
      emergencyContactPhone: formData.emergencyContactPhone || undefined,
      emergencyContactRelation: formData.emergencyContactRelationship || undefined,
      branchId: formData.selectedBranchId || undefined,
      notes: formData.notes || undefined,
      // Required for v1: days and payment amount (same as renewal)
      days: formData.selectedDays!,
      paymentAmount: parseFloat(formData.paymentAmount),
      // Optional personal details
      gender: formData.gender || undefined,
      height: formData.height ? parseInt(formData.height) : undefined,
      weight: formData.weight ? parseInt(formData.weight) : undefined,
      fitnessGoals: formData.fitnessGoals || undefined,
      fitnessLevel: formData.fitnessLevel || undefined,
    }

    // Create the gym member
    createGymMemberMutation.mutate(gymMemberData, {
      onSuccess: async (createdGymMember) => {
        try {
          console.log('✅ Gym member created successfully:', createdGymMember)

           // Send welcome email if enabled in tenant settings
           if (tenantSettings?.welcomeEmailEnabled && formData.email) {
            console.log('🎯 SENDING WELCOME EMAIL - enabled in tenant settings');
            console.log('📧 Member creation response:', createdGymMember);
            try {
               await sendWelcomeEmailMutation.mutateAsync({
                email: formData.email,
                name: formData.name.trim(),
                tenantId: profile?.tenantId || '',
                membershipPlanName: 'Basic Membership',
                registrationDate: new Date().toLocaleDateString(),
              })
              console.log('✅ Welcome email sent successfully')
            } catch (emailError) {
              console.warn('Welcome email failed to send, but member was created:', emailError)
            }
          }

          // Upload photo if provided
          if (formData.photoFile) {
            try {
              const userId = createdGymMember.userId || createdGymMember.user?.id
               console.log('🔍 Photo upload debug:', {
                userId: userId,
                memberName: formData.name.trim(),
                memberEmail: formData.email
              })
              
              const result = await gymMemberPhotosApi.uploadPhoto(userId, formData.photoFile)
              
              if (result.success) {
                console.log('✅ Photo uploaded successfully:', result.photoUrl)
              } else {
                throw new Error(result.message || 'Upload failed')
              }
             } catch (photoError) {
               console.warn('Photo upload failed, but member was created:', photoError)
               // Don't show error toast since member was created successfully
               // Photo is optional feature
             }
          }
          
          toast.success(`Member ${formData.name.trim()} added successfully!`)
          onMemberAdded?.()
          handleClose()
        } catch (postCreationError) {
          console.error('Error in post-creation steps:', postCreationError)
          toast.success(`Member ${formData.name.trim()} added successfully!`)
          toast.error('Note: Some additional setup failed, but member was created.')
          onMemberAdded?.()
          handleClose()
        }
      },
      onError: (error: any) => {
        console.error('Error creating gym member:', error)
        toast.error('Failed to add member')
      }
    })
  }

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      photoFile: null,
      photoPreviewUrl: null,
      selectedDays: 30,
      showCustomDaysInput: false,
      paymentAmount: '',
      dateOfBirth: '',
      gender: '',
      height: '',
      weight: '',
      fitnessGoals: '',
      fitnessLevel: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      notes: '',
      selectedBranchId: '',
    })
    setPhotoPreview(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Add New Member</h3>
              <p className="text-sm text-muted-foreground">
                Only name fields are required. All other details are optional.
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Add a new member to your gym. Upload a photo and fill in basic information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Upload - Always visible at top */}
          <div className="flex justify-center">
            <PhotoUpload
              temporaryMode={true}
              currentPhotoUrl={formData.photoPreviewUrl}
              onFileChange={handlePhotoChange}
              className="w-full max-w-sm"
            />
          </div>

          {/* Required Fields - Always visible */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                className={currentErrors.name ? "border-red-500" : ""}
              />
              {currentErrors.name && (
                <p className="text-sm text-red-500 mt-1">{currentErrors.name}</p>
              )}
            </div>

               {/* Days Selection (same as renewal modal) */}
             <div>
               <Label>Expiry Date *</Label>
               <p className="text-sm text-muted-foreground mb-3">
                 Choose membership duration in days
               </p>
               <div className="grid grid-cols-2 gap-2">
                 {[15, 30].map((days) => (
                   <Button
                     key={days}
                     type="button"
                     variant={formData.selectedDays === days ? "default" : "outline"}
                     onClick={() => handleDaysChange(days)}
                     className="h-12"
                   >
                     {days} days
                   </Button>
                 ))}
                 <Button
                   type="button"
                   variant={formData.showCustomDaysInput ? "default" : "outline"}
                   onClick={handleShowCustomDays}
                   className="h-12"
                 >
                   Custom
                 </Button>
               </div>

               {formData.showCustomDaysInput && (
                 <div className="mt-3">
                   <Label htmlFor="customDays" className="text-sm">Enter custom days (1-365)</Label>
                   <Input
                     id="customDays"
                     type="number"
                     min="1"
                     max="365"
                     value={formData.selectedDays || ''}
                     onChange={(e) => {
                       const value = parseInt(e.target.value)
                       if (value >= 1 && value <= 365) {
                         handleCustomDaysChange(value)
                       } else if (e.target.value === '') {
                         setFormData(prev => ({ ...prev, selectedDays: null }))
                       }
                     }}
                     placeholder="Enter number of days"
                     className="mt-1"
                   />
                 </div>
               )}
               {currentErrors.selectedDays && (
                 <p className="text-sm text-red-500 mt-1">{currentErrors.selectedDays}</p>
               )}
             </div>

             {/* Payment Amount */}
             <div>
               <Label htmlFor="paymentAmount">Payment Amount (₱) *</Label>
               <Input
                 id="paymentAmount"
                 type="number"
                 value={formData.paymentAmount}
                 onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
                 placeholder="0.00"
                 min="0"
                 step="0.01"
                 className={currentErrors.paymentAmount ? "border-red-500" : ""}
               />
               {currentErrors.paymentAmount && (
                 <p className="text-sm text-red-500 mt-1">{currentErrors.paymentAmount}</p>
               )}
             </div>

             {/* Branch Assignment */}
            {showBranchSelection ? (
              <div>
                <Label htmlFor="branchSelection">Branch Location *</Label>
                <Select 
                  value={formData.selectedBranchId} 
                  onValueChange={(value) => handleInputChange('selectedBranchId', value)}
                >
                  <SelectTrigger className={currentErrors.selectedBranchId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select branch location" />
                  </SelectTrigger>
                  <SelectContent>
                    {branchesLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading branches...</div>
                    ) : safeBranches.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{branch.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {branch.address}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentErrors.selectedBranchId && (
                  <p className="text-sm text-red-500 mt-1">{currentErrors.selectedBranchId}</p>
                )}
              </div>
            ) : safeBranches.length === 1 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Assigned to: <strong>{safeBranches[0]?.name}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Optional Details Section */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">More Details (Optional)</span>
                </div>
                {showOptionalDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
               {showOptionalDetails && (
                 <div className="space-y-4 pl-6">
                   {/* Contact Information */}
                   <div className="space-y-4">
                     <h4 className="font-medium text-sm">Contact Information (Optional)</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="email" className="text-sm">Email Address</Label>
                         <div className="relative">
                           <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                           <Input
                             id="email"
                             type="email"
                             value={formData.email}
                             onChange={(e) => handleInputChange('email', e.target.value)}
                             placeholder="john@example.com"
                             className="pl-10 text-sm"
                           />
                         </div>
                       </div>
                       <div>
                         <Label htmlFor="phoneNumber" className="text-sm">Phone Number</Label>
                         <div className="relative">
                           <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                           <Input
                             id="phoneNumber"
                             value={formData.phoneNumber}
                             onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                             placeholder="+63 912 345 6789"
                             className="pl-10 text-sm"
                           />
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Personal Details */}
                   <div className="space-y-4 pt-4 border-t">
                     <h4 className="font-medium text-sm">Personal Details</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth" className="text-sm">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender" className="text-sm">Gender</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fitnessLevel" className="text-sm">Fitness Level</Label>
                        <Select value={formData.fitnessLevel} onValueChange={(value) => handleInputChange('fitnessLevel', value)}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="height" className="text-sm">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={formData.height}
                          onChange={(e) => handleInputChange('height', e.target.value)}
                          placeholder="170"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight" className="text-sm">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          value={formData.weight}
                          onChange={(e) => handleInputChange('weight', e.target.value)}
                          placeholder="70"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="fitnessGoals" className="text-sm">Fitness Goals</Label>
                      <Input
                        id="fitnessGoals"
                        value={formData.fitnessGoals}
                        onChange={(e) => handleInputChange('fitnessGoals', e.target.value)}
                        placeholder="e.g., Weight Loss, Muscle Gain, General Fitness"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm">Emergency Contact</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="emergencyContactName" className="text-sm">Name</Label>
                        <Input
                          id="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                          placeholder="Contact name"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactPhone" className="text-sm">Phone</Label>
                        <Input
                          id="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                          placeholder="Contact phone"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactRelationship" className="text-sm">Relationship</Label>
                        <Input
                          id="emergencyContactRelationship"
                          value={formData.emergencyContactRelationship}
                          onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                          placeholder="e.g., Spouse, Parent"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="pt-4 border-t">
                    <Label htmlFor="notes" className="text-sm">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Any additional notes about this member..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1 min-h-[52px] sm:min-h-[44px] text-base sm:text-sm px-5 py-3 sm:px-4 sm:py-2.5" 
              disabled={createGymMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createGymMemberMutation.isPending || !formData.name.trim()}
              className="flex-1 min-h-[52px] sm:min-h-[44px] text-base sm:text-sm px-5 py-3 sm:px-4 sm:py-2.5"
            >
              {createGymMemberMutation.isPending ? 'Adding Member...' : 'Save Member'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}