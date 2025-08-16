'use client'

import { useState, useEffect } from 'react'
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
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { membersApi } from '@/lib/api/members'

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
    
    // Personal info from businessData
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    fitnessGoals: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    
    // Health info
    medicalConditions: [] as string[],
    allergies: [] as string[],
    fitnessLevel: '',
    
    // Preferences
    preferredWorkoutTime: '',
    favoriteEquipment: '',
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
  })

  useEffect(() => {
    if (member && isOpen) {
      const businessData = member.businessData || {}
      const personalInfo = businessData.personalInfo || {}
      const healthInfo = businessData.healthInfo || {}
      const preferences = businessData.preferences || {}
      const emergencyContact = personalInfo.emergencyContact || {}

      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || '',
        photoUrl: member.photoUrl || '',
        notes: member.notes || '',
        
        dateOfBirth: personalInfo.dateOfBirth ? personalInfo.dateOfBirth.split('T')[0] : '',
        gender: personalInfo.gender || '',
        height: personalInfo.height?.toString() || '',
        weight: personalInfo.weight?.toString() || '',
        fitnessGoals: personalInfo.fitnessGoals || '',
        emergencyContactName: emergencyContact.name || '',
        emergencyContactPhone: emergencyContact.phone || '',
        emergencyContactRelationship: emergencyContact.relationship || '',
        
        medicalConditions: healthInfo.medicalConditions || [],
        allergies: healthInfo.allergies || [],
        fitnessLevel: healthInfo.fitnessLevel || '',
        
        preferredWorkoutTime: preferences.preferredWorkoutTime || '',
        favoriteEquipment: preferences.favoriteEquipment || '',
        emailNotifications: preferences.notifications?.email ?? true,
        smsNotifications: preferences.notifications?.sms ?? true,
        pushNotifications: preferences.notifications?.push ?? true,
      })
    }
  }, [member, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
        businessData: {
          personalInfo: {
            dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
            gender: formData.gender,
            height: formData.height ? parseFloat(formData.height) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            fitnessGoals: formData.fitnessGoals,
            emergencyContact: {
              name: formData.emergencyContactName,
              phone: formData.emergencyContactPhone,
              relationship: formData.emergencyContactRelationship
            }
          },
          healthInfo: {
            medicalConditions: formData.medicalConditions,
            allergies: formData.allergies,
            fitnessLevel: formData.fitnessLevel
          },
          preferences: {
            preferredWorkoutTime: formData.preferredWorkoutTime,
            favoriteEquipment: formData.favoriteEquipment,
            notifications: {
              email: formData.emailNotifications,
              sms: formData.smsNotifications,
              push: formData.pushNotifications
            }
          }
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
      const businessData = member.businessData || {}
      const personalInfo = businessData.personalInfo || {}
      const healthInfo = businessData.healthInfo || {}
      const preferences = businessData.preferences || {}
      const emergencyContact = personalInfo.emergencyContact || {}

      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || '',
        photoUrl: member.photoUrl || '',
        notes: member.notes || '',
        
        dateOfBirth: personalInfo.dateOfBirth ? personalInfo.dateOfBirth.split('T')[0] : '',
        gender: personalInfo.gender || '',
        height: personalInfo.height?.toString() || '',
        weight: personalInfo.weight?.toString() || '',
        fitnessGoals: personalInfo.fitnessGoals || '',
        emergencyContactName: emergencyContact.name || '',
        emergencyContactPhone: emergencyContact.phone || '',
        emergencyContactRelationship: emergencyContact.relationship || '',
        
        medicalConditions: healthInfo.medicalConditions || [],
        allergies: healthInfo.allergies || [],
        fitnessLevel: healthInfo.fitnessLevel || '',
        
        preferredWorkoutTime: preferences.preferredWorkoutTime || '',
        favoriteEquipment: preferences.favoriteEquipment || '',
        emailNotifications: preferences.notifications?.email ?? true,
        smsNotifications: preferences.notifications?.sms ?? true,
        pushNotifications: preferences.notifications?.push ?? true,
      })
    }
  }

  if (!member) return null

  const memberName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="relative">
              {member.photoUrl ? (
                <img 
                  src={member.photoUrl} 
                  alt={memberName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {memberName.charAt(0).toUpperCase()}
                </div>
              )}
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border shadow-sm hover:bg-gray-50">
                  <Camera className="h-3 w-3 text-gray-600" />
                </button>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{memberName}</h3>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edit member information and preferences' : 'View member details and gym activity'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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

          {/* Personal Information */}
          <div className="grid gap-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Personal Details
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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

          {/* Emergency Contact */}
          <div className="grid gap-4">
            <h4 className="font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Emergency Contact
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
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

          {/* Workout Preferences */}
          <div className="grid gap-4">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Preferences
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
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

          {/* Membership Information */}
          {member.businessData?.membership && (
            <div className="grid gap-4">
              <h4 className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Current Membership
              </h4>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-purple-600">
                    {member.businessData.membership.planName}
                  </span>
                  <Badge variant={member.businessData.membership.isExpired ? "destructive" : "default"}>
                    {member.businessData.membership.isExpired ? 'Expired' : 'Active'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <span className="ml-2 font-medium text-green-600">
                      ₱{member.businessData.membership.price}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2">{member.businessData.membership.planType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start:</span>
                    <span className="ml-2">{new Date(member.businessData.membership.startDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End:</span>
                    <span className="ml-2">{new Date(member.businessData.membership.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Summary */}
          {member.businessData?.attendance && (
            <div className="grid gap-4">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Summary
              </h4>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                  <div className="font-bold text-blue-600 text-lg">
                    {member.businessData.attendance.totalVisits}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 text-xs">Total Visits</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                  <div className="font-bold text-green-600 text-lg">
                    {member.businessData.attendance.averageVisitsPerWeek}
                  </div>
                  <div className="text-green-600 dark:text-green-400 text-xs">Visits/Week</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3 text-center">
                  <div className="font-bold text-purple-600 text-xs">
                    {member.businessData.attendance.lastVisit 
                      ? new Date(member.businessData.attendance.lastVisit).toLocaleDateString()
                      : 'N/A'
                    }
                  </div>
                  <div className="text-purple-600 dark:text-purple-400 text-xs">Last Visit</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Member since: {new Date(member.createdAt).toLocaleDateString()}</span>
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
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
