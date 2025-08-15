'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Building2, 
  Plus, 
  Settings, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { useBusinessUnits } from '@/hooks/use-business-units'
import { BusinessUnit } from '@/lib/api/business-units'

export function BusinessUnitsDashboard() {
  const {
    // Data
    businessUnits,
    businessUnitStats,
    paidModeEnabled,
    freeUnitsLimit,
    activeUnitsCount,
    paidUnitsCount,
    trialUnitsCount,
    isAtFreeLimit,
    
    // Loading states
    isLoading,
    isProcessing,
    
    // Error states
    hasError,
    unitsError,
    statsError,
    
    // Actions
    refresh,
    togglePaid,
    activateUnit,
    deactivateUnit,
    
    // Getters
    getActiveUnits,
    canCreateMoreUnits,
  } = useBusinessUnits({ loadStats: true })

  const handleTogglePaidMode = async () => {
    await togglePaid(!paidModeEnabled)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getUnitStatusBadge = (unit: BusinessUnit) => {
    if (!unit.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    
    if (unit.isPaid) {
      return <Badge variant="default">Paid</Badge>
    }
    
    if (unit.trialEndsAt) {
      const trialEnd = new Date(unit.trialEndsAt)
      const now = new Date()
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysLeft < 0) {
        return <Badge variant="destructive">Expired</Badge>
      }
      
      if (daysLeft <= 3) {
        return <Badge variant="destructive">Trial Ending</Badge>
      }
      
      return <Badge variant="outline">Trial ({daysLeft}d left)</Badge>
    }
    
    return <Badge variant="outline">Trial</Badge>
  }

  if (hasError) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>Error loading business units: {unitsError || statsError || 'Unknown error'}</p>
          </div>
          <Button onClick={refresh} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with paid mode toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Business Units
          </h1>
          <p className="text-muted-foreground">
            Manage your gym locations and subscription modes
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="paid-mode" className="text-sm font-medium">
              Paid Mode
            </label>
            <Switch
              id="paid-mode"
              checked={paidModeEnabled}
              onCheckedChange={handleTogglePaidMode}
              disabled={isProcessing}
            />
          </div>
          
          <Button 
            onClick={refresh}
            variant="outline"
            disabled={isLoading}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{businessUnitStats?.total || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {activeUnitsCount} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Units</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{paidUnitsCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Generating revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Units</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{trialUnitsCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              On trial period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mode Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <Badge variant={paidModeEnabled ? "default" : "secondary"} className="text-sm">
                {paidModeEnabled ? "Paid" : "Free"}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              {paidModeEnabled ? 'Unlimited units' : `${freeUnitsLimit} unit limit`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Units List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Units</CardTitle>
              <CardDescription>
                Your gym locations and business units
              </CardDescription>
            </div>
            
            <Button 
              disabled={!canCreateMoreUnits() || isProcessing}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Unit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAtFreeLimit && !paidModeEnabled && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">
                  You've reached the free unit limit ({freeUnitsLimit}). Enable paid mode to add more units.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))
            ) : businessUnits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No business units found</p>
                <p className="text-sm">Create your first business unit to get started</p>
              </div>
            ) : (
              businessUnits.map((unit) => (
                <div 
                  key={unit.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{unit.name}</h3>
                      {getUnitStatusBadge(unit)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{unit.unitType}</p>
                      {unit.contactEmail && <p>{unit.contactEmail}</p>}
                      {unit.address && <p>{unit.address}</p>}
                      {unit.trialEndsAt && (
                        <p>Trial ends: {formatDate(unit.trialEndsAt)}</p>
                      )}
                      {unit.monthlyPrice && (
                        <p>Monthly: ${unit.monthlyPrice}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!unit.isPaid && unit.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activateUnit(unit.id)}
                        disabled={isProcessing}
                      >
                        Activate
                      </Button>
                    )}
                    
                    {unit.isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deactivateUnit(unit.id)}
                        disabled={isProcessing}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activateUnit(unit.id)}
                        disabled={isProcessing}
                      >
                        Reactivate
                      </Button>
                    )}
                    
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
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
