'use client'

import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useSystemSubscriptionStats } from '@/lib/hooks/use-stats'
import { usePlans } from '@/lib/hooks/use-plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  CreditCard, 
  Check, 
  X, 
  Calendar,
  DollarSign,
  Zap,
  Shield,
  Users,
  BarChart3,
  Clock,
  AlertCircle,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Settings,
  Globe,
  Building
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatPHP } from '@/lib/utils/currency'

// Mock subscription data
const currentPlan = {
  name: 'Pro Plan',
  status: 'ACTIVE',
  billingCycle: 'MONTHLY',
  price: 2499.99,
  nextBilling: '2024-09-06',
  daysUntilRenewal: 23,
  features: [
    'Up to 500 members',
    'Unlimited staff accounts',
    'Advanced analytics',
    'Priority support',
    'Custom branding',
    'API access'
  ]
}

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: { monthly: 999.99, yearly: 9999.99 },
    description: 'Perfect for small gyms getting started',
    features: [
      'Up to 100 members',
      '2 staff accounts',
      'Basic reporting',
      'Email support',
      'Mobile app access'
    ],
    limitations: [
      'No custom branding',
      'Limited integrations'
    ],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 2499.99, yearly: 24999.99 },
    description: 'Ideal for growing fitness businesses',
    features: [
      'Up to 500 members',
      'Unlimited staff accounts',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'API access',
      'Member mobile app'
    ],
    limitations: [],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 4999.99, yearly: 49999.99 },
    description: 'For large chains and franchises',
    features: [
      'Unlimited members',
      'Unlimited staff accounts',
      'Advanced analytics & reporting',
      '24/7 phone support',
      'White-label solution',
      'Custom integrations',
      'Dedicated account manager',
      'Multi-location management'
    ],
    limitations: [],
    popular: false
  }
]

export default function SubscriptionPage() {
  const { data: profile } = useProfile()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN'

  // Fetch subscription data based on user role
  const { data: systemSubscriptionStats, isLoading, error } = useSystemSubscriptionStats()
  const { data: plansData, isLoading: plansLoading, error: plansError } = usePlans()

  const allSubscriptions = systemSubscriptionStats?.subscriptions || []

  // Filter subscriptions
  const filteredSubscriptions = allSubscriptions.filter((subscription: any) => {
    const matchesSearch = subscription.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.branch.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || subscription.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: systemSubscriptionStats?.summary?.totalSubscriptions || 0,
    active: systemSubscriptionStats?.summary?.activeSubscriptions || 0,
    totalRevenue: systemSubscriptionStats?.summary?.totalRevenue || 0,
    statusBreakdown: systemSubscriptionStats?.summary?.statusBreakdown || {}
  }

  if (!isSuperAdmin) {
    // Show tenant subscription view for owners/managers
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-purple-500" />
              SaaS Subscription
            </h1>
            <p className="text-muted-foreground">
              Your subscription to our gym management platform
            </p>
          </div>
        </div>

        {/* Current Plan Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your current subscription details and billing information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Plan Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Monthly Pro Plan</h3>
                    <p className="text-muted-foreground">Full gym management features</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-muted-foreground">Monthly Price</span>
                    <span className="font-medium">₱1,500.00</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-muted-foreground">Next Billing</span>
                    <span className="font-medium">March 6, 2025</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Days Remaining</span>
                    <span className="font-medium text-green-600">23 days</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h4 className="font-semibold">Plan Features</h4>
                <div className="space-y-2">
                  {[
                    'Up to 500 members',
                    'Unlimited staff accounts',
                    'Advanced analytics',
                    'Priority support',
                    'Custom branding',
                    'API access',
                    'Member mobile app'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Need to make changes?</p>
                  <p className="text-sm">Contact support or upgrade your plan</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                  <Button size="sm">
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Your recent payments and billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock payment history */}
              {[
                { date: '2025-02-06', amount: 1500, status: 'Paid', method: 'Credit Card' },
                { date: '2025-01-06', amount: 1500, status: 'Paid', method: 'Credit Card' },
                { date: '2024-12-06', amount: 1500, status: 'Paid', method: 'GCash' },
                { date: '2024-11-06', amount: 1500, status: 'Paid', method: 'Credit Card' },
              ].map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">₱{payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{payment.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {payment.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(payment.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-purple-500" />
            Subscription Management
          </h1>
          <p className="text-muted-foreground">
            Manage all tenant subscriptions and billing across the platform
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Subscription
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatPHP(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All time revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.statusBreakdown.EXPIRED || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Management */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>Manage subscriptions across all tenants</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search subscriptions, tenants, or plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELED">Canceled</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Subscriptions List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">Loading subscriptions...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                Failed to load subscriptions. Please try again.
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search.' : 'No subscriptions available.'}
                </p>
              </div>
            ) : (
              filteredSubscriptions.map((subscription: any) => (
                <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{subscription.branch.name}</h4>
                      <p className="text-sm text-muted-foreground">{subscription.branch.tenant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {subscription.plan.name} • {formatPHP(subscription.plan.price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 
                                      subscription.status === 'EXPIRED' ? 'destructive' : 'secondary'}>
                          {subscription.status}
                        </Badge>
                        <Badge variant="outline">
                          {subscription.branch.tenant.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {subscription.daysRemaining > 0 
                          ? `${subscription.daysRemaining} days remaining`
                          : 'Expired'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Revenue: {formatPHP(subscription.totalPayments)}
                      </p>
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
                          Edit Subscription
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Extend Subscription
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <DollarSign className="mr-2 h-4 w-4" />
                          View Payments
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancel Subscription
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

      {/* Plans Management */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Manage subscription plans available to tenants</CardDescription>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading plans...</div>
            </div>
          ) : plansError ? (
            <div className="text-center py-8 text-red-600">
              Failed to load plans. Please try again.
            </div>
          ) : plansData?.plans?.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No plans found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first subscription plan to get started.
              </p>
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plansData?.plans?.map((plan: any) => (
                <div key={plan.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {plan.billingCycle.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-2xl font-bold">
                      {formatPHP(parseFloat(plan.price))}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.billingCycle === 'YEARLY' ? 'year' : 
                          plan.billingCycle === 'MONTHLY' ? 'month' : 
                          plan.billingCycle === 'TRIAL' ? 'trial' : 'one-time'}
                      </span>
                    </div>
                  </div>

                  {/* Plan usage stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Subscriptions:</span>
                      <span className="font-medium">
                        {systemSubscriptionStats?.subscriptions?.filter((s: any) => 
                          s.plan.id === plan.id && s.status === 'ACTIVE'
                        ).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Revenue:</span>
                      <span className="font-medium">
                        {formatPHP(
                          systemSubscriptionStats?.subscriptions
                            ?.filter((s: any) => s.plan.id === plan.id)
                            ?.reduce((sum: number, s: any) => sum + s.totalPayments, 0) || 0
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <MoreHorizontal className="h-4 w-4 mr-1" />
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          View Subscriptions
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          {plan.isActive ? 'Disable' : 'Enable'} Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Plan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
