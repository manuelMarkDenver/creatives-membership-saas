'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useMembershipPlans, useCreateMembershipPlan, useUpdateMembershipPlan, useDeleteMembershipPlan, useToggleMembershipPlanStatus } from '@/lib/hooks/use-membership-plans'
import { getMembershipPlans } from '@/lib/api/membership-plans'
import { formatPHPCompact } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CollapsibleStatsOverview, type StatItem } from '@/components/ui/collapsible-stats-overview'
import { 
  CreditCard, 
  Search, 
  Plus,
  Calendar,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Users
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'


const membershipTypes = [
  { value: 'DAY_PASS', label: 'Day Pass' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMI_ANNUAL', label: 'Semi Annual' },
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'UNLIMITED', label: 'Unlimited' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'CORPORATE', label: 'Corporate' }
]

export default function MembershipPlansPage() {
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  const queryResult = useMembershipPlans()
  const { data: membershipPlans, isLoading, error, status, fetchStatus, refetch } = queryResult
  
  
  // Ensure membershipPlans is always an array - more robust checking
  const safeMembers = (() => {
    // First try React Query data
    if (Array.isArray(membershipPlans) && membershipPlans.length > 0) {
      return membershipPlans
    }
    
    
    if (membershipPlans && typeof membershipPlans === 'object' && 'length' in membershipPlans) {
      return Array.from(membershipPlans as ArrayLike<any>)
    }
    
    return []
  })()
  
  const createMembershipPlanMutation = useCreateMembershipPlan()
  const updateMembershipPlanMutation = useUpdateMembershipPlan()
  const deleteMembershipPlanMutation = useDeleteMembershipPlan()
  const toggleMembershipPlanStatusMutation = useToggleMembershipPlanStatus()
  
  
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    type: 'MONTHLY',
    benefits: [''],
    isActive: true
  })

  // Only allow owners and managers to access this page
  if (profile && !['OWNER', 'MANAGER'].includes(profile.role)) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to manage membership plans.</p>
      </div>
    )
  }

  // Filter plans based on search term
  const filteredPlans = safeMembers.filter((plan) =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: safeMembers.length,
    active: safeMembers.filter(p => p.isActive).length,
    inactive: safeMembers.filter(p => !p.isActive).length,
    totalMembers: safeMembers.reduce((sum, plan) => sum + (plan.memberCount || 0), 0)
  }

  // Prepare stats for mobile-first layout
  const planStats: StatItem[] = [
    {
      key: 'total',
      label: 'Total',
      value: stats.total,
      icon: CreditCard,
      color: 'text-gray-700 dark:text-gray-300',
      description: 'All membership plans'
    },
    {
      key: 'active',
      label: 'Active',
      value: stats.active,
      icon: Eye,
      color: 'text-green-700 dark:text-green-400',
      description: 'Currently available'
    },
    {
      key: 'inactive',
      label: 'Inactive',
      value: stats.inactive,
      icon: EyeOff,
      color: 'text-gray-700 dark:text-gray-400',
      description: 'Disabled plans'
    },
    {
      key: 'totalMembers',
      label: 'Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'text-blue-700 dark:text-blue-400',
      description: 'Total subscribers'
    }
  ]

  // Compact summary for mobile (first 3 most important stats)
  const compactSummary = [
    planStats[0], // Total
    planStats[1], // Active
    planStats[3], // Members
  ]

  const handleCreatePlan = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Plan name is required')
        return
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error('Plan price must be greater than 0')
        return
      }
      if (!formData.duration || parseInt(formData.duration) <= 0) {
        toast.error('Plan duration must be greater than 0 days')
        return
      }

      // Filter out empty benefits
      const validBenefits = formData.benefits.filter(benefit => benefit.trim() !== '')

      const planData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        type: formData.type,
        benefits: validBenefits.length > 0 ? validBenefits : undefined,
        isActive: formData.isActive
      }

      const response = await createMembershipPlanMutation.mutateAsync(planData)
      
      if (response.success) {
        toast.success('Membership plan created successfully')
        setCreateDialogOpen(false)
        setFormData({
          name: '',
          description: '',
          price: '',
          duration: '',
          type: 'MONTHLY',
          benefits: [''],
          isActive: true
        })
      } else {
        toast.error(response.message || 'Failed to create membership plan')
      }
    } catch (error: any) {
      console.error('Error creating membership plan:', error)
      toast.error(error.response?.data?.message || 'Failed to create membership plan')
    }
  }

  const handleEditPlan = async () => {
    if (!selectedPlan) return
    
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Plan name is required')
        return
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error('Plan price must be greater than 0')
        return
      }
      if (!formData.duration || parseInt(formData.duration) <= 0) {
        toast.error('Plan duration must be greater than 0 days')
        return
      }

      // Filter out empty benefits
      const validBenefits = formData.benefits.filter(benefit => benefit.trim() !== '')

      const planData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        type: formData.type,
        benefits: validBenefits.length > 0 ? validBenefits : undefined,
        isActive: formData.isActive
      }

      const response = await updateMembershipPlanMutation.mutateAsync({ 
        id: selectedPlan.id, 
        data: planData 
      })
      
      if (response.success) {
        toast.success('Membership plan updated successfully')
        setEditDialogOpen(false)
        setSelectedPlan(null)
        setFormData({
          name: '',
          description: '',
          price: '',
          duration: '',
          type: 'MONTHLY',
          benefits: [''],
          isActive: true
        })
      } else {
        toast.error(response.message || 'Failed to update membership plan')
      }
    } catch (error: any) {
      console.error('Error updating membership plan:', error)
      toast.error(error.response?.data?.message || 'Failed to update membership plan')
    }
  }

  const handleDeletePlan = async () => {
    if (!selectedPlan) return
    
    try {
      const response = await deleteMembershipPlanMutation.mutateAsync(selectedPlan.id)
      
      if (response.success) {
        toast.success('Membership plan deleted successfully')
      } else {
        toast.error(response.message || 'Failed to delete membership plan')
      }
    } catch (error: any) {
      console.error('Error deleting membership plan:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete membership plan'
      toast.error(errorMessage)
    } finally {
      setDeleteDialogOpen(false)
      setSelectedPlan(null)
    }
  }

  const togglePlanStatus = async (planId: string) => {
    try {
      const response = await toggleMembershipPlanStatusMutation.mutateAsync(planId)
      
      if (response.success) {
        const plan = safeMembers.find(p => p.id === planId)
        const newStatus = plan?.isActive ? 'deactivated' : 'activated'
        toast.success(`Membership plan ${newStatus} successfully`)
      } else {
        toast.error(response.message || 'Failed to toggle plan status')
      }
    } catch (error: any) {
      console.error('Error toggling plan status:', error)
      toast.error(error.response?.data?.message || 'Failed to toggle plan status')
    }
  }

  const openDeleteDialog = (plan: any) => {
    setSelectedPlan(plan)
    setDeleteDialogOpen(true)
  }

  const openEditDialog = (plan: any) => {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      duration: plan.duration.toString(),
      type: plan.type,
      benefits: (() => {
        // Handle different benefit formats from API
        if (typeof plan.benefits === 'object' && plan.benefits && 'features' in plan.benefits) {
          return Array.isArray(plan.benefits.features) ? plan.benefits.features : ['']
        } else if (Array.isArray(plan.benefits)) {
          return plan.benefits
        }
        return ['']
      })(),
      isActive: plan.isActive
    })
    setEditDialogOpen(true)
  }

  const addBenefit = () => {
    setFormData({ ...formData, benefits: [...formData.benefits, ''] })
  }

  const removeBenefit = (index: number) => {
    const newBenefits = formData.benefits.filter((_, i) => i !== index)
    setFormData({ ...formData, benefits: newBenefits })
  }

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...formData.benefits]
    newBenefits[index] = value
    setFormData({ ...formData, benefits: newBenefits })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-green-500" />
            Membership Plans
          </h1>
          <p className="text-muted-foreground">
            Manage your gym membership plans and pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { refetch() }}>
            Refresh
          </Button>
          <Button variant="outline" onClick={async () => { await queryClient.clear(); window.location.reload() }}>
            Clear Cache
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </div>

      {/* Mobile-First Stats Overview */}
      <CollapsibleStatsOverview 
        title="Membership Plans Overview"
        stats={planStats}
        compactSummary={compactSummary}
      />

      {/* Search and Plans List */}
      <Card>
        <CardHeader>
          <CardTitle>Membership Plans</CardTitle>
          <CardDescription>
            Manage pricing and benefits for your gym memberships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Plans List */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-pulse">Loading membership plans...</div>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-8 text-red-600">
                Failed to load membership plans. Please try again.
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No plans found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first membership plan.'}
                </p>
              </div>
            ) : (
              filteredPlans.map((plan) => (
                <Card key={plan.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                          {plan.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={plan.isActive ? "default" : "secondary"} className="text-xs">
                              {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {plan.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(plan)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePlanStatus(plan.id)}>
                            {plan.isActive ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => openDeleteDialog(plan)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Plan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {plan.description}
                    </CardDescription>
                    
                    {/* Benefits */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          // Safe handling for benefits - it might come as object with features, string, or array
                          let benefits: string[] = []
                          if (typeof plan.benefits === 'object' && plan.benefits && 'features' in plan.benefits) {
                            // Handle API response format: { features: [...] }
                            benefits = Array.isArray(plan.benefits.features) ? plan.benefits.features : []
                          } else if (typeof plan.benefits === 'string') {
                            try {
                              benefits = JSON.parse(plan.benefits)
                            } catch {
                              benefits = [plan.benefits]
                            }
                          } else if (Array.isArray(plan.benefits)) {
                            benefits = plan.benefits
                          }
                          return benefits.slice(0, 4).map((benefit, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                              {benefit}
                            </Badge>
                          ))
                        })()}
                        {(() => {
                          let benefits: string[] = []
                          if (typeof plan.benefits === 'object' && plan.benefits && 'features' in plan.benefits) {
                            // Handle API response format: { features: [...] }
                            benefits = Array.isArray(plan.benefits.features) ? plan.benefits.features : []
                          } else if (typeof plan.benefits === 'string') {
                            try {
                              benefits = JSON.parse(plan.benefits)
                            } catch {
                              benefits = [plan.benefits]
                            }
                          } else if (Array.isArray(plan.benefits)) {
                            benefits = plan.benefits
                          }
                          return benefits.length > 4 ? (
                            <Badge variant="outline" className="text-xs">
                              +{benefits.length - 4} more
                            </Badge>
                          ) : null
                        })()}
                      </div>
                    </div>
                    
                    {/* Price and Stats */}
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-bold text-green-600">{formatPHPCompact(plan.price)}</div>
                        <p className="text-sm text-muted-foreground">
                          {plan.duration === 1 ? 'per day' : `per ${plan.duration} days`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-blue-600">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">{plan.memberCount || 0}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">members</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              Create New Membership Plan
            </DialogTitle>
            <DialogDescription>
              Create a new membership plan for your gym members.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Premium Monthly"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Plan Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                >
                  {membershipTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of this membership plan"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (Philippine Peso) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="1,200"
                    className="pl-8"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  placeholder="30"
                  required
                />
              </div>
            </div>
            
            {/* Benefits */}
            <div className="grid gap-2">
              <Label>Benefits</Label>
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    placeholder="e.g., Unlimited gym access"
                  />
                  {formData.benefits.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBenefit}
                className="w-fit"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Benefit
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateDialogOpen(false)
                setFormData({
                  name: '',
                  description: '',
                  price: '',
                  duration: '',
                  type: 'MONTHLY',
                  benefits: [''],
                  isActive: true
                })
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePlan}
              disabled={!formData.name || !formData.price || !formData.duration}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Edit Membership Plan
            </DialogTitle>
            <DialogDescription>
              Update the details of "{selectedPlan?.name}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Plan Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Premium Monthly"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Plan Type *</Label>
                <select
                  id="edit-type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                >
                  {membershipTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of this membership plan"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price (Philippine Peso) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="edit-price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="1,200"
                    className="pl-8"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-duration">Duration (days) *</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  placeholder="30"
                  required
                />
              </div>
            </div>
            
            {/* Benefits */}
            <div className="grid gap-2">
              <Label>Benefits</Label>
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    placeholder="e.g., Unlimited gym access"
                  />
                  {formData.benefits.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBenefit}
                className="w-fit"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Benefit
              </Button>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="edit-active">Plan is active</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditDialogOpen(false)
                setSelectedPlan(null)
                setFormData({
                  name: '',
                  description: '',
                  price: '',
                  duration: '',
                  type: 'MONTHLY',
                  benefits: [''],
                  isActive: true
                })
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditPlan}
              disabled={!formData.name || !formData.price || !formData.duration}
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Membership Plan
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPlan?.name}"? This action cannot be undone.
              {selectedPlan?.memberCount > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <strong>Warning:</strong> This plan currently has {selectedPlan.memberCount} active members.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedPlan(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeletePlan}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
