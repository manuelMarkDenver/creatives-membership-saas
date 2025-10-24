'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  Building,
  ArrowRightLeft,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { membersApi } from '@/lib/api/gym-members'

interface BranchTransferModalProps {
  isOpen: boolean
  onClose: () => void
  member: any
  onTransferComplete?: () => void
}

export function BranchTransferModal({
  isOpen,
  onClose,
  member,
  onTransferComplete
}: BranchTransferModalProps) {
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()
  const { data: branches, isLoading: isLoadingBranches } = useBranchesByTenant(
    profile?.tenantId || '',
    { includeDeleted: false }
  )

  const memberName = member?.name || `${member?.firstName || ''} ${member?.lastName || ''}`.trim() || member?.email || 'Unknown Member'
  // Prioritize primaryBranch from gymMemberProfile (source of truth)
  const currentBranchName = member?.gymMemberProfile?.primaryBranch?.name || 
                           member?.gymSubscriptions?.[0]?.branch?.name || 
                           'No branch assigned'
  const currentBranchId = member?.gymMemberProfile?.primaryBranchId || 
                         member?.gymSubscriptions?.[0]?.branchId

  useEffect(() => {
    if (isOpen) {
      setSelectedBranchId('')
    }
  }, [isOpen])

  const availableBranches = branches?.filter((branch: any) => branch.id !== currentBranchId) || []

  const handleTransfer = async () => {
    if (!selectedBranchId || !member?.id) {
      toast.error('Please select a branch to transfer to')
      return
    }

    setIsTransferring(true)

    try {
      const selectedBranch = branches?.find((b: any) => b.id === selectedBranchId)
      
      console.log('🔄 Transferring member:', {
        memberId: member.id,
        memberEmail: member.email,
        fromBranch: currentBranchName,
        toBranch: selectedBranch?.name,
        toBranchId: selectedBranchId
      })
      
      // Update member's primary branch via the user API
      const response = await membersApi.updateMember(member.id, {
        primaryBranchId: selectedBranchId
      })
      
      console.log('✅ Transfer successful:', response)
      console.log('Updated member data:', response.member)

      // Force hard refetch of all member-related queries
      console.log('🔄 Force refetching all member queries...')
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['gym-members'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['users'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['gym-subscriptions'], type: 'active' })
      ])
      console.log('✅ All queries refetched')

      toast.success(`Successfully transferred ${memberName} to ${selectedBranch?.name}`)
      
      // Trigger parent component refresh with refetch
      if (onTransferComplete) {
        onTransferComplete()
      }
      
      // Wait for UI to update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onClose()
    } catch (error: any) {
      console.error('❌ Branch transfer error:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      toast.error(error.response?.data?.message || error.message || 'Failed to transfer member to new branch')
    } finally {
      setIsTransferring(false)
    }
  }

  const handleClose = () => {
    if (!isTransferring) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-500" />
            Transfer Member to Different Branch
          </DialogTitle>
          <DialogDescription>
            Transfer {memberName} to a different branch. This will update their primary branch assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Branch */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Branch</Label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{currentBranchName}</span>
              {currentBranchId && (
                <Badge variant="outline" className="text-xs">Current</Badge>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRightLeft className="h-6 w-6 text-blue-500" />
          </div>

          {/* New Branch Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transfer To Branch</Label>
            {isLoadingBranches ? (
              <div className="p-3 text-center text-gray-500">Loading branches...</div>
            ) : availableBranches.length === 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">No other branches available for transfer</span>
                </div>
              </div>
            ) : (
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{branch.name}</div>
                          {branch.address && (
                            <div className="text-xs text-gray-500">{branch.address}</div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Access Level Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Note:</strong> The member's access level is currently "{member?.gymMemberProfile?.accessLevel === 'ALL_BRANCHES' ? 'All Branches' : 
               member?.gymMemberProfile?.accessLevel === 'MULTI_BRANCH' ? 'Multiple Branches' : 
               'Single Branch'}". This transfer will only update their primary branch assignment.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isTransferring}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={!selectedBranchId || isTransferring || availableBranches.length === 0}
          >
            {isTransferring ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Transferring...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transfer Member
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}