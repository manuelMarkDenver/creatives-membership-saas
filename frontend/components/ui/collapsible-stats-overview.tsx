'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown,
  ChevronUp,
  BarChart3 
} from 'lucide-react'

export interface StatItem {
  key: string
  label: string
  value: number | string
  icon: any
  color: string
  description: string
}

interface CollapsibleStatsOverviewProps {
  title: string
  stats: StatItem[]
  compactSummary?: StatItem[] // Subset of stats to show in collapsed mobile view
  className?: string
}

export function CollapsibleStatsOverview({ 
  title, 
  stats, 
  compactSummary, 
  className 
}: CollapsibleStatsOverviewProps) {
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

  // Use provided compact summary or first 3 stats as default
  const summaryStats = compactSummary || stats.slice(0, 3)

  // Compact summary bar content for mobile
  const CompactSummary = () => (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <BarChart3 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">Stats</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {summaryStats.map((stat) => (
            <span key={stat.key} className={`${stat.color}`}>
              <span className="font-semibold">{stat.value}</span> {stat.label}
            </span>
          ))}
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
        {stats.map((stat) => {
          const Icon = stat.icon
          
          return (
            <div
              key={stat.key}
              className="bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 dark:from-pink-950/10 dark:via-purple-950/10 dark:to-orange-950/10 border border-pink-200/50 dark:border-pink-900/30 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {stat.label}
                </span>
                <Icon className="h-3 w-3 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 dark:from-pink-300 dark:via-purple-300 dark:to-orange-300 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stat.description}
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
            <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              
              return (
                <div
                  key={stat.key}
                  className="bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 dark:from-pink-950/10 dark:via-purple-950/10 dark:to-orange-950/10 border border-pink-200/50 dark:border-pink-900/30 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                      {stat.label}
                    </span>
                    <Icon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 dark:from-pink-300 dark:via-purple-300 dark:to-orange-300 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.description}
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
