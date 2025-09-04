'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Heart, 
  Activity,
  CreditCard,
  Users,
  Camera,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import { membersApi } from '@/lib/api/members'
import { gymMemberPhotosApi } from '@/lib/api/gym-member-photos'

interface MemberInfoModalProps {
  isOpen: boolean
  onClose: () => void
  member: any
  onMemberUpdated?: () => void
}

export function MemberInfoModal({
  isOpen,
  onClose,
  member,
  onMemberUpdated
}: MemberInfoModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    // Basic info
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    photoUrl: '',
    notes: '',
    
    // Personal info from gymMemberProfile
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    fitnessGoals: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',

    // Health info
    medicalConditions: '',
    allergies: '',
    fitnessLevel: '',

    // Preferences
    preferredWorkoutTime: '',
    favoriteEquipment: '',
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    personalDetails: false,
    emergencyContact: false,
    preferences: false,
    membership: true, // Keep membership expanded by default
    activity: true // Keep activity expanded by default
  })
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  useEffect(() => {
    if (member && isOpen) {
      const gymProfile = member.gymMemberProfile

      // Parse emergency contact from the stored string format
      const emergencyContact = gymProfile?.emergencyContact || ''

      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || '',
        photoUrl: member.photoUrl || '',
        notes: member.notes || '',

        dateOfBirth: gymProfile?.dateOfBirth ? new Date(gymProfile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: gymProfile?.gender || '',
        height: gymProfile?.height?.toString() || '',
        weight: gymProfile?.weight?.toString() || '',
        fitnessGoals: gymProfile?.fitnessGoals || '',
        emergencyContactName: emergencyContact.split(' - ')[0] || '',
        emergencyContactPhone: emergencyContact.split(' - ')[1] || '',
        emergencyContactRelationship: '',

        medicalConditions: gymProfile?.medicalConditions || '',
        allergies: Array.isArray(gymProfile?.allergies) ? gymProfile.allergies.join(', ') : '',
        fitnessLevel: gymProfile?.fitnessLevel || '',

        preferredWorkoutTime: gymProfile?.preferredWorkoutTime || '',
        favoriteEquipment: gymProfile?.favoriteEquipment || '',
        emailNotifications: gymProfile?.notifications?.email ?? true,
        smsNotifications: gymProfile?.notifications?.sms ?? true,
        pushNotifications: gymProfile?.notifications?.push ?? true,
      })
    }
  }, [member, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !member?.id) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUploadingPhoto(true)

    try {
      console.log('🔍 Photo upload debug:', {
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        memberEmail: member.email
      })
      
      const result = await gymMemberPhotosApi.uploadPhoto(member.id, file)
      
      if (result.success) {
        // Update form data with new photo URL
        handleInputChange('photoUrl', result.photoUrl)
        toast.success('Photo updated successfully')
        // Don't trigger onMemberUpdated to avoid unnecessary API calls
        // onMemberUpdated?.()
      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('Failed to upload photo')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!member?.id) return

    setIsUploadingPhoto(true)

    try {
      const result = await gymMemberPhotosApi.deletePhoto(member.id)
      
      if (result.success) {
        handleInputChange('photoUrl', '')
        toast.success('Photo removed successfully')
        onMemberUpdated?.()
      } else {
        throw new Error(result.message || 'Delete failed')
      }
    } catch (error) {
      console.error('Photo delete error:', error)
      toast.error('Failed to remove photo')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    try {
      // Prepare data for API
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        photoUrl: formData.photoUrl,
        notes: formData.notes,
        // Gym member profile fields
        emergencyContact: formData.emergencyContactName && formData.emergencyContactPhone
          ? `${formData.emergencyContactName} - ${formData.emergencyContactPhone}`
          : null,
        medicalConditions: formData.medicalConditions || null,
        fitnessGoals: formData.fitnessGoals || null,
        preferredTrainer: null,
        gender: formData.gender || null,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        allergies: formData.allergies ? formData.allergies.split(',').map((a: string) => a.trim()) : null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        totalVisits: 0, // Will be updated by system
        fitnessLevel: formData.fitnessLevel || null,
        notifications: {
          email: formData.emailNotifications,
          sms: formData.smsNotifications,
          push: formData.pushNotifications
        },
        favoriteEquipment: formData.favoriteEquipment || null,
        averageVisitsPerWeek: 0, // Will be updated by system
        preferredWorkoutTime: formData.preferredWorkoutTime || null,
        membershipHistory: [], // Keep as empty array for now
        profileMetadata: {
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin'
        }
      }

      // Remove null/empty values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof typeof updateData] === null || updateData[key as keyof typeof updateData] === '') {
          delete updateData[key as keyof typeof updateData]
        }
      })

      await membersApi.updateMember(member.id, updateData)
      toast.success('Member information updated successfully')
      setIsEditing(false)
      onMemberUpdated?.()
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member information')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to original values
    if (member) {
      const gymProfile = member.gymMemberProfile
      const emergencyContact = gymProfile?.emergencyContact || ''

      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || '',
        photoUrl: member.photoUrl || '',
        notes: member.notes || '',

        dateOfBirth: gymProfile?.dateOfBirth ? new Date(gymProfile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: gymProfile?.gender || '',
        height: gymProfile?.height?.toString() || '',
        weight: gymProfile?.weight?.toString() || '',
        fitnessGoals: gymProfile?.fitnessGoals || '',
        emergencyContactName: emergencyContact.split(' - ')[0] || '',
        emergencyContactPhone: emergencyContact.split(' - ')[1] || '',
        emergencyContactRelationship: '',

        medicalConditions: gymProfile?.medicalConditions || '',
        allergies: Array.isArray(gymProfile?.allergies) ? gymProfile.allergies.join(', ') : '',
        fitnessLevel: gymProfile?.fitnessLevel || '',

        preferredWorkoutTime: gymProfile?.preferredWorkoutTime || '',
        favoriteEquipment: gymProfile?.favoriteEquipment || '',
        emailNotifications: gymProfile?.notifications?.email ?? true,
        smsNotifications: gymProfile?.notifications?.sms ?? true,
        pushNotifications: gymProfile?.notifications?.push ?? true,
      })
    }
  }

  if (!member) return null

  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Large Avatar */}
            <div className="relative">
              {formData.photoUrl ? (
                <img 
                  src={formData.photoUrl} 
                  alt={memberName}
                  className="w-24 h-24 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-xl shadow-lg">
                  {memberName.charAt(0).toUpperCase()}
                </div>
              )}
              {isEditing && (
                <div className="absolute -bottom-1 -right-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="bg-white rounded-full p-2 border-2 shadow-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4 text-gray-600" />
                  </button>
                  {formData.photoUrl && (
                    <button 
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploadingPhoto}
                      className="ml-1 bg-red-500 text-white rounded-full p-2 shadow-md hover:bg-red-600 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {/* Member Info */}
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">{memberName}</DialogTitle>
              <DialogDescription className="text-base">
                {isEditing ? 'Edit member information and preferences' : 'View member details and gym activity'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 px-1">
          {/* Basic Information */}
          <div className="grid gap-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Basic Information
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
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
                disabled={!isEditing}
                rows={2}
                placeholder="Additional notes about this member..."
              />
            </div>
          </div>

          {/* Personal Information - Collapsible */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => toggleSection('personalDetails')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Personal Details</span>
              </div>
              {expandedSections.personalDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {expandedSections.personalDetails && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => handleInputChange('gender', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
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
                    <Select 
                      value={formData.fitnessLevel} 
                      onValueChange={(value) => handleInputChange('fitnessLevel', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
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
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fitnessGoals">Fitness Goals</Label>
                  <Input
                    id="fitnessGoals"
                    value={formData.fitnessGoals}
                    onChange={(e) => handleInputChange('fitnessGoals', e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., Weight Loss, Muscle Gain, General Fitness"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Emergency Contact - Collapsible */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => toggleSection('emergencyContact')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="font-medium">Emergency Contact</span>
              </div>
              {expandedSections.emergencyContact ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {expandedSections.emergencyContact && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                    <Input
                      id="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Spouse, Parent, Friend"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Workout Preferences - Collapsible */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => toggleSection('preferences')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Preferences</span>
              </div>
              {expandedSections.preferences ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {expandedSections.preferences && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredWorkoutTime">Preferred Workout Time</Label>
                    <Select 
                      value={formData.preferredWorkoutTime} 
                      onValueChange={(value) => handleInputChange('preferredWorkoutTime', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning">Morning</SelectItem>
                        <SelectItem value="Afternoon">Afternoon</SelectItem>
                        <SelectItem value="Evening">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="favoriteEquipment">Favorite Equipment</Label>
                    <Input
                      id="favoriteEquipment"
                      value={formData.favoriteEquipment}
                      onChange={(e) => handleInputChange('favoriteEquipment', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Cardio, Weights, Functional Training"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Membership Information */}
          {member.gymSubscriptions?.[0] && (
            <div className="grid gap-4">
              <h4 className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Current Membership
              </h4>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-purple-600">
                    {member.gymSubscriptions?.[0]?.membershipPlan?.name || 'No Plan'}
                  </span>
                  <Badge variant={member.gymSubscriptions?.[0]?.status === 'EXPIRED' ? "destructive" : "default"}>
                    {member.gymSubscriptions?.[0]?.status === 'EXPIRED' ? 'Expired' : 'Active'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <span className="ml-2 font-medium text-green-600">
                      ₱{member.gymSubscriptions?.[0]?.price || '0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2">{member.gymSubscriptions?.[0]?.membershipPlan?.type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start:</span>
                    <span className="ml-2">{member.gymSubscriptions?.[0]?.startDate ? new Date(member.gymSubscriptions[0].startDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End:</span>
                    <span className="ml-2">{member.gymSubscriptions?.[0]?.endDate ? new Date(member.gymSubscriptions[0].endDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Summary */}
          {member.gymMemberProfile && (
            <div className="grid gap-4">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Summary
              </h4>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                  <div className="font-bold text-blue-600 text-lg">
                    {member.gymMemberProfile?.totalVisits || 0}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 text-xs">Total Visits</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                  <div className="font-bold text-green-600 text-lg">
                    {member.gymMemberProfile?.averageVisitsPerWeek || 0}
                  </div>
                  <div className="text-green-600 dark:text-green-400 text-xs">Visits/Week</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3 text-center">
                  <div className="font-bold text-purple-600 text-xs">
                    {member.gymMemberProfile?.lastVisit
                      ? new Date(member.gymMemberProfile.lastVisit).toLocaleDateString()
                      : 'N/A'
                    }
                  </div>
                  <div className="text-purple-600 dark:text-purple-400 text-xs">Last Visit</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col space-y-4 pt-6 border-t">
          <div className="text-center text-xs text-muted-foreground">
            Member since: {new Date(member.createdAt).toLocaleDateString()}
          </div>
          
          <div className="flex gap-3 w-full">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={onClose} className="flex-1 h-12">
                  Close
                </Button>
                <Button onClick={() => setIsEditing(true)} className="flex-1 h-12">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel} className="flex-1 h-12">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 h-12">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
