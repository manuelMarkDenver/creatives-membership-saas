'use client'

import { useState, useEffect } from 'react'
import { useCreateMembershipPlan, useUpdateMembershipPlan } from '@/lib/hooks/use-membership-plans'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { X, Plus } from 'lucide-react'
import { toast } from 'react-toastify'

interface MembershipPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  plan?: any
  mode: 'create' | 'edit'
  tenantId: string
}

const MEMBERSHIP_TYPES = [
  { value: 'DAY_PASS', label: 'Day Pass' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMI_ANNUAL', label: 'Semi Annual' },
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'UNLIMITED', label: 'Unlimited' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'CORPORATE', label: 'Corporate' },
]

const ACCESS_LEVEL_OPTIONS = [
  { value: 'ALL_BRANCHES', label: 'All Branches', description: 'Can visit any branch (premium)' },
  { value: 'MULTI_BRANCH', label: 'Multiple Branches', description: 'Can visit specific allowed branches' },
  { value: 'SINGLE_BRANCH', label: 'Single Branch', description: 'Can only visit primary branch' },
]

const DURATION_SUGGESTIONS = {
  DAY_PASS: 1,
  WEEKLY: 7,
  MONTHLY: 30,
  QUARTERLY: 90,
  SEMI_ANNUAL: 180,
  ANNUAL: 365,
  UNLIMITED: 9999,
  STUDENT: 30,
  SENIOR: 30,
  CORPORATE: 30,
}

export function MembershipPlanModal({
  isOpen,
  onClose,
  onSaved,
  plan,
  mode,
  tenantId
}: MembershipPlanModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    type: '',
    benefits: [] as string[],
    accessLevel: 'ALL_BRANCHES',
    isActive: true,
  })
  const [newBenefit, setNewBenefit] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const createMutation = useCreateMembershipPlan()
  const updateMutation = useUpdateMembershipPlan()

  useEffect(() => {
    if (plan && mode === 'edit') {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price?.toString() || '',
        duration: plan.duration?.toString() || '',
        type: plan.type || '',
        benefits: plan.benefits ? JSON.parse(plan.benefits) : [],
        accessLevel: plan.accessLevel || 'ALL_BRANCHES',
        isActive: plan.isActive ?? true,
      })
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        type: '',
        benefits: [],
        accessLevel: 'ALL_BRANCHES',
        isActive: true,
      })
    }
  }, [plan, mode, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-suggest duration based on type
    if (field === 'type' && value in DURATION_SUGGESTIONS) {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        duration: DURATION_SUGGESTIONS[value as keyof typeof DURATION_SUGGESTIONS].toString()
      }))
    }
  }

  const addBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }))
      setNewBenefit('')
    }
  }

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Plan name is required')
        return
      }
      if (!formData.price || parseFloat(formData.price) < 0) {
        toast.error('Valid price is required')
        return
      }
      if (!formData.duration || parseInt(formData.duration) < 1) {
        toast.error('Valid duration is required')
        return
      }
      if (!formData.type) {
        toast.error('Plan type is required')
        return
      }

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        type: formData.type,
        benefits: formData.benefits.length > 0 ? formData.benefits : undefined,
        accessLevel: formData.accessLevel,
        isActive: formData.isActive,
      }

      if (mode === 'create') {
        await createMutation.mutateAsync({
          ...submitData,
          // Note: tenantId will be set by backend based on authenticated user
        })
        toast.success('Membership plan created successfully')
        onSaved()
      } else {
        await updateMutation.mutateAsync({
          id: plan.id,
          data: submitData
        })
        toast.success('Membership plan updated successfully')
        onSaved()
      }
    } catch (error: any) {
      console.error('Error saving membership plan:', error)
      toast.error(error.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Membership Plan' : 'Edit Membership Plan'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new membership plan for your gym members'
              : 'Update the membership plan details'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Premium Monthly, Student Pass"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what's included in this plan..."
                rows={3}
              />
            </div>
          </div>

          {/* Pricing and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (₱) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (days) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="30"
                required
              />
            </div>
          </div>

          {/* Plan Type & Branch Access Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Plan Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  {MEMBERSHIP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accessLevel" className="flex items-center gap-2">
                Branch Access
                <Badge variant="secondary" className="text-xs">All Branches</Badge>
              </Label>
              <Select value={formData.accessLevel} onValueChange={(value) => handleInputChange('accessLevel', value)} disabled>
                <SelectTrigger className="bg-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <Label>Benefits & Features</Label>
            <div className="space-y-2">
              {/* Add new benefit */}
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a benefit..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* List of benefits */}
              {formData.benefits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {benefit}
                      <button
                        type="button"
                        onClick={() => removeBenefit(index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive">
              Active plan (visible to members)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (mode === 'create' ? 'Create Plan' : 'Update Plan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
