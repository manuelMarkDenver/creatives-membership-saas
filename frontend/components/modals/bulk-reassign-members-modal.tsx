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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building,
  Users,
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react'
import { toast } from 'react-toastify'
import { branchesApi } from '@/lib/api/branches'
import { membersApi } from '@/lib/api/gym-members'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface Branch {
  id: string
  name: string
  address?: string
}

interface BulkReassignMembersModalProps {
  isOpen: boolean
  onClose: () => void
  branchToDelete: Branch | null
  members: Member[]
  availableBranches: Branch[]
  onReassignComplete: () => void
}

export function BulkReassignMembersModal({
  isOpen,
  onClose,
  branchToDelete,
  members,
  availableBranches,
  onReassignComplete
}: BulkReassignMembersModalProps) {
  const [tab, setTab] = useState<'bulk' | 'individual'>('bulk')
  const [bulkTargetBranchId, setBulkTargetBranchId] = useState('')
  const [individualAssignments, setIndividualAssignments] = useState<Record<string, string>>({})
  const [isReassigning, setIsReassigning] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isOpen && members.length > 0) {
      // Reset state
      setBulkTargetBranchId('')
      const initial: Record<string, string> = {}
      members.forEach(member => {
        initial[member.id] = ''
      })
      setIndividualAssignments(initial)
      // Default to bulk tab
      setTab('bulk')
    }
  }, [isOpen, members])

  const handleBulkReassign = async () => {
    if (!bulkTargetBranchId || !branchToDelete) {
      toast.error('Please select a destination branch')
      return
    }

    setIsReassigning(true)
    try {
      const memberIds = members.map(m => m.id)
      
      console.log('🔄 Bulk reassigning members:', {
        memberIds,
        fromBranch: branchToDelete.id,
        toBranch: bulkTargetBranchId,
        count: members.length
      })

      // Call bulk reassign API
      await branchesApi.bulkReassignUsers(branchToDelete.id, {
        userIds: memberIds,
        toBranchId: bulkTargetBranchId,
        reason: `Branch deletion: Moving from ${branchToDelete.name}`
      })

      toast.success(`Successfully reassigned ${members.length} members to ${availableBranches.find(b => b.id === bulkTargetBranchId)?.name}`)
      
      await queryClient.invalidateQueries({ queryKey: ['gym-members'] })
      await queryClient.invalidateQueries({ queryKey: ['branches'] })
      
      onReassignComplete()
      onClose()
    } catch (error: any) {
      console.error('❌ Bulk reassign error:', error)
      toast.error(error.message || 'Failed to reassign members')
    } finally {
      setIsReassigning(false)
    }
  }

  const handleIndividualReassign = async () => {
    if (!branchToDelete) return

    // Validate all members have assignments
    const unassigned = members.filter(m => !individualAssignments[m.id])
    if (unassigned.length > 0) {
      toast.error(`Please assign a branch for all ${unassigned.length} members`)
      return
    }

    setIsReassigning(true)
    try {
      console.log('🔄 Individual reassigning members:', individualAssignments)

      // Reassign each member individually using the transfer API
      for (const [memberId, targetBranchId] of Object.entries(individualAssignments)) {
        await membersApi.updateMember(memberId, {
          primaryBranchId: targetBranchId
        })
        console.log(`✅ Reassigned member ${memberId} to branch ${targetBranchId}`)
      }

      toast.success(`Successfully reassigned ${members.length} members`)
      
      await queryClient.invalidateQueries({ queryKey: ['gym-members'] })
      await queryClient.invalidateQueries({ queryKey: ['branches'] })
      
      onReassignComplete()
      onClose()
    } catch (error: any) {
      console.error('❌ Individual reassign error:', error)
      toast.error(error.message || 'Failed to reassign members')
    } finally {
      setIsReassigning(false)
    }
  }

  const handleSubmit = () => {
    if (tab === 'bulk') {
      handleBulkReassign()
    } else {
      handleIndividualReassign()
    }
  }

  if (!branchToDelete) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Cannot Delete "{branchToDelete.name}"
          </DialogTitle>
          <DialogDescription>
            {members.length} member{members.length !== 1 ? 's' : ''} {members.length !== 1 ? 'need' : 'needs'} to be reassigned before this branch can be deleted.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'bulk' | 'individual')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bulk">
              <Users className="h-4 w-4 mr-2" />
              Bulk Reassign
            </TabsTrigger>
            <TabsTrigger value="individual">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Individual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Move all {members.length} members to:
              </Label>
              <Select value={bulkTargetBranchId} onValueChange={setBulkTargetBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map((branch) => (
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
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Members to reassign:</strong>
                <ul className="mt-2 space-y-1 ml-4">
                  {members.slice(0, 5).map((member) => (
                    <li key={member.id} className="text-xs">
                      • {member.firstName} {member.lastName} ({member.role})
                    </li>
                  ))}
                  {members.length > 5 && (
                    <li className="text-xs font-medium">
                      • ... and {members.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4 mt-4">
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{member.email}</div>
                  </div>
                  <ArrowRightLeft className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="w-48 flex-shrink-0">
                    <Select 
                      value={individualAssignments[member.id] || ''} 
                      onValueChange={(value) => setIndividualAssignments(prev => ({
                        ...prev,
                        [member.id]: value
                      }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isReassigning}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isReassigning || (tab === 'bulk' && !bulkTargetBranchId)}>
            {isReassigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Reassigning...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Reassign & Delete Branch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
