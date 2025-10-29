'use client'

import { useState } from 'react'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useTenants, useSystemStats } from '@/lib/hooks/use-tenants'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { useRevenueMetrics, useOwnerInsights, useBranchPerformance, useMemberGrowthStats } from '@/lib/hooks/use-analytics'
import { formatPHPCompact, formatPHP } from '@/lib/utils/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CollapsibleStatsOverview, type StatItem } from '@/components/ui/collapsible-stats-overview'
import ChangePasswordModal from '@/components/modals/change-password-modal'
import { RevenueCard } from '@/components/analytics/revenue-card'
import { TopPerformingPlansCard } from '@/components/analytics/top-performing-plans-card'
import { MetricCard } from '@/components/analytics/metric-card'
import { Building2, Users, MapPin, Crown, TrendingUp, Activity, Plus, Globe, Key, MoreHorizontal, ExternalLink, Settings, Eye, DollarSign, UserCheck, Percent } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
      value: formatPHPCompact(stats.totalRevenue / 100),
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
              <div key={tenant.id} className="group relative flex items-center justify-between p-6 border rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800 dark:hover:to-blue-900/20 transition-all duration-200 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Status indicator */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">{tenant.name}</h4>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs px-2 py-1 rounded-full">
                          {tenant.category?.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs px-2 py-1 rounded-full border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400">
                          <MapPin className="w-3 h-3 mr-1" />
                          {(tenant.branches?.length || 0)} branches
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tenant.email || tenant.address || 'No contact info'}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Created: {new Date(tenant.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Subscription Status Pills */}
                  <div className="hidden sm:flex flex-col gap-2 items-end">
                    {tenant.branches?.map((branch: any, index: number) => {
                      // Get the latest subscription for this branch
                      const latestSubscription = branch.subscriptions?.[0];
                      const isExpired = latestSubscription && new Date(latestSubscription.endDate) <= new Date();
                      const daysRemaining = latestSubscription 
                        ? Math.ceil((new Date(latestSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      
                      return (
                        <div key={branch.id || index} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-full border shadow-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-24">
                            {branch.name}
                          </span>
                          {latestSubscription ? (
                            <>
                              <Badge 
                                variant={isExpired ? 'destructive' : 
                                        latestSubscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className="text-xs px-2 py-1 rounded-full"
                              >
                                {latestSubscription.plan?.name || 'Unknown'}
                              </Badge>
                              {!isExpired && latestSubscription.status === 'ACTIVE' && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  {daysRemaining > 0 
                                    ? `${daysRemaining}d left`
                                    : 'Expires today'}
                                </span>
                              )}
                              {isExpired && (
                                <span className="text-xs text-red-500 font-medium">
                                  Expired
                                </span>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs px-2 py-1 rounded-full border-orange-200 text-orange-600 dark:border-orange-800 dark:text-orange-400">
                              No subscription
                            </Badge>
                          )}
                        </div>
                      );
                    }) || (
                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full">
                        No subscription data available
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Quick Actions */}
                    <div className="hidden md:flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-xs hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                        onClick={() => window.open(`/dashboard?tenant=${tenant.id}`, '_blank')}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Link href={`/tenants`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 text-xs hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Manage
                        </Button>
                      </Link>
                    </div>
                    
                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => window.open(`/dashboard?tenant=${tenant.id}`, '_blank')}
                          className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/tenants`} className="cursor-pointer flex items-center w-full">
                            <Settings className="w-4 h-4 mr-2" />
                            Manage Tenant
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => window.open(`/tenants`, '_blank')}
                          className="cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in New Tab
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<'this_week' | 'this_month' | 'this_year'>('this_month')
  
  const { data: profile } = useProfile()
  const { data: branchesData, isLoading: branchesLoading } = useBranchesByTenant(
    profile?.tenantId || ''
  )
  const branches = branchesData || []
  
  const { data: revenueMetrics, isLoading: revenueLoading } = useRevenueMetrics({
    branchId: selectedBranch === 'all' ? undefined : selectedBranch,
    period: selectedPeriod,
  })
  
  const { data: ownerInsights, isLoading: insightsLoading } = useOwnerInsights({
    branchId: selectedBranch === 'all' ? undefined : selectedBranch,
    period: selectedPeriod,
  })
  
  const { data: branchPerformance } = useBranchPerformance({
    period: selectedPeriod,
  })
  
  const { data: memberGrowth, isLoading: memberGrowthLoading } = useMemberGrowthStats({
    branchId: selectedBranch === 'all' ? undefined : selectedBranch,
    period: selectedPeriod,
  })
  
  // Feature flag for advanced analytics
  const showAdvancedAnalytics = process.env.NEXT_PUBLIC_FEATURE_ADVANCED_ANALYTICS === 'true'

  if (branchesLoading) {
    return <div className="animate-pulse">Loading Owner Dashboard...</div>
  }

  // Calculate real stats from branches data
  const totalMembers = branches.reduce((sum: number, branch: any) => {
    return sum + (branch._count?.userBranches || 0)
  }, 0)

  const totalRevenue = branches.reduce((sum: number, branch: any) => {
    // Calculate revenue from active subscriptions
    const activeSubscriptions = branch.subscriptions?.filter((sub: any) => sub.status === 'ACTIVE') || []
    return sum + activeSubscriptions.reduce((subSum: number, sub: any) => subSum + (sub.plan?.price || 0), 0)
  }, 0)

  const activeBranches = branches.length // All branches are active (soft delete is used)

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            Owner Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back, {profile?.firstName}! Here's your business overview.
          </p>
        </div>
        <Button 
          onClick={() => setChangePasswordOpen(true)}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Key className="w-4 h-4 mr-2" />
          Change Password
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Branch Filter</label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch: any) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Time Period</label>
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Analytics Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RevenueCard
          totalRevenue={revenueMetrics?.totalRevenue || 0}
          growthRate={revenueMetrics?.growthRate || 0}
          growthAmount={revenueMetrics?.growthAmount || 0}
          isLoading={revenueLoading}
        />
        {showAdvancedAnalytics ? (
          <>
            <MetricCard
              title="Avg Revenue/Member"
              value={formatPHP(revenueMetrics?.averageRevenuePerMember || 0)}
              icon={UserCheck}
              isLoading={revenueLoading}
            />
            <MetricCard
              title="Collection Rate"
              value={`${ownerInsights?.collectionRate.toFixed(1) || 0}%`}
              subtitle="Payments vs expected"
              icon={Percent}
              isLoading={insightsLoading}
            />
            <MetricCard
              title="Renewal Rate"
              value={`${ownerInsights?.subscriptionRenewalRate.toFixed(1) || 0}%`}
              subtitle="Member retention"
              icon={TrendingUp}
              isLoading={insightsLoading}
            />
          </>
        ) : (
          <MetricCard
            title="Total Members"
            value={memberGrowth?.totalMembers?.toLocaleString() || '0'}
            subtitle={selectedBranch === 'all' ? 'All branches' : 'Selected branch'}
            icon={Users}
            isLoading={memberGrowthLoading}
          />
        )}
      </div>
      
      {/* Top Performing Plans */}
      <TopPerformingPlansCard
        plans={ownerInsights?.topPerformingPlans || []}
        isLoading={insightsLoading}
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
              {branches.map((branch: any) => {
                const performance = branchPerformance?.find((bp: any) => bp.branchId === branch.id)
                const memberCount = branch._count?.gymUserBranches || branch._count?.activeMembers || 0
                return (
                  <div key={branch.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-semibold">{branch.name}</h4>
                      <p className="text-sm text-muted-foreground">{branch.address || 'No address set'}</p>
                      {performance && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {memberCount} members
                          </span>
                          {performance.totalRevenue > 0 && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <TrendingUp className="h-3 w-3" />
                              {formatPHP(performance.totalRevenue)} revenue
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">
                        Active
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={changePasswordOpen} 
        onOpenChange={setChangePasswordOpen} 
      />
    </div>
  )
}

function DefaultDashboard() {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const { data: profile } = useProfile()
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {profile?.firstName}!
          </p>
        </div>
        <Button 
          onClick={() => setChangePasswordOpen(true)}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Key className="w-4 h-4 mr-2" />
          Change Password
        </Button>
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
      
      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={changePasswordOpen} 
        onOpenChange={setChangePasswordOpen} 
      />
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

  if (profile.role === 'CLIENT') {
    return <DefaultDashboard />
  }

  return <DefaultDashboard />
}
