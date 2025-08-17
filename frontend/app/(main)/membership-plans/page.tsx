'use client'

import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-users'
import { useActiveMembershipPlans, useCreateMembershipPlan, useUpdateMembershipPlan, useDeleteMembershipPlan } from '@/lib/hooks/use-membership-plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  CreditCard, 
  Search, 
  Plus, 
  DollarSign,
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

// Mock data for now - will be replaced with API calls
const mockMembershipPlans = [
  {
    id: '1',
    name: 'Day Pass',
    description: 'Single day gym access',
    price: 150,
    duration: 1,
    type: 'DAY_PASS',
    isActive: true,
    benefits: ['Full gym access for 1 day', 'Use of all equipment', 'Locker access'],
    memberCount: 25
  },
  {
    id: '2',
    name: 'Basic Monthly',
    description: 'Standard monthly membership',
    price: 1200,
    duration: 30,
    type: 'MONTHLY',
    isActive: true,
    benefits: ['Unlimited gym access', 'Group classes included', 'Locker access', 'Fitness assessment'],
    memberCount: 89
  },
  {
    id: '3',
    name: 'Premium Monthly',
    description: 'Premium monthly membership with PT sessions',
    price: 2500,
    duration: 30,
    type: 'MONTHLY',
    isActive: true,
    benefits: ['Unlimited gym access', 'Group classes included', '2 Personal Training sessions', 'Nutrition consultation', 'Towel service', 'Guest passes (2 per month)'],
    memberCount: 42
  },
  {
    id: '4',
    name: 'Annual Basic',
    description: 'Basic annual membership - save 2 months!',
    price: 12000,
    duration: 365,
    type: 'ANNUAL',
    isActive: true,
    benefits: ['Unlimited gym access', 'Group classes included', 'Locker access', 'Quarterly fitness assessment', '2 months free!'],
    memberCount: 156
  },
  {
    id: '5',
    name: 'Student Monthly',
    description: 'Discounted membership for students',
    price: 800,
    duration: 30,
    type: 'STUDENT',
    isActive: false,
    benefits: ['Unlimited gym access', 'Group classes included', 'Student discount', 'Study area access'],
    memberCount: 12
  }
]

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
  const { data: membershipPlans = [], isLoading, error } = useActiveMembershipPlans()
  const createMembershipPlanMutation = useCreateMembershipPlan()
  const updateMembershipPlanMutation = useUpdateMembershipPlan()
  const deleteMembershipPlanMutation = useDeleteMembershipPlan()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
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
  const filteredPlans = membershipPlans.filter((plan) =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: membershipPlans.length,
    active: membershipPlans.filter(p => p.isActive).length,
    inactive: membershipPlans.filter(p => !p.isActive).length,
    totalMembers: membershipPlans.reduce((sum, plan) => sum + (plan._count?.gymSubscriptions || 0), 0),
    avgPrice: membershipPlans.length > 0 ? membershipPlans.reduce((sum, plan) => sum + plan.price, 0) / membershipPlans.length : 0
  }

  const handleCreatePlan = async () => {
    // TODO: Implement API call to create membership plan
    console.log('Creating plan:', formData)
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
  }

  const handleDeletePlan = async () => {
    // TODO: Implement API call to delete membership plan
    console.log('Deleting plan:', selectedPlan?.id)
    setDeleteDialogOpen(false)
    setSelectedPlan(null)
  }

  const togglePlanStatus = (planId: string) => {
    // TODO: Implement API call to toggle plan status
    console.log('Toggling status for plan:', planId)
  }

  const openDeleteDialog = (plan: any) => {
    setSelectedPlan(plan)
    setDeleteDialogOpen(true)
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
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All membership plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <EyeOff className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Not available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Across all plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₱{Math.round(stats.avgPrice)}</div>
            <p className="text-xs text-muted-foreground">Average plan price</p>
          </CardContent>
        </Card>
      </div>

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
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">Loading membership plans...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                Failed to load membership plans. Please try again.
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No plans found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first membership plan.'}
                </p>
              </div>
            ) : (
              filteredPlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      {plan.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{plan.name}</h4>
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {plan.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {(plan.benefits || []).slice(0, 3).map((benefit, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                            {benefit}
                          </Badge>
                        ))}
                        {(plan.benefits || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(plan.benefits || []).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">₱{plan.price}</div>
                      <p className="text-xs text-muted-foreground">
                        {plan.duration === 1 ? 'per day' : `per ${plan.duration} days`}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-muted-foreground">{plan._count?.gymSubscriptions || 0} members</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
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
                </div>
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
                <Label htmlFor="price">Price (₱) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="1200"
                  required
                />
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
