'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-toastify'
import { Building2, Crown, ShieldCheck, User, Star, Search, Save, X } from 'lucide-react'
import { bulkAssignUserToBranches, getUserBranches, UserBranch } from '@/lib/api/user-branches'
import { branchesApi } from '@/lib/api/branches'
import { useProfile } from '@/lib/hooks/use-gym-users'

interface BranchAssignmentManagerProps {
  user: {
    id: string
    firstName: string
    lastName: string
    name?: string
    email: string
    role: string
    isActive: boolean
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const roleConfig = {
  OWNER: { icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Owner' },
  MANAGER: { icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Manager' },
  STAFF: { icon: User, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Staff' }
}

const accessLevelConfig = {
  MANAGER_ACCESS: { 
    label: 'Manager Access', 
    description: 'Can manage staff and members, view reports, edit branch settings',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  STAFF_ACCESS: { 
    label: 'Staff Access', 
    description: 'Can manage members, check-ins, and basic operations',
    color: 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function BranchAssignmentManager({ 
  user, 
  open, 
  onOpenChange, 
  onSuccess 
}: BranchAssignmentManagerProps) {
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([])
  const [accessLevel, setAccessLevel] = useState<'MANAGER_ACCESS' | 'STAFF_ACCESS'>('STAFF_ACCESS')
  const [primaryBranchId, setPrimaryBranchId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get available branches based on current user's role and access
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches', profile?.tenantId, profile?.role],
    queryFn: async () => {
      if (!profile) return { branches: [] }
      
      // Super Admin can see all branches system-wide
      if (profile.role === 'SUPER_ADMIN') {
        return await branchesApi.getSystemWide()
      }
      
      // Owner and Manager can see all branches in their tenant
      if (profile.role === 'OWNER' || profile.role === 'MANAGER') {
        return await branchesApi.getByTenant(profile.tenantId!)
      }
      
      // For staff and other roles, only show branches in their tenant
      // They should only be able to assign to branches within the same tenant
      // but the backend should enforce specific branch access control
      return await branchesApi.getByTenant(profile.tenantId!)
    },
    enabled: open && !!profile && !!profile.tenantId
  })

  // Get user's current branch assignments
  const { data: currentAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['user-branches', user.id],
    queryFn: () => getUserBranches(user.id),
    enabled: open && !!user.id
  })

  // Initialize form with current data
  useEffect(() => {
    if (currentAssignments?.branchAssignments) {
      const assignments = currentAssignments.branchAssignments as UserBranch[]
      setSelectedBranchIds(assignments.map((a: UserBranch) => a.branchId))
      setPrimaryBranchId(assignments.find((a: UserBranch) => a.isPrimary)?.branchId || '')
      
      // Set access level based on user's existing assignments
      const managerAssignment = assignments.find((a: UserBranch) => a.accessLevel === 'MANAGER_ACCESS')
      setAccessLevel(managerAssignment ? 'MANAGER_ACCESS' : 'STAFF_ACCESS')
    }
  }, [currentAssignments])

  const bulkAssignMutation = useMutation({
    mutationFn: bulkAssignUserToBranches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-branches'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Branch assignments updated successfully')
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update branch assignments')
    }
  })

  const handleSubmit = async () => {
    if (selectedBranchIds.length === 0) {
      toast.error('Please select at least one branch')
      return
    }

    // If user role is OWNER, they get access to all branches automatically
    if (user.role === 'OWNER') {
      toast.info('Owners automatically have access to all branches')
      return
    }

    // If primaryBranchId is set but not in selected branches, add it
    if (primaryBranchId && !selectedBranchIds.includes(primaryBranchId)) {
      toast.error('Primary branch must be one of the selected branches')
      return
    }

    setIsSubmitting(true)
    
    try {
      await bulkAssignMutation.mutateAsync({
        userId: user.id,
        branchIds: selectedBranchIds,
        accessLevel,
        primaryBranchId: primaryBranchId || undefined
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBranchToggle = (branchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBranchIds([...selectedBranchIds, branchId])
      // If this is the first branch selected, make it primary
      if (selectedBranchIds.length === 0) {
        setPrimaryBranchId(branchId)
      }
    } else {
      const newSelected = selectedBranchIds.filter(id => id !== branchId)
      setSelectedBranchIds(newSelected)
      
      // If we removed the primary branch, set a new primary
      if (primaryBranchId === branchId) {
        setPrimaryBranchId(newSelected[0] || '')
      }
    }
  }

  const branches = branchesData?.branches || []
  const filteredBranches = branches.filter((branch: any) => 
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  const roleInfo = roleConfig[user.role as keyof typeof roleConfig]
  const RoleIcon = roleInfo?.icon || User

  // Only owners can assign manager access
  const canAssignManagerAccess = profile?.role === 'OWNER'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Manage Branch Assignments
          </DialogTitle>
          <DialogDescription>
            Assign {userName} to specific branches and set their access level
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${roleInfo?.bg} border`}>
                  <RoleIcon className={`h-5 w-5 ${roleInfo?.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base">{userName}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {user.email}
                    <Badge variant="outline" className={roleInfo?.color}>
                      {roleInfo?.label || user.role}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Current User Access Info */}
          {profile && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground mb-2">
                  Your Access Level: <strong className={profile.role === 'SUPER_ADMIN' ? 'text-purple-600' : profile.role === 'OWNER' ? 'text-amber-600' : profile.role === 'MANAGER' ? 'text-blue-600' : 'text-gray-600'}>{profile.role}</strong>
                </div>
                <div className="text-xs text-muted-foreground">
                  {profile.role === 'SUPER_ADMIN' && (
                    <>Can manage branch assignments for all users across all tenants with any access level.</>
                  )}
                  {profile.role === 'OWNER' && (
                    <>Can manage branch assignments for all users in your tenant and assign Manager or Staff access levels.</>
                  )}
                  {profile.role === 'MANAGER' && (
                    <>Can manage branch assignments for staff in your tenant with Staff access level only.</>
                  )}
                  {!['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(profile.role) && (
                    <>You have limited access to manage branch assignments.</>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === 'OWNER' ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Crown className="h-12 w-12 mx-auto text-amber-500 mb-2" />
                  <p className="text-sm">
                    <strong>Owners</strong> automatically have access to all branches with full permissions.
                  </p>
                  <p className="text-xs mt-1">
                    No manual branch assignment is needed for Owner accounts.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Access Level Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Access Level</Label>
                <div className="grid gap-3">
                  {Object.entries(accessLevelConfig).map(([level, config]) => {
                    const disabled = level === 'MANAGER_ACCESS' && !canAssignManagerAccess
                    
                    return (
                      <div
                        key={level}
                        className={`relative border rounded-lg p-3 cursor-pointer transition-all ${
                          accessLevel === level ? config.color : 'hover:bg-gray-50'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !disabled && setAccessLevel(level as any)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <input
                              type="radio"
                              name="accessLevel"
                              value={level}
                              checked={accessLevel === level}
                              disabled={disabled}
                              onChange={() => !disabled && setAccessLevel(level as any)}
                              className="h-4 w-4"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-sm flex items-center gap-2">
                              {config.label}
                              {disabled && (
                                <Badge variant="outline" className="text-xs">
                                  Owner Only
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {config.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Branch Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Branch Access</Label>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search branches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Branch List */}
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {branchesLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading branches...
                    </div>
                  ) : filteredBranches.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No branches found
                    </div>
                  ) : (
                    filteredBranches.map((branch: any) => (
                      <div
                        key={branch.id}
                        className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={branch.id}
                            checked={selectedBranchIds.includes(branch.id)}
                            onCheckedChange={(checked) => 
                              handleBranchToggle(branch.id, checked as boolean)
                            }
                          />
                          <div>
                            <Label 
                              htmlFor={branch.id} 
                              className="text-sm font-medium cursor-pointer"
                            >
                              {branch.name}
                            </Label>
                            <div className="text-xs text-muted-foreground">
                              {branch.address}
                            </div>
                          </div>
                        </div>
                        
                        {primaryBranchId === branch.id && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="text-xs text-amber-600">Primary</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Primary Branch Selection */}
                {selectedBranchIds.length > 1 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Primary Branch</Label>
                    <Select value={primaryBranchId} onValueChange={setPrimaryBranchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary branch..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedBranchIds.map(branchId => {
                          const branch = branches.find((b: any) => b.id === branchId)
                          return branch ? (
                            <SelectItem key={branchId} value={branchId}>
                              <div className="flex items-center gap-2">
                                <Star className="h-3 w-3" />
                                {branch.name}
                              </div>
                            </SelectItem>
                          ) : null
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The primary branch will be used for default filtering and reports
                    </p>
                  </div>
                )}

                {/* Selected Branches Summary */}
                {selectedBranchIds.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      Selected Branches ({selectedBranchIds.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedBranchIds.map(branchId => {
                        const branch = branches.find((b: any) => b.id === branchId)
                        const isPrimary = primaryBranchId === branchId
                        return branch ? (
                          <Badge 
                            key={branchId} 
                            variant={isPrimary ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {isPrimary && <Star className="h-3 w-3 mr-1" />}
                            {branch.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          {user.role !== 'OWNER' && (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || selectedBranchIds.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
