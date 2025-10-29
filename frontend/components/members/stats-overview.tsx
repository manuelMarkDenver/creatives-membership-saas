'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  UserCheck,
  Calendar,
  UserX,
  Building,
  ChevronDown,
  ChevronUp,
  BarChart3 
} from 'lucide-react'

interface MemberStats {
  total: number
  active: number
  expiring: number
  expired: number
  cancelled: number
  deleted: number
  byCategory?: any[]
}

interface StatsOverviewProps {
  stats: MemberStats
  isSuperAdmin?: boolean
  className?: string
}

interface StatItem {
  key: keyof MemberStats
  label: string
  icon: any
  color: string
  description: string
}

export function StatsOverview({ stats, isSuperAdmin = false, className }: StatsOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Define stats configuration
  const statItems: StatItem[] = [
    {
      key: 'total',
      label: 'Total',
      icon: Users,
      color: 'text-gray-700 dark:text-gray-300',
      description: 'All registered members'
    },
    {
      key: 'active',
      label: 'Active',
      icon: UserCheck,
      color: 'text-green-700 dark:text-green-400',
      description: 'Currently active'
    },
    ...(isSuperAdmin ? [] : [{
      key: 'expiring' as keyof MemberStats,
      label: 'Expiring',
      icon: Calendar,
      color: 'text-yellow-700 dark:text-yellow-400',
      description: 'Within 7 days'
    }]),
    {
      key: 'expired',
      label: 'Expired',
      icon: Calendar,
      color: 'text-orange-700 dark:text-orange-400',
      description: 'Expired subscriptions'
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      icon: UserX,
      color: 'text-red-700 dark:text-red-400',
      description: 'Subscription cancelled'
    },
    {
      key: isSuperAdmin ? 'byCategory' : 'deleted',
      label: isSuperAdmin ? 'Categories' : 'Deleted',
      icon: Building,
      color: 'text-amber-700 dark:text-amber-400',
      description: isSuperAdmin ? 'Business types' : 'Soft deleted'
    }
  ]

  // Compact summary bar content
  const CompactSummary = () => (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <BarChart3 className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900 dark:text-gray-100">Stats</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.total}</span> Total
          </span>
          <span className="text-green-600 dark:text-green-400">
            <span className="font-semibold">{stats.active}</span> Active
          </span>
          {!isSuperAdmin && (
            <span className="text-yellow-600 dark:text-yellow-400">
              <span className="font-semibold">{stats.expiring ?? 0}</span> Expiring
            </span>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-8 w-8 p-0"
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )

  // Full stats grid
  const StatsGrid = () => (
    <div className="p-4 pt-0">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {statItems.map((item) => {
          const Icon = item.icon
          const value = item.key === 'byCategory' 
            ? (stats.byCategory?.length || 0)
            : stats[item.key] as number
            
          return (
            <div
              key={item.key}
              className="bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 dark:from-pink-950/10 dark:via-purple-950/10 dark:to-orange-950/10 border border-pink-200/50 dark:border-pink-900/30 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {item.label}
                </span>
                <Icon className="h-3 w-3 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 dark:from-pink-300 dark:via-purple-300 dark:to-orange-300 bg-clip-text text-transparent">
                {value ?? 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {item.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )

  // Desktop: always expanded
  if (!isMobile) {
    return (
      <Card className={`border-2 shadow-md bg-white dark:bg-gray-800 ${className}`}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Member Statistics</h3>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {statItems.map((item) => {
              const Icon = item.icon
              const value = item.key === 'byCategory' 
                ? (stats.byCategory?.length || 0)
                : stats[item.key] as number
                
              return (
                <div
                  key={item.key}
                  className="bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 dark:from-pink-950/10 dark:via-purple-950/10 dark:to-orange-950/10 border border-pink-200/50 dark:border-pink-900/30 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                      {item.label}
                    </span>
                    <Icon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 dark:from-pink-300 dark:via-purple-300 dark:to-orange-300 bg-clip-text text-transparent">
                    {value ?? 0}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    )
  }

  // Mobile: collapsible
  return (
    <Card className={`border-2 shadow-md bg-white dark:bg-gray-800 ${className}`}>
      <CompactSummary />
      {isExpanded && <StatsGrid />}
    </Card>
  )
}
