'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, Mail, Phone, User, ArrowRight } from 'lucide-react'
import { toast } from 'react-toastify'

interface AddFirstMemberModalProps {
  open: boolean
  onMemberAdded: (data: {
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string
    gender?: string
  }) => Promise<void>
  onSkip: () => void
  isLoading?: boolean
}

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

export default function AddFirstMemberModal({
  open,
  onMemberAdded,
  onSkip,
  isLoading = false,
}: AddFirstMemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.firstName.trim()) {
      setError('First name is required')
      return
    }

    if (!formData.lastName.trim()) {
      setError('Last name is required')
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      setError('Please enter a valid phone number')
      return
    }

    setIsSubmitting(true)
    try {
      await onMemberAdded({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        gender: formData.gender || undefined,
      })
      toast.success('First member added successfully!')
    } catch (error: any) {
      console.error('Failed to add member:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add member'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-[600px]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-4">
            <UserPlus className="h-6 w-6 text-purple-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Add Your First Member
          </DialogTitle>
          <DialogDescription className="text-center">
            Start your member list by adding your first member, or skip this step and add members later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter first name"
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter last name"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="member@example.com"
              required
            />
          </div>

          {/* Phone Number (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number (Optional)
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="e.g., +1 (555) 123-4567"
            />
          </div>

          {/* Gender (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="gender">
              Gender (Optional)
            </Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button 
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isSubmitting || isLoading}
              className="flex-1"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Skip for Now
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding Member...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
