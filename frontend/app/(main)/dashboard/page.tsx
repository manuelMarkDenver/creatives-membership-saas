'use client'

import { useProfile } from '@/lib/hooks/use-users'
import { useTenants, useSystemStats } from '@/lib/hooks/use-tenants'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, MapPin, Crown, TrendingUp, Activity, Plus } from 'lucide-react'
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="h-8 w-8 text-amber-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            System-wide overview and management
          </p>
        </div>
        <Link href="/tenants">
          <Button className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Tenant
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTenants} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBranches}</div>
            <p className="text-xs text-muted-foreground">
              Across all tenants
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All roles included
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalActiveSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalSubscriptions} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₱{(stats.totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time earnings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tenants</CardTitle>
          <CardDescription>
            Latest gym tenants added to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants.slice(0, 5).map((tenant: any) => (
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Owner Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.name || profile?.firstName}! Here&apos;s your business overview.
        </p>
      </div>

      {/* Owner Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Branches</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
            <p className="text-xs text-muted-foreground">
              Active locations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱45,231</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              Across all branches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Branch Overview */}
      {branches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Branch Overview</CardTitle>
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
