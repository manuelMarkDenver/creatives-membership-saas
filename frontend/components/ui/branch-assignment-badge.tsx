'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Building2, MapPin, Shield, ShieldCheck } from 'lucide-react'

interface BranchAssignment {
  id: string
  branchId: string
  accessLevel: 'MANAGER_ACCESS' | 'STAFF_ACCESS' | 'FULL_ACCESS'
  isPrimary: boolean
  branch: {
    id: string
    name: string
    address?: string
  }
}

interface BranchAssignmentBadgeProps {
  assignments: BranchAssignment[]
  userRole?: 'MANAGER' | 'STAFF' | 'OWNER' | 'SUPER_ADMIN'
  showTooltip?: boolean
  variant?: 'default' | 'compact'
  className?: string
}

const accessLevelConfig = {
  FULL_ACCESS: { icon: Shield, color: 'bg-green-100 text-green-800 border-green-200', label: 'Full Access' },
  MANAGER_ACCESS: { icon: ShieldCheck, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Manager Access' },
  STAFF_ACCESS: { icon: MapPin, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Staff Access' }
}

export function BranchAssignmentBadge({
  assignments = [],
  userRole,
  showTooltip = true,
  variant = 'default',
  className = ''
}: BranchAssignmentBadgeProps) {
  
  if (!assignments || assignments.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className={`${className} bg-orange-100 text-orange-800 border-orange-200`}>
              <Building2 className="w-3 h-3 mr-1" />
              No Branch Access
            </Badge>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent>
              <p>This user has no branch assignments</p>
              <p className="text-xs text-muted-foreground mt-1">
                They may see all branches (check with admin)
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  }

  const primaryAssignment = assignments.find(a => a.isPrimary) || assignments[0]
  const additionalCount = assignments.length - 1

  if (variant === 'compact' && assignments.length === 1) {
    const assignment = assignments[0]
    const config = accessLevelConfig[assignment.accessLevel]
    const Icon = config.icon

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${className} ${config.color}`}>
              <Icon className="w-3 h-3 mr-1" />
              {assignment.branch.name}
            </Badge>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">{assignment.branch.name}</p>
                  <p className="text-xs text-muted-foreground">{assignment.branch.address}</p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-xs">Access Level: {config.label}</p>
                  {assignment.isPrimary && <p className="text-xs text-blue-600">Primary Branch</p>}
                </div>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  }

  const primaryConfig = accessLevelConfig[primaryAssignment.accessLevel]
  const PrimaryIcon = primaryConfig.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            <Badge className={primaryConfig.color}>
              <PrimaryIcon className="w-3 h-3 mr-1" />
              {primaryAssignment.branch.name}
              {primaryAssignment.isPrimary && '*'}
            </Badge>
            {additionalCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{additionalCount}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        {showTooltip && (
          <TooltipContent className="max-w-sm">
            <div className="space-y-3">
              <div>
                <p className="font-medium text-sm mb-2">Branch Assignments ({assignments.length})</p>
              </div>
              
              <div className="space-y-2">
                {assignments.map((assignment, index) => {
                  const config = accessLevelConfig[assignment.accessLevel]
                  const Icon = config.icon
                  return (
                    <div key={assignment.id} className="flex items-start gap-2 p-2 border rounded-md bg-gray-50">
                      <Icon className="w-4 h-4 mt-0.5 text-gray-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{assignment.branch.name}</p>
                          {assignment.isPrimary && (
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        {assignment.branch.address && (
                          <p className="text-xs text-muted-foreground truncate">
                            {assignment.branch.address}
                          </p>
                        )}
                        <p className="text-xs text-blue-600">{config.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground">
                  Role: {userRole?.replace('_', ' ') || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">
                  * Primary branch shown first
                </p>
              </div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

// Utility component for displaying branch access summary
export function BranchAccessSummary({
  assignments,
  userRole,
  className = ''
}: {
  assignments: BranchAssignment[]
  userRole?: string
  className?: string
}) {
  if (!assignments || assignments.length === 0) {
    return (
      <div className={`text-sm text-orange-600 ${className}`}>
        ⚠️ No branch assignments - may see all branches
      </div>
    )
  }

  const branchNames = assignments.map(a => a.branch.name).join(', ')
  const primaryBranch = assignments.find(a => a.isPrimary)?.branch.name

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      <div className="flex items-center gap-1">
        <Building2 className="w-4 h-4" />
        <span>
          Access to {assignments.length} branch{assignments.length !== 1 ? 'es' : ''}:
        </span>
      </div>
      <div className="ml-5 text-xs text-muted-foreground">
        {branchNames}
        {primaryBranch && (
          <span className="text-blue-600"> (Primary: {primaryBranch})</span>
        )}
      </div>
    </div>
  )
}
