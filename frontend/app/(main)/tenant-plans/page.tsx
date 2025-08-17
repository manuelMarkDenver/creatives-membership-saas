'use client'

import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-users'
import { useTenants } from '@/lib/hooks/use-tenants'
import { useAllTenantMembershipPlans } from '@/lib/hooks/use-membership-plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Globe, 
  Search, 
  Building2,
  CreditCard,
  Users,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  Filter,
  Star
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Mock membership plans data - this should come from an API endpoint
const mockTenantPlans = [
  {
    id: '1',
    tenantId: 'tenant1',
    tenantName: 'FitLife Gym',
    tenantCategory: 'GYM',
    plans: [
      {
        id: 'plan1',
        name: 'Day Pass',
        description: 'Single day gym access',
        price: 150,
        duration: 1,
        type: 'DAY_PASS',
        isActive: true,
        benefits: ['Full gym access for 1 day', 'Use of all equipment', 'Locker access'],
        memberCount: 25,
        createdAt: '2024-01-15T00:00:00Z'
      },
      {
        id: 'plan2',
        name: 'Basic Monthly',
        description: 'Standard monthly membership',
        price: 1200,
        duration: 30,
        type: 'MONTHLY',
        isActive: true,
        benefits: ['Unlimited gym access', 'Group classes included', 'Locker access'],
        memberCount: 89,
        createdAt: '2024-01-15T00:00:00Z'
      }
    ]
  },
  {
    id: '2',
    tenantId: 'tenant2',
    tenantName: 'PowerFlex Fitness',
    tenantCategory: 'GYM',
    plans: [
      {
        id: 'plan3',
        name: 'Premium Monthly',
        description: 'Premium monthly with PT sessions',
        price: 2500,
        duration: 30,
        type: 'MONTHLY',
        isActive: true,
        benefits: ['Unlimited gym access', '2 Personal Training sessions', 'Nutrition consultation'],
        memberCount: 42,
        createdAt: '2024-02-01T00:00:00Z'
      }
    ]
  }
]

export default function TenantPlansPage() {
  const { data: profile } = useProfile()
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants()
  const { data: tenantPlans, isLoading: plansLoading } = useAllTenantMembershipPlans()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Only allow super admins to access this page
  if (profile?.role !== 'SUPER_ADMIN') {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    )
  }

  if (tenantsLoading || plansLoading) {
    return <div className="animate-pulse">Loading tenant membership plans...</div>
  }

  // Flatten all plans from all tenants for display
  const allPlans = (tenantPlans || []).flatMap(tenant => 
    tenant.plans.map(plan => ({
      ...plan,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      tenantCategory: tenant.tenantCategory
    }))
  )

  // Filter plans based on search and filters
  const filteredPlans = allPlans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTenant = selectedTenant === 'all' || plan.tenantId === selectedTenant
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && plan.isActive) ||
                         (selectedStatus === 'inactive' && !plan.isActive)

    return matchesSearch && matchesTenant && matchesStatus
  })

  // Calculate stats
  const stats = {
    totalPlans: allPlans.length,
    activePlans: allPlans.filter(p => p.isActive).length,
    totalMembers: allPlans.reduce((sum, plan) => sum + (plan.memberCount || 0), 0),
    avgPrice: allPlans.reduce((sum, plan) => sum + plan.price, 0) / allPlans.length
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-500" />
            All Tenant Membership Plans
          </h1>
          <p className="text-muted-foreground">
            View and monitor membership plans across all tenants
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlans}</div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activePlans}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Using these plans</p>
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

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Membership Plans Overview
          </CardTitle>
          <CardDescription>
            View and filter membership plans from all tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search plans or tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {(tenantPlans || []).map((tenant) => (
                  <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.tenantName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plans List */}
          <div className="space-y-4">
            {filteredPlans.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No plans found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm || selectedTenant !== 'all' || selectedStatus !== 'all' 
                    ? 'Try adjusting your filters.' 
                    : 'No membership plans available.'}
                </p>
              </div>
            ) : (
              filteredPlans.map((plan) => (
                <div key={`${plan.tenantId}-${plan.id}`} className="flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
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
                      
                      {/* Tenant Information */}
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-blue-500" />
                          <span className="text-sm font-medium text-blue-600">{plan.tenantName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {plan.tenantCategory}
                        </Badge>
                      </div>
                      
                      {/* Benefits */}
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
                  
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-green-600">₱{plan.price}</div>
                    <p className="text-xs text-muted-foreground">
                      {plan.duration === 1 ? 'per day' : `per ${plan.duration} days`}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      <Users className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-muted-foreground">{plan.memberCount || 0} members</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
