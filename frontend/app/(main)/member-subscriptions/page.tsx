'use client'

import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-users'
import { useMembershipPlans } from '@/lib/hooks/use-membership-plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  CreditCard, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  DollarSign,
  Calendar,
  Users,
  MoreHorizontal,
  Eye,
  Copy,
  Star
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatPHP } from '@/lib/utils/currency'
import { MembershipPlanModal } from '@/components/modals/membership-plan-modal'

export default function MemberSubscriptionsPage() {
  const { data: profile } = useProfile()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const { data: membershipPlans, isLoading, error, refetch } = useMembershipPlans()

  const filteredPlans = membershipPlans?.filter((plan: any) => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleCreatePlan = () => {
    setSelectedPlan(null)
    setModalMode('create')
    setShowModal(true)
  }

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan)
    setModalMode('edit')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedPlan(null)
  }

  const handlePlanSaved = () => {
    refetch()
    handleCloseModal()
  }

  // Check if user can manage plans
  const canManage = profile?.role && ['OWNER', 'MANAGER'].includes(profile.role)
  const canViewOnly = profile?.role === 'STAFF'

  if (!canManage && !canViewOnly) {
    return (
      <div className="text-center py-12">
        <CreditCard className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don&apos;t have permission to view membership plans.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-purple-500" />
            Member Subscriptions
          </h1>
          <p className="text-muted-foreground">
            Manage membership plans that your gym members can subscribe to
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCreatePlan}>
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membershipPlans?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Available membership plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Star className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {membershipPlans?.filter(p => p.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Range</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {membershipPlans && membershipPlans.length > 0 
                ? formatPHP(Math.min(...membershipPlans.map((p: any) => Number(p.price))))
                : '₱0'
              }
            </div>
            <p className="text-xs text-muted-foreground">Lowest plan price</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Price</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {membershipPlans && membershipPlans.length > 0 
                ? formatPHP(Math.max(...membershipPlans.map((p: any) => Number(p.price))))
                : '₱0'
              }
            </div>
            <p className="text-xs text-muted-foreground">Highest plan price</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Management */}
      <Card>
        <CardHeader>
          <CardTitle>Membership Plans</CardTitle>
          <CardDescription>
            {canManage 
              ? "Create and manage membership plans for your gym members"
              : "View available membership plans"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search membership plans..."
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
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No membership plans found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first membership plan.'}
                </p>
                {canManage && !searchTerm && (
                  <Button className="mt-4" onClick={handleCreatePlan}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
                  </Button>
                )}
              </div>
            ) : (
              filteredPlans.map((plan: any) => (
                <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {plan.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{plan.name}</h4>
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {plan.type.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {plan.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium text-green-600">{formatPHP(parseFloat(plan.price))}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{plan.duration} days</span>
                        </div>
                      </div>
                      {plan.benefits && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground">
                            Benefits: {JSON.parse(plan.benefits).slice(0, 2).join(', ')}
                            {JSON.parse(plan.benefits).length > 2 && `, +${JSON.parse(plan.benefits).length - 2} more`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right text-sm">
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(plan.createdAt).toLocaleDateString()}
                      </p>
                      {plan.updatedAt !== plan.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          Updated: {new Date(plan.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {canManage && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Plan
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <MembershipPlanModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSaved={handlePlanSaved}
          plan={selectedPlan}
          mode={modalMode}
          tenantId={profile?.tenantId}
        />
      )}
    </div>
  )
}
