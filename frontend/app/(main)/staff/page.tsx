'use client'

import { useState } from 'react'
import { useProfile, useUsersByTenant } from '@/lib/hooks/use-users'
import { useSystemStaffStats } from '@/lib/hooks/use-stats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  UserPlus, 
  Search, 
  Plus, 
  Shield,
  ShieldCheck,
  User,
  Crown,
  Mail,
  Phone,
  MoreHorizontal,
  Edit,
  Trash2,
  Globe,
  Building,
  Building2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User as UserType } from '@/types'
import { BranchAssignmentBadge } from '@/components/ui/branch-assignment-badge'
import { BranchAssignmentManager } from '@/components/branch-assignment-manager'

const roleConfig = {
  OWNER: { icon: Crown, color: 'text-amber-600', bg: 'bg-amber-100' },
  MANAGER: { icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
  STAFF: { icon: User, color: 'text-gray-600', bg: 'bg-gray-100' }
}

export default function StaffPage() {
  const { data: profile } = useProfile()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [branchManagerOpen, setBranchManagerOpen] = useState(false)

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN'
  const isOwner = profile?.role === 'OWNER'
  const canManageBranches = isOwner || isSuperAdmin

  // Conditionally fetch staff data based on user role
  const { data: tenantStaffData, isLoading: isTenantLoading, error: tenantError } = useUsersByTenant(
    profile?.tenantId || '', 
    { enabled: !isSuperAdmin && !!profile?.tenantId }
  )

  const { data: systemStaffData, isLoading: isSystemLoading, error: systemError } = useSystemStaffStats()

  // Choose data source based on user role
  const isLoading = isSuperAdmin ? isSystemLoading : isTenantLoading
  const error = isSuperAdmin ? systemError : tenantError

  let allStaff: any[] = []
  if (isSuperAdmin) {
    allStaff = systemStaffData?.staff || []
  } else {
    allStaff = (tenantStaffData || []).filter((user: UserType) => 
      ['OWNER', 'MANAGER', 'STAFF', 'GYM_TRAINER', 'GYM_NUTRITIONIST', 'GYM_FRONT_DESK', 'GYM_MAINTENANCE', 'STORE_MANAGER', 'PRODUCT_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SERVICE', 'MARKETING_MANAGER', 'FULFILLMENT_STAFF', 'COFFEE_MANAGER', 'BARISTA', 'CASHIER', 'BAKER', 'SHIFT_SUPERVISOR'].includes(user.role)
    )
  }

  const filteredStaff = allStaff.filter((staff: any) => {
    const staffName = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email
    const matchesSearch = staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'ALL' || staff.role === filterRole
    return matchesSearch && matchesRole
  })

  let stats
  if (isSuperAdmin && systemStaffData) {
    stats = {
      total: systemStaffData.summary.totalStaff,
      active: systemStaffData.summary.activeStaff,
      owners: systemStaffData.summary.byRole.find(r => r.role === 'OWNER')?.count || 0,
      managers: systemStaffData.summary.byRole.find(r => r.role === 'MANAGER')?.count || 0,
      staff: systemStaffData.summary.byRole.find(r => r.role === 'STAFF')?.count || 0
    }
  } else {
    stats = {
      total: allStaff.length,
      active: allStaff.filter((s: any) => s.isActive).length,
      owners: allStaff.filter((s: any) => s.role === 'OWNER').length,
      managers: allStaff.filter((s: any) => s.role === 'MANAGER').length,
      staff: allStaff.filter((s: any) => s.role === 'STAFF').length
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserPlus className="h-8 w-8 text-green-500" />
            Staff Management
          </h1>
          <p className="text-muted-foreground">
            Manage your team members and their access levels
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owners</CardTitle>
            <Crown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.owners}</div>
            <p className="text-xs text-muted-foreground">Full access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.managers}</div>
            <p className="text-xs text-muted-foreground">Branch management</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <User className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.staff}</div>
            <p className="text-xs text-muted-foreground">General staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>Manage your team members and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>

          {/* Staff List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">Loading staff...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                Failed to load staff. Please try again.
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No staff found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Try adjusting your search.' : 'Get started by inviting your first staff member.'}
                </p>
              </div>
            ) : (
              filteredStaff.map((staff: any) => {
                const roleInfo = roleConfig[staff.role as keyof typeof roleConfig] || {
                  icon: User,
                  color: 'text-gray-600',
                  bg: 'bg-gray-100'
                }
                const RoleIcon = roleInfo.icon
                const staffName = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email
                
                return (
                  <div key={staff.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 ${roleInfo.bg} rounded-full flex items-center justify-center`}>
                        <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{staffName}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {staff.email}
                          </div>
                          {staff.phoneNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {staff.phoneNumber}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isSuperAdmin && staff.tenant ? (
                            <>
                              <Building className="inline h-3 w-3 mr-1" />
                              {staff.tenant.name} ({staff.tenant.category}) •{' '}
                            </>
                          ) : null}
                          {staff.branches && staff.branches.length > 0 
                            ? `${staff.branches.map((b: any) => b.name).join(', ')} • `
                            : 'No branch assigned • '
                          }
                          Joined {new Date(staff.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={roleInfo.color}>
                            {staff.role}
                          </Badge>
                          <Badge variant="default">
                            ACTIVE
                          </Badge>
                        </div>
                        <BranchAssignmentBadge 
                          assignments={staff.userBranches || []} 
                          userRole={staff.role}
                          variant="compact"
                        />
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
                            Edit Staff
                          </DropdownMenuItem>
                          {canManageBranches && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(staff)
                                setBranchManagerOpen(true)
                              }}
                            >
                              <Building2 className="mr-2 h-4 w-4" />
                              Manage Branch Access
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branch Assignment Manager */}
      {selectedUser && (
        <BranchAssignmentManager
          user={selectedUser}
          open={branchManagerOpen}
          onOpenChange={setBranchManagerOpen}
          onSuccess={() => {
            // Optionally refetch the staff data to show updated assignments
            // This will happen automatically due to the query invalidation in the component
          }}
        />
      )}
    </div>
  )
}
