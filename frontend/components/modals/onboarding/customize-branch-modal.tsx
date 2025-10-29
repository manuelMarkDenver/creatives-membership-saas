'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Building2, Mail, Phone } from 'lucide-react'
import { toast } from 'react-toastify'

interface Branch {
  id: string
  name: string
  address?: string
  phoneNumber?: string
  email?: string
}

interface CustomizeBranchModalProps {
  open: boolean
  branch: Branch | null
  onBranchCustomized: (data: {
    name: string
    address: string
    phoneNumber?: string
    email?: string
  }) => Promise<void>
  isLoading?: boolean
}

export default function CustomizeBranchModal({
  open,
  branch,
  onBranchCustomized,
  isLoading = false,
}: CustomizeBranchModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
        phoneNumber: branch.phoneNumber || '',
        email: branch.email || '',
      })
    }
  }, [branch])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Email is optional
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
    if (!formData.name.trim()) {
      setError('Branch name is required')
      return
    }

    if (!formData.address.trim()) {
      setError('Branch address is required')
      return
    }

    if (formData.email && !validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      setError('Please enter a valid phone number')
      return
    }

    setIsSubmitting(true)
    try {
      await onBranchCustomized({
        name: formData.name.trim(),
        address: formData.address.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        email: formData.email.trim() || undefined,
      })
      toast.success('Branch details updated successfully!')
    } catch (error: any) {
      console.error('Failed to update branch:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update branch'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-[600px]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mx-auto mb-4">
            <Building2 className="h-6 w-6 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Customize Your Branch
          </DialogTitle>
          <DialogDescription className="text-center">
            We&apos;ve created a default branch for you. Let&apos;s customize it with your actual location details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Branch Name */}
          <div className="space-y-2">
            <Label htmlFor="branchName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Branch Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="branchName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Downtown Gym, Main Location"
              required
            />
            <p className="text-xs text-muted-foreground">
              Give your branch a descriptive name to identify it.
            </p>
          </div>

          {/* Branch Address */}
          <div className="space-y-2">
            <Label htmlFor="branchAddress" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="branchAddress"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter the full address of your branch"
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Include street address, city, state, and zip code.
            </p>
          </div>

          {/* Branch Phone (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="branchPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number (Optional)
            </Label>
            <Input
              id="branchPhone"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="e.g., +1 (555) 123-4567"
            />
            <p className="text-xs text-muted-foreground">
              A contact number for this specific branch.
            </p>
          </div>

          {/* Branch Email (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="branchEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email (Optional)
            </Label>
            <Input
              id="branchEmail"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="e.g., downtown@yourgym.com"
            />
            <p className="text-xs text-muted-foreground">
              An email address specific to this branch.
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving Branch...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Save & Continue
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
