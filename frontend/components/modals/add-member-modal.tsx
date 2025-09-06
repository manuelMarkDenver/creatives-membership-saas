'use client'

import { useState, useRef } from 'react'
import { useMembershipPlans } from '@/lib/hooks/use-membership-plans'
import { useProfile, useCreateUser } from '@/lib/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Camera,
  UserPlus,
  Upload,
  Check,
  CreditCard,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { Role } from '@/types'
import { formatPHP } from '@/lib/utils/currency'
import { usersApi } from '@/lib/api'
import { gymSubscriptionsApi } from '@/lib/api/gym-subscriptions'
import { gymMemberPhotosApi } from '@/lib/api/gym-member-photos'
import PhotoUpload from '@/components/members/photo-upload'

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
  const createUserMutation = useCreateUser()
  const [step, setStep] = useState<'basic' | 'membership' | 'summary'>('basic')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showValidation, setShowValidation] = useState(false)
  
  // Basic Information
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    photoFile: null as File | null,
    photoPreviewUrl: null as string | null,
    notes: '',
    
    // Personal details
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
    
    // Preferences
    preferredWorkoutTime: '',
    favoriteEquipment: '',
    
    // Membership
    selectedPlanId: '',
    membershipStartDate: '',
    paymentAmount: '',
    paymentMethod: 'CASH',
    
    // Options
    sendWelcomeEmail: true,
    createAccountForMember: false
  })

  const { data: membershipPlans, isLoading: plansLoading } = useMembershipPlans()

  const selectedPlan = membershipPlans?.find((plan: any) => plan.id === formData.selectedPlanId)

  const calculateEndDate = () => {
    if (!selectedPlan || !formData.membershipStartDate) return ''
    
    const start = new Date(formData.membershipStartDate)
    const end = new Date(start)
    end.setDate(end.getDate() + selectedPlan.duration)
    
    return end.toISOString().split('T')[0]
  }

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


  // Validation logic that returns both success and errors
  const getBasicInfoValidation = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  const getMembershipValidation = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.selectedPlanId) {
      errors.selectedPlanId = 'Please select a membership plan'
    }
    if (!formData.membershipStartDate) {
      errors.membershipStartDate = 'Please select a start date'
    }
    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) < 0) {
      errors.paymentAmount = 'Please enter a valid payment amount'
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // Legacy validation functions for toasts (fallback)
  const validateBasicInfo = () => {
    const validation = getBasicInfoValidation()
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      // Fallback: show alert if toast doesn't work
      try {
        toast.error(firstError)
      } catch {
        alert(firstError)
      }
    }
    return validation.isValid
  }

  const validateMembership = () => {
    const validation = getMembershipValidation()
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      // Fallback: show alert if toast doesn't work
      try {
        toast.error(firstError)
      } catch {
        alert(firstError)
      }
    }
    return validation.isValid
  }
  
  // Determine if Next button should be disabled
  const canProceedFromBasic = getBasicInfoValidation().isValid
  const canProceedFromMembership = getMembershipValidation().isValid
  
  // Get current validation errors for display
  const currentBasicErrors = getBasicInfoValidation().errors
  const currentMembershipErrors = getMembershipValidation().errors

  const handleNext = () => {
    if (step === 'basic') {
      if (validateBasicInfo()) {
        setStep('membership')
      }
    } else if (step === 'membership') {
      if (validateMembership()) {
        setStep('summary')
      }
    }
  }

  const handleBack = () => {
    if (step === 'membership') {
      setStep('basic')
    } else if (step === 'summary') {
      setStep('membership')
    }
  }

  const handleSubmit = async () => {
    if (!validateBasicInfo() || !validateMembership()) {
      return
    }

    // Prepare profile data for the new gym member
    const profileData = {
      emergencyContactName: formData.emergencyContactName || null,
      emergencyContactPhone: formData.emergencyContactPhone || null,
      emergencyContactRelation: formData.emergencyContactRelationship || null,
      medicalConditions: null,
      fitnessGoals: formData.fitnessGoals || null,
      preferredTrainer: null,
      // New column structure
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
      gender: formData.gender || null,
      height: formData.height ? parseInt(formData.height) : null,
      weight: formData.weight ? parseInt(formData.weight) : null,
      fitnessLevel: formData.fitnessLevel || null,
      preferredWorkoutTime: formData.preferredWorkoutTime || null,
      favoriteEquipment: formData.favoriteEquipment || null,
      allergies: null,
      notifications: {
        email: true,
        sms: true,
        push: true
      },
      totalVisits: 0,
      averageVisitsPerWeek: 0,
      lastVisit: null,
      // Keep membershipHistory for past memberships
      membershipHistory: [],
      profileMetadata: {
        joinedDate: new Date().toISOString(),
        referralSource: 'Direct',
        specialNotes: ''
      }
    }

    // Create the member using the mutation hook
    createUserMutation.mutate({
      email: formData.email.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      role: 'CLIENT' as Role,
      tenantId: profile?.tenantId!,
    }, {
      onSuccess: async (createdUser) => {
        try {
          // Create gym member profile
          if (profileData.emergencyContactName || profileData.emergencyContactPhone || profileData.fitnessGoals) {
            // Note: This would need a new API endpoint to create gym member profiles
            // For now, we'll skip this step as the profile can be created later through the member info modal
            console.log('Profile data prepared:', profileData)
          }

          // Create subscription for the new member
          const subscriptionData = {
            membershipPlanId: formData.selectedPlanId,
            paymentMethod: formData.paymentMethod
          }

          await gymSubscriptionsApi.renewMembership(createdUser.id, subscriptionData)
          
          // Upload photo if provided
          if (formData.photoFile) {
            try {
              console.log('🔍 Photo upload debug:', {
                memberId: createdUser.id,
                memberName: `${formData.firstName} ${formData.lastName}`,
                memberEmail: formData.email
              })
              
              const result = await gymMemberPhotosApi.uploadPhoto(createdUser.id, formData.photoFile)
              
              if (result.success) {
                console.log('✅ Photo uploaded successfully:', result.photoUrl)
                // Photo uploaded successfully, no need for additional actions here
                // The photo URL is already saved in the database by the backend
              } else {
                throw new Error(result.message || 'Upload failed')
              }
            } catch (photoError) {
              console.warn('Photo upload failed, but member was created:', photoError)
              // Don't fail the entire process if photo upload fails
            }
          }
          
          toast.success(`Member ${formData.firstName} ${formData.lastName} added successfully with active subscription!`)
          onMemberAdded?.()
          handleClose()
        } catch (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError)
          // User was created but subscription failed - still show success but with warning
          toast.success(`Member ${formData.firstName} ${formData.lastName} added successfully!`)
          toast.error('Note: Subscription setup failed. Please create subscription manually.')
          onMemberAdded?.()
          handleClose()
        }
      },
      onError: (error: any) => {
        console.error('Error creating member:', error)
        toast.error('Failed to add member')
      }
    })
  }

  const handleClose = () => {
    setStep('basic')
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      photoFile: null,
      photoPreviewUrl: null,
      notes: '',
      dateOfBirth: '',
      gender: '',
      height: '',
      weight: '',
      fitnessGoals: '',
      fitnessLevel: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      preferredWorkoutTime: '',
      favoriteEquipment: '',
      selectedPlanId: '',
      membershipStartDate: '',
      paymentAmount: '',
      paymentMethod: 'CASH',
      sendWelcomeEmail: true,
      createAccountForMember: false
    })
    setPhotoPreview(null)
    onClose()
  }

  // Auto-fill payment amount when plan is selected
  const handlePlanChange = (planId: string) => {
    handleInputChange('selectedPlanId', planId)
    const plan = membershipPlans?.find((p: any) => p.id === planId)
    if (plan) {
      handleInputChange('paymentAmount', plan.price.toString())
    }
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
                Step {step === 'basic' ? '1' : step === 'membership' ? '2' : '3'} of 3: {
                  step === 'basic' ? 'Basic Information' : 
                  step === 'membership' ? 'Membership Plan' : 'Review & Confirm'
                }
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            {step === 'basic' ? 'Enter the member\'s basic information and personal details.' :
             step === 'membership' ? 'Select a membership plan and payment details.' :
             'Review all information before adding the member.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          {step === 'basic' && (
            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="flex justify-center">
                <PhotoUpload
                  temporaryMode={true}
                  currentPhotoUrl={formData.photoPreviewUrl}
                  onFileChange={handlePhotoChange}
                  className="w-full max-w-sm"
                />
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    className={currentBasicErrors.firstName ? "border-red-500" : ""}
                  />
                  {currentBasicErrors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{currentBasicErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    className={currentBasicErrors.lastName ? "border-red-500" : ""}
                  />
                  {currentBasicErrors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{currentBasicErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@example.com"
                      className={`pl-10 ${currentBasicErrors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {currentBasicErrors.email && (
                    <p className="text-sm text-red-500 mt-1">{currentBasicErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="+63 912 345 6789"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
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
                  <Label htmlFor="fitnessLevel">Fitness Level</Label>
                  <Select value={formData.fitnessLevel} onValueChange={(value) => handleInputChange('fitnessLevel', value)}>
                    <SelectTrigger>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    placeholder="170"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="70"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fitnessGoals">Fitness Goals</Label>
                <Input
                  id="fitnessGoals"
                  value={formData.fitnessGoals}
                  onChange={(e) => handleInputChange('fitnessGoals', e.target.value)}
                  placeholder="e.g., Weight Loss, Muscle Gain, General Fitness"
                />
              </div>

              {/* Emergency Contact */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                      placeholder="Contact phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                    <Input
                      id="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes about this member..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Membership Plan */}
          {step === 'membership' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="membershipPlan">Membership Plan *</Label>
                <Select value={formData.selectedPlanId} onValueChange={handlePlanChange}>
                  <SelectTrigger className={currentMembershipErrors.selectedPlanId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a membership plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plansLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading plans...</div>
                    ) : membershipPlans?.filter((plan: any) => plan.isActive).map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{plan.name}</span>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-green-600 font-medium">
                              {formatPHP(parseFloat(plan.price))}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {plan.duration} days
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentMembershipErrors.selectedPlanId && (
                  <p className="text-sm text-red-500 mt-1">{currentMembershipErrors.selectedPlanId}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="membershipStartDate">Start Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="membershipStartDate"
                      type="date"
                      value={formData.membershipStartDate}
                      onChange={(e) => handleInputChange('membershipStartDate', e.target.value)}
                      className={`pl-10 ${currentMembershipErrors.membershipStartDate ? "border-red-500" : ""}`}
                    />
                  </div>
                  {currentMembershipErrors.membershipStartDate && (
                    <p className="text-sm text-red-500 mt-1">{currentMembershipErrors.membershipStartDate}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="paymentAmount">Payment Amount (₱) *</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.paymentAmount}
                    onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
                    placeholder="0.00"
                    className={currentMembershipErrors.paymentAmount ? "border-red-500" : ""}
                  />
                  {currentMembershipErrors.paymentAmount && (
                    <p className="text-sm text-red-500 mt-1">{currentMembershipErrors.paymentAmount}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                    <SelectItem value="GCASH">GCash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Plan Summary */}
              {selectedPlan && formData.membershipStartDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Membership Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Plan:</span>
                      <span className="font-medium">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Duration:</span>
                      <span>{selectedPlan.duration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Start Date:</span>
                      <span>{new Date(formData.membershipStartDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">End Date:</span>
                      <span>{calculateEndDate() ? new Date(calculateEndDate()).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Member Options</h4>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sendWelcomeEmail"
                    checked={formData.sendWelcomeEmail}
                    onCheckedChange={(checked) => handleInputChange('sendWelcomeEmail', checked)}
                  />
                  <Label htmlFor="sendWelcomeEmail">Send welcome email to member</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="createAccountForMember"
                    checked={formData.createAccountForMember}
                    onCheckedChange={(checked) => handleInputChange('createAccountForMember', checked)}
                  />
                  <Label htmlFor="createAccountForMember">Create login account for member</Label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 'summary' && (
            <div className="space-y-6">
              {/* Member Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">New Member Summary</h4>
                
                <div className="flex items-start gap-4">
                  {formData.photoPreviewUrl && (
                    <img 
                      src={formData.photoPreviewUrl} 
                      alt="Member" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  )}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h5 className="font-medium">{formData.firstName} {formData.lastName}</h5>
                      <p className="text-sm text-muted-foreground">{formData.email}</p>
                      {formData.phoneNumber && (
                        <p className="text-sm text-muted-foreground">{formData.phoneNumber}</p>
                      )}
                    </div>
                    
                    {selectedPlan && (
                      <div className="bg-white border rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Membership Plan</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Plan:</span>
                            <span className="font-medium">{selectedPlan.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Period:</span>
                            <span>
                              {new Date(formData.membershipStartDate).toLocaleDateString()} - {' '}
                              {calculateEndDate() ? new Date(calculateEndDate()).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Amount:</span>
                            <span className="text-green-600">{formatPHP(parseFloat(formData.paymentAmount))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment:</span>
                            <span>{formData.paymentMethod}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {(formData.sendWelcomeEmail || formData.createAccountForMember) && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <h6 className="font-medium text-blue-900 mb-2">Additional Actions</h6>
                        <div className="space-y-1 text-sm text-blue-700">
                          {formData.sendWelcomeEmail && (
                            <div className="flex items-center gap-2">
                              <Check className="h-3 w-3" />
                              <span>Send welcome email</span>
                            </div>
                          )}
                          {formData.createAccountForMember && (
                            <div className="flex items-center gap-2">
                              <Check className="h-3 w-3" />
                              <span>Create member login account</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {step !== 'basic' && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={createUserMutation.isPending}>
                Cancel
              </Button>
              {step !== 'summary' ? (
                <Button 
                  onClick={handleNext}
                  disabled={(step === 'basic' && !canProceedFromBasic) || (step === 'membership' && !canProceedFromMembership)}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Adding Member...' : 'Add Member'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
