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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Phone, MapPin, Tag } from 'lucide-react'
import { toast } from 'react-toastify'
import { BusinessCategory } from '@/types'

interface BusinessDetailsModalProps {
  open: boolean
  user?: any
  onBusinessDetailsSet: (data: {
    name: string
    category: BusinessCategory
    phoneNumber?: string
    address?: string
  }) => Promise<void>
  isLoading?: boolean
}

export default function BusinessDetailsModal({
  open,
  user,
  onBusinessDetailsSet,
  isLoading = false,
}: BusinessDetailsModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: BusinessCategory.GYM,
    phoneNumber: '',
    address: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && user) {
      setFormData({
        name: `${user.firstName}'s Gym`,
        category: BusinessCategory.GYM,
        phoneNumber: '',
        address: '',
      })
      setError('')
    }
  }, [open, user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
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
      setError('Business name is required')
      return
    }

    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      setError('Please enter a valid phone number')
      return
    }

    setIsSubmitting(true)
    try {
      await onBusinessDetailsSet({
        name: formData.name.trim(),
        category: formData.category,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
      })
      toast.success('Business details updated successfully!')
    } catch (error: any) {
      console.error('Failed to update business details:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update business details'
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
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Set Up Your Business
          </DialogTitle>
          <DialogDescription className="text-center">
            Let's customize your business name and contact information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="businessName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., FitZone Gym"
              required
            />
            <p className="text-xs text-muted-foreground">
              Choose a name for your business that your customers will recognize.
            </p>
          </div>

          {/* Business Category */}
          <div className="space-y-2">
            <Label htmlFor="businessCategory" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Business Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  category: val as BusinessCategory,
                })
              }
              disabled
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BusinessCategory.GYM}>Gym & Fitness</SelectItem>
                <SelectItem value={BusinessCategory.COFFEE_SHOP} disabled>
                  Coffee Shop
                </SelectItem>
                <SelectItem value={BusinessCategory.ECOMMERCE} disabled>
                  E-commerce
                </SelectItem>
                <SelectItem value={BusinessCategory.OTHER} disabled>
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Currently only available for gyms and fitness centers
            </p>
          </div>

          {/* Business Address (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="businessAddress" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Business Address (Optional)
            </Label>
            <Input
              id="businessAddress"
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="e.g., 123 Main St, City, State, ZIP"
            />
            <p className="text-xs text-muted-foreground">
              The address of your business location.
            </p>
          </div>

          {/* Business Phone (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="businessPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Business Phone Number (Optional)
            </Label>
            <Input
              id="businessPhone"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="e.g., +1 (555) 123-4567"
            />
            <p className="text-xs text-muted-foreground">
              A contact number for your business.
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              className="w-full"
              size="lg"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
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