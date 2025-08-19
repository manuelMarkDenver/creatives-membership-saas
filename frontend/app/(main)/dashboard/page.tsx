'use client'

import { useProfile } from '@/lib/hooks/use-users'
import { useTenants, useSystemStats } from '@/lib/hooks/use-tenants'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CollapsibleStatsOverview, type StatItem } from '@/components/ui/collapsible-stats-overview'
import { Building2, Users, MapPin, Crown, TrendingUp, Activity, Plus, Globe } from 'lucide-react'
import Link from 'next/link'

function SuperAdminDashboard() {
  const { data: systemStats, isLoading: statsLoading } = useSystemStats()
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants(undefined, { enabled: true })
  const tenants = tenantsData || []

  if (statsLoading || tenantsLoading) {
    return <div className="animate-pulse">Loading Super Admin Dashboard...</div>
  }

  const stats = systemStats?.overview || {
    totalTenants: 0,
    totalBranches: 0,
    totalUsers: 0,
    activeTenants: 0,
    totalActiveSubscriptions: 0,
    totalSubscriptions: 0,
    totalRevenue: 0
  }

  // Prepare stats for mobile-first layout
  const dashboardStats: StatItem[] = [
    {
      key: 'totalTenants',
      label: 'Tenants',
      value: stats.totalTenants,
      icon: Building2,
      color: 'text-blue-700 dark:text-blue-400',
      description: `${stats.activeTenants} active`
    },
    {
      key: 'totalUsers',
      label: 'Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-green-700 dark:text-green-400',
      description: 'All roles included'
    },
    {
      key: 'totalBranches',
      label: 'Branches',
      value: stats.totalBranches,
      icon: MapPin,
      color: 'text-purple-700 dark:text-purple-400',
      description: 'Across all tenants'
    },
    {
      key: 'activeSubscriptions',
      label: 'Active Subs',
      value: stats.totalActiveSubscriptions,
      icon: TrendingUp,
      color: 'text-emerald-700 dark:text-emerald-400',
      description: `of ${stats.totalSubscriptions} total`
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: `₱${(stats.totalRevenue / 100).toFixed(0)}`,
      icon: TrendingUp,
      color: 'text-indigo-700 dark:text-indigo-400',
      description: 'All time earnings'
    },
    {
      key: 'systemHealth',
      label: 'Health',
      value: 'Healthy',
      icon: Activity,
      color: 'text-green-700 dark:text-green-400',
      description: 'All systems operational'
    }
  ]

  // Compact summary for mobile (first 3 most important stats)
  const compactSummary = [
    dashboardStats[0], // Tenants
    dashboardStats[1], // Users  
    dashboardStats[3], // Active Subscriptions
  ]

  return (
    <div className="space-y-4">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            System-wide overview and management
          </p>
        </div>
        <Link href="/tenants">
          <Button className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Tenant
          </Button>
        </Link>
      </div>

      {/* Mobile-First Stats Overview */}
      <CollapsibleStatsOverview 
        title="System Statistics"
        stats={dashboardStats}
        compactSummary={compactSummary}
      />

      {/* Recent Tenants - Priority Position for Mobile */}
      <Card className="border-2 shadow-md bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Recent Tenants
          </CardTitle>
          <CardDescription>
            Latest gym tenants added to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(tenants || []).slice(0, 5).map((tenant: any) => (
              <div key={tenant.id} className="flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{tenant.name}</h4>
                    <p className="text-sm text-muted-foreground">{tenant.email || tenant.address || 'No contact info'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(tenant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Badge variant="secondary">
                      {tenant.category?.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {(tenant.branches?.length || 0)} branches
                    </Badge>
                  </div>
                  
                  {/* Enhanced SaaS Subscription Information */}
                  <div className="space-y-1">
                    {tenant.branches?.map((branch: any, index: number) => {
                      // Get the latest subscription for this branch
                      const latestSubscription = branch.subscriptions?.[0]; // Already ordered by createdAt desc
                      const isExpired = latestSubscription && new Date(latestSubscription.endDate) <= new Date();
                      const daysRemaining = latestSubscription 
                        ? Math.ceil((new Date(latestSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      
                      return (
                        <div key={branch.id || index} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground truncate max-w-24">
                            {branch.name}:
                          </span>
                          {latestSubscription ? (
                            <>
                              <Badge 
                                variant={isExpired ? 'destructive' : 
                                        latestSubscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {latestSubscription.plan?.name || 'Unknown'}
                              </Badge>
                              {!isExpired && latestSubscription.status === 'ACTIVE' && (
                                <span className="text-xs text-muted-foreground">
                                  {daysRemaining > 0 
                                    ? `${daysRemaining}d left`
                                    : 'Expires today'}
                                </span>
                              )}
                              {isExpired && (
                                <span className="text-xs text-red-500">
                                  Expired
                                </span>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs text-orange-600">
                              No subscription
                            </Badge>
                          )}
                        </div>
                      );
                    }) || (
                      <div className="text-xs text-muted-foreground">
                        No subscription data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function OwnerDashboard() {
  const { data: profile } = useProfile()
  const { data: branchesData, isLoading: branchesLoading } = useBranchesByTenant(
    profile?.tenantId || ''
  )
  const branches = branchesData || []

  if (branchesLoading) {
    return <div className="animate-pulse">Loading Owner Dashboard...</div>
  }

  // Calculate real stats from branches data
  const totalMembers = branches.reduce((sum: number, branch) => {
    return sum + (branch._count?.userBranches || 0)
  }, 0)

  const totalRevenue = branches.reduce((sum: number, branch) => {
    // Calculate revenue from active subscriptions
    const activeSubscriptions = branch.subscriptions?.filter(sub => sub.status === 'ACTIVE') || []
    return sum + activeSubscriptions.reduce((subSum: number, sub) => subSum + (sub.plan?.price || 0), 0)
  }, 0)

  const activeBranches = branches.filter(branch => branch.isActive).length

  // Prepare owner dashboard stats
  const ownerStats: StatItem[] = [
    {
      key: 'branches',
      label: 'Branches',
      value: activeBranches,
      icon: MapPin,
      color: 'text-blue-700 dark:text-blue-400',
      description: `${activeBranches} of ${branches.length} active`
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: totalRevenue > 0 ? `₱${(totalRevenue / 100).toLocaleString()}` : '₱0',
      icon: TrendingUp,
      color: 'text-green-700 dark:text-green-400',
      description: 'Monthly subscriptions'
    },
    {
      key: 'activeMembers',
      label: 'Members',
      value: totalMembers.toLocaleString(),
      icon: Users,
      color: 'text-purple-700 dark:text-purple-400',
      description: 'Across all branches'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header - Mobile Optimized */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          Owner Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome back, {profile?.name || profile?.firstName}! Here&apos;s your business overview.
        </p>
      </div>

      {/* Mobile-First Stats Overview */}
      <CollapsibleStatsOverview 
        title="Business Overview"
        stats={ownerStats}
      />

      {/* Branch Overview - Priority Position for Mobile */}
      {branches.length > 0 && (
        <Card className="border-2 shadow-md bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Branch Overview
            </CardTitle>
            <CardDescription>
              Performance summary for all your locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branches.map((branch: any) => (
                <div key={branch.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{branch.name}</h4>
                    <p className="text-sm text-muted-foreground">{branch.address || 'No address set'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={branch.isActive ? "default" : "secondary"}>
                      {branch.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DefaultDashboard() {
  const { data: profile } = useProfile()
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {profile?.name || profile?.firstName}!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to the System</CardTitle>
          <CardDescription>
            Your role: {profile?.role?.replace('_', ' ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Here you can view analytics and reports based on your access level.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const { data: profile } = useProfile()

  if (!profile) {
    return <div className="animate-pulse">Loading dashboard...</div>
  }

  if (profile.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />
  }

  if (profile.role === 'OWNER') {
    return <OwnerDashboard />
  }

  return <DefaultDashboard />
}
