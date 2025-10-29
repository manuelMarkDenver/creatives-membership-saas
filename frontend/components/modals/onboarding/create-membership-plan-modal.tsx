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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, DollarSign, Calendar, Tag } from 'lucide-react'
import { toast } from 'react-toastify'

interface CreateMembershipPlanModalProps {
  open: boolean
  onPlanCreated: (data: {
    name: string
    description?: string
    price: number
    duration: number
    type: string
    accessLevel: string
  }) => Promise<void>
  isLoading?: boolean
}

const MEMBERSHIP_TYPES = [
  { value: 'MONTHLY', label: 'Monthly', duration: 30 },
  { value: 'QUARTERLY', label: 'Quarterly (3 Months)', duration: 90 },
  { value: 'SEMI_ANNUAL', label: 'Semi-Annual (6 Months)', duration: 180 },
  { value: 'ANNUAL', label: 'Annual (1 Year)', duration: 365 },
  { value: 'WEEKLY', label: 'Weekly', duration: 7 },
  { value: 'DAY_PASS', label: 'Day Pass', duration: 1 },
]

const ACCESS_LEVEL_OPTIONS = [
  { value: 'ALL_BRANCHES', label: 'All Branches', description: 'Can visit any branch' },
  { value: 'SINGLE_BRANCH', label: 'Single Branch', description: 'Can only visit assigned branch' },
]

export default function CreateMembershipPlanModal({
  open,
  onPlanCreated,
  isLoading = false,
}: CreateMembershipPlanModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30',
    type: 'MONTHLY',
    accessLevel: 'ALL_BRANCHES',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')

    // Auto-update duration based on type selection
    if (field === 'type') {
      const selectedType = MEMBERSHIP_TYPES.find(t => t.value === value)
      if (selectedType) {
        setFormData(prev => ({ ...prev, [field]: value, duration: selectedType.duration.toString() }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Plan name is required')
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price')
      return
    }

    const duration = parseInt(formData.duration)
    if (isNaN(duration) || duration < 1) {
      setError('Please enter a valid duration')
      return
    }

    if (!formData.type) {
      setError('Please select a membership type')
      return
    }

    setIsSubmitting(true)
    try {
      await onPlanCreated({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price,
        duration,
        type: formData.type,
        accessLevel: formData.accessLevel,
      })
      toast.success('Membership plan created successfully!')
    } catch (error: any) {
      console.error('Failed to create membership plan:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create membership plan'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mx-auto mb-4">
            <CreditCard className="h-6 w-6 text-accent" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Create Your First Membership Plan
          </DialogTitle>
          <DialogDescription className="text-center">
            Set up at least one membership plan to start accepting members. You can add more plans later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="planName" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Plan Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="planName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Standard Monthly, Premium Annual"
              required
            />
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name for this membership plan.
            </p>
          </div>

          {/* Membership Type */}
          <div className="space-y-2">
            <Label htmlFor="planType" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Membership Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select membership type" />
              </SelectTrigger>
              <SelectContent>
                {MEMBERSHIP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the duration type for this plan.
            </p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="planPrice" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₱
              </span>
              <Input
                id="planPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                className="pl-8"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The price members will pay for this plan (in Philippine Pesos).
            </p>
          </div>

          {/* Duration (auto-filled based on type) */}
          <div className="space-y-2">
            <Label htmlFor="planDuration" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Duration (Days) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="planDuration"
              type="number"
              min="1"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              placeholder="30"
              required
            />
            <p className="text-xs text-muted-foreground">
              How many days this membership is valid.
            </p>
          </div>

          {/* Access Level */}
          <div className="space-y-2">
            <Label htmlFor="accessLevel" className="flex items-center gap-2">
              Access Level <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.accessLevel}
              onValueChange={(value) => handleInputChange('accessLevel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Determine which branches members can access with this plan.
            </p>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="planDescription">
              Description (Optional)
            </Label>
            <Textarea
              id="planDescription"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add details about what's included in this plan..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Provide additional details about this membership plan.
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
                  Creating Plan...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Create Plan & Continue
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
