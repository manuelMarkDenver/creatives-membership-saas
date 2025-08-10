'use client'

import { useExpiringMembersCount, useExpiringMembersOverview, useExpiringMembers } from '@/lib/hooks/use-expiring-members'
import { useProfile, useUsersByTenant } from '@/lib/hooks/use-users'
import { getExpiringMembersCount, isMemberConsideredExpiring, type MemberData } from '@/lib/utils/member-status'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Bug, Users } from 'lucide-react'

interface ExpiringMembersDebugProps {
  className?: string
}

export function ExpiringMembersDebug({ className = '' }: ExpiringMembersDebugProps) {
  const { data: profile } = useProfile()
  
  // Get data from different sources
  const { data: badgeCountData } = useExpiringMembersCount(
    profile?.tenantId || '', 
    7, // 7 days ahead
    { enabled: !!profile?.tenantId }
  )
  
  const { data: modalData } = useExpiringMembersOverview({
    daysBefore: 7,
    page: 1,
    limit: 50
  })
  
  const { data: membersData } = useUsersByTenant(
    profile?.tenantId || '', 
    { role: 'GYM_MEMBER' }
  )
  
  if (!profile?.tenantId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Expiring Members Debug
          </CardTitle>
          <CardDescription>No tenant ID available</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  // Calculate stats from regular members list
  const localExpiringCount = membersData ? getExpiringMembersCount(membersData as MemberData[], 7) : 0
  
  // Get detailed breakdown
  const memberBreakdown = membersData ? (membersData as MemberData[]).map(member => {
    const isExpiring = isMemberConsideredExpiring(member, 7)
    const subscription = member.customerSubscriptions?.[0]
    
    return {
      name: member.name || `${member.firstName} ${member.lastName}`.trim() || member.email,
      isActive: member.isActive,
      isDeleted: Boolean(member.deletedAt),
      subscriptionStatus: subscription?.status || 'NONE',
      subscriptionEndDate: subscription?.endDate || 'N/A',
      isConsideredExpiring: isExpiring
    }
  }).filter(m => m.isConsideredExpiring) : []

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Expiring Members Debug
        </CardTitle>
        <CardDescription>
          Investigating discrepancy between badge count and stats count
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Count Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
              <div>
                <div className="text-sm font-medium">Badge Count</div>
                <div className="text-xs text-muted-foreground">From API</div>
              </div>
              <Badge variant="destructive" className="text-lg font-bold px-3 py-1">
                {badgeCountData?.count || '?'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
              <div>
                <div className="text-sm font-medium">Modal Count</div>
                <div className="text-xs text-muted-foreground">From overview API</div>
              </div>
              <Badge variant="default" className="text-lg font-bold px-3 py-1">
                {modalData?.summary?.totalExpiring || '?'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
              <div>
                <div className="text-sm font-medium">Local Count</div>
                <div className="text-xs text-muted-foreground">From members list</div>
              </div>
              <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                {localExpiringCount}
              </Badge>
            </div>
          </div>
          
          {/* Data Source Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-medium">Badge API</div>
              <div className="text-muted-foreground">
                {badgeCountData ? '✅ Loaded' : '❌ Loading/Error'}
              </div>
            </div>
            <div>
              <div className="font-medium">Modal API</div>
              <div className="text-muted-foreground">
                {modalData ? '✅ Loaded' : '❌ Loading/Error'}
              </div>
            </div>
            <div>
              <div className="font-medium">Members API</div>
              <div className="text-muted-foreground">
                {membersData ? `✅ ${membersData.length} members` : '❌ Loading/Error'}
              </div>
            </div>
          </div>
          
          {/* Expiring Members Detail */}
          {memberBreakdown.length > 0 && (
            <div>
              <div className="font-medium text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Expiring Members Detail ({memberBreakdown.length})
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {memberBreakdown.map((member, idx) => (
                  <div key={idx} className="text-xs p-2 bg-gray-50 rounded border">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-muted-foreground">
                      Status: {member.subscriptionStatus} | 
                      End: {member.subscriptionEndDate} | 
                      Active: {member.isActive ? 'Yes' : 'No'}
                      {member.isDeleted && ' | DELETED'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* API Response Debug */}
          {modalData && (
            <div className="text-xs">
              <div className="font-medium mb-1">Modal Data Summary</div>
              <div className="bg-gray-50 p-2 rounded border font-mono">
                Total: {modalData.summary.totalExpiring} | 
                Critical: {modalData.summary.critical} | 
                High: {modalData.summary.high} | 
                Medium: {modalData.summary.medium}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
