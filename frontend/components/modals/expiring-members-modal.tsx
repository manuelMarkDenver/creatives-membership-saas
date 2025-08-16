'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  AlertTriangle,
  Clock,
  Users,
  Calendar,
  Mail,
  Phone,
  Search,
  RefreshCw,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  CreditCard,
  RotateCcw
} from 'lucide-react'
import { useExpiringMembersOverview, useRefreshExpiringMembers } from '@/lib/hooks/use-expiring-members'
import type { ExpiringMembersFilters, ExpiringMember } from '@/lib/api/expiring-members'
import { toast } from 'sonner'

interface ExpiringMembersModalProps {
  isOpen: boolean
  onClose: () => void
  userRole: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF'
  userTenantId?: string
  defaultTab?: 'overview' | 'critical' | 'all'
}

export function ExpiringMembersModal({
  isOpen,
  onClose,
  userRole,
  userTenantId,
  defaultTab = 'overview'
}: ExpiringMembersModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [filters, setFilters] = useState<ExpiringMembersFilters>({
    daysBefore: 7,
    page: 1,
    limit: 10
  })
  const [searchTerm, setSearchTerm] = useState('')

  const { data: expiringData, isLoading, error, refetch } = useExpiringMembersOverview(filters)
  const refreshMutation = useRefreshExpiringMembers()

  // Handle "Remind me later" localStorage logic
  const handleRemindLater = () => {
    const today = new Date().toDateString()
    localStorage.setItem('expiring-members-remind-later', today)
    toast.success('You\'ll be reminded again tomorrow')
    onClose()
  }

  const handleRefresh = () => {
    refreshMutation.mutate()
    refetch()
  }

  const updateFilters = (newFilters: Partial<ExpiringMembersFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const changePage = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const getUrgencyColor = (urgency: 'critical' | 'high' | 'medium') => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const formatDaysRemaining = (days: number) => {
    if (days <= 0) return 'Expired'
    if (days === 1) return '1 day left'
    return `${days} days left`
  }

  const filteredMembers = expiringData?.subscriptions.filter(member => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      member.memberName.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.membershipPlan.name.toLowerCase().includes(searchLower) ||
      member.tenant.name.toLowerCase().includes(searchLower) ||
      (member.branch?.name && member.branch.name.toLowerCase().includes(searchLower))
    )
  }) || []

  const criticalMembers = filteredMembers.filter(m => m.urgency === 'critical')
  const highMembers = filteredMembers.filter(m => m.urgency === 'high')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Expiring Memberships
          </DialogTitle>
          <DialogDescription>
            Review and manage members with expiring subscriptions within the next {filters.daysBefore} days
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members, plans, or gyms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Days ahead:</Label>
              <Select 
                value={filters.daysBefore?.toString()} 
                onValueChange={(value) => updateFilters({ daysBefore: parseInt(value) })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="14">14</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>

              {userRole === 'SUPER_ADMIN' && (
                <Select value={filters.tenantId || 'all'} onValueChange={(value) => updateFilters({ tenantId: value === 'all' ? undefined : value })}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Gyms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gyms</SelectItem>
                    {/* We'd need to fetch tenants list here */}
                  </SelectContent>
                </Select>
              )}

              {/* Branch Filter - Show only if user can filter by branch (not for STAFF role) */}
              {expiringData?.accessSummary?.canFilterByBranch && userRole !== 'STAFF' && expiringData?.availableBranches && expiringData.availableBranches.length > 1 && (
                <Select 
                  value={filters.branchId || 'all'} 
                  onValueChange={(value) => updateFilters({ branchId: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {expiringData.availableBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshMutation.isPending}>
                <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {expiringData?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-600">{expiringData.summary.critical}</div>
                <div className="text-xs text-red-600 dark:text-red-400">Critical (≤1 day)</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-600">{expiringData.summary.high}</div>
                <div className="text-xs text-orange-600 dark:text-orange-400">High (≤3 days)</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-600">{expiringData.summary.medium}</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">Medium (4-7 days)</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{expiringData.summary.totalExpiring}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Total Expiring</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "overview" | "critical")} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="critical">
                Critical ({criticalMembers.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Members ({filteredMembers.length})
              </TabsTrigger>
              {userRole === 'SUPER_ADMIN' && (
                <TabsTrigger value="by-gym">
                  By Gym
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="critical" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {criticalMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No critical expiring members</p>
                  </div>
                ) : (
                  criticalMembers.map((member) => (
                    <MemberCard key={member.id} member={member} showTenant={userRole === 'SUPER_ADMIN'} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                    <p className="mt-2 text-gray-500">Loading expiring members...</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No expiring members found</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <MemberCard key={member.id} member={member} showTenant={userRole === 'SUPER_ADMIN'} />
                  ))
                )}
              </div>

              {/* Pagination */}
              {expiringData?.pagination && expiringData.pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((expiringData.pagination.page - 1) * expiringData.pagination.limit) + 1} to{' '}
                    {Math.min(expiringData.pagination.page * expiringData.pagination.limit, expiringData.pagination.total)} of{' '}
                    {expiringData.pagination.total} members
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(expiringData.pagination.page - 1)}
                      disabled={!expiringData.pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(expiringData.pagination.page + 1)}
                      disabled={!expiringData.pagination.hasNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {userRole === 'SUPER_ADMIN' && (
              <TabsContent value="by-gym" className="space-y-4">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {expiringData?.groupedByTenant ? (
                    Object.entries(expiringData.groupedByTenant).map(([tenantName, group]) => (
                      <div key={group.tenant.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-500" />
                            <h3 className="font-semibold">{tenantName}</h3>
                            <Badge variant="secondary">{group.count} expiring</Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {group.members.map((member) => (
                            <MemberCard key={member.id} member={member} showTenant={false} compact />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2">No gyms with expiring members</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleRemindLater}>
            Remind Me Tomorrow
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface MemberCardProps {
  member: ExpiringMember
  showTenant?: boolean
  compact?: boolean
}

function MemberCard({ member, showTenant = false, compact = false }: MemberCardProps) {
  const getUrgencyInfo = (urgency: 'critical' | 'high' | 'medium', days: number) => {
    if (days <= 0) {
      const expiredDays = Math.abs(days)
      return {
        badgeClass: 'bg-red-600 text-white border-red-700',
        cardBorder: 'border-red-200 dark:border-red-800',
        cardBg: 'bg-red-50/50 dark:bg-red-950/20',
        text: expiredDays === 0 ? 'Expires Today' : `${expiredDays} day${expiredDays > 1 ? 's' : ''} overdue`,
        pillClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      }
    }
    
    switch (urgency) {
      case 'critical':
        return {
          badgeClass: 'bg-red-500 text-white border-red-600',
          cardBorder: 'border-red-200 dark:border-red-800',
          cardBg: 'bg-red-50/30 dark:bg-red-950/10',
          text: days === 1 ? '1 day left' : `${days} days left`,
          pillClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }
      case 'high':
        return {
          badgeClass: 'bg-orange-500 text-white border-orange-600',
          cardBorder: 'border-orange-200 dark:border-orange-800',
          cardBg: 'bg-orange-50/30 dark:bg-orange-950/10',
          text: days === 1 ? '1 day left' : `${days} days left`,
          pillClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
        }
      case 'medium':
        return {
          badgeClass: 'bg-yellow-500 text-white border-yellow-600',
          cardBorder: 'border-yellow-200 dark:border-yellow-800',
          cardBg: 'bg-yellow-50/30 dark:bg-yellow-950/10',
          text: days === 1 ? '1 day left' : `${days} days left`,
          pillClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        }
      default:
        return {
          badgeClass: 'bg-gray-500 text-white border-gray-600',
          cardBorder: 'border-gray-200 dark:border-gray-700',
          cardBg: '',
          text: 'Unknown',
          pillClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
    }
  }

  const handleRenewClick = () => {
    // TODO: Implement renewal logic - redirect to renewal page or open renewal modal
    toast.success(`Opening renewal for ${member.memberName}...`)
    // You can implement this to navigate to renewal page or open a renewal modal
    // For example: router.push(`/members/${member.customerId}/renew`)
  }

  const urgencyInfo = getUrgencyInfo(member.urgency, member.daysUntilExpiry)

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
      urgencyInfo.cardBorder
    } ${
      urgencyInfo.cardBg
    } ${
      compact ? 'text-sm p-3' : ''
    }`}>
      <div className="flex items-center space-x-3 flex-1">
        {/* Member Avatar */}
        {member.photoUrl ? (
          <img 
            src={member.photoUrl} 
            alt={member.memberName}
            className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} rounded-full object-cover border-2 border-gray-200`}
          />
        ) : (
          <div className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
            {member.memberName.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* Member Name and Urgency Badge */}
          <div className="flex items-center gap-2 mb-2">
            <h4 className={`font-semibold text-gray-900 dark:text-gray-100 truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {member.memberName}
            </h4>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyInfo.pillClass}`}>
              {urgencyInfo.text}
            </div>
          </div>
          
          {/* Contact Information */}
          <div className={`flex items-center gap-4 mb-2 ${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
            {member.email && (
              <div className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phoneNumber && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{member.phoneNumber}</span>
              </div>
            )}
          </div>
          
          {/* Plan, Price, Branch, and Tenant Info */}
          <div className={`flex items-center gap-4 ${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 flex-wrap`}>
            <span className="font-medium text-purple-600 dark:text-purple-400">
              {member.membershipPlan.name}
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              ₱{member.price.toLocaleString()}
            </span>
            
            {/* Branch Information - Always show if available */}
            {member.branch?.name && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="font-medium text-blue-600 dark:text-blue-400">{member.branch.name}</span>
              </div>
            )}
            
            {/* Tenant Information - Show only when showTenant is true */}
            {showTenant && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="font-medium">{member.tenant.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Section: Expiry Date and Action Button */}
      <div className={`text-right flex flex-col items-end gap-2 ${compact ? 'text-xs' : 'text-sm'} ml-4`}>
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <Calendar className="h-3 w-3" />
          <span>{new Date(member.endDate).toLocaleDateString()}</span>
        </div>
        
        {/* Renew Button */}
        {!compact && (
          <Button
            size="sm"
            variant={member.daysUntilExpiry <= 0 ? "destructive" : "default"}
            onClick={handleRenewClick}
            className="text-xs h-7 px-3"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Renew
          </Button>
        )}
      </div>
    </div>
  )
}
