'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CreditCard, 
  Users, 
  ArrowRight,
  AlertTriangle,
  Plus,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MembershipPlansRequiredModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantName?: string
}

export function MembershipPlansRequiredModal({
  open,
  onOpenChange,
  tenantName = 'your gym'
}: MembershipPlansRequiredModalProps) {
  const router = useRouter()

  const handleCreatePlans = () => {
    onOpenChange(false)
    router.push('/membership-plans')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Membership Plans Required
          </DialogTitle>
          <DialogDescription>
            You need to create membership plans before you can add members to {tenantName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Card */}
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Can't Add Members Yet
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Members need a membership plan to join your gym. Create at least one plan to get started.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                What you need to do
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300 flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Create Membership Plans</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Set up pricing, duration, and benefits for your gym memberships
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-300 flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Add Members</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Once you have plans, you can start adding members and assign them to plans
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Plans */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-800 dark:text-blue-200">
                💡 Example Membership Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                <div className="flex justify-between">
                  <span>• Monthly Basic</span>
                  <span className="font-medium">₱1,500/month</span>
                </div>
                <div className="flex justify-between">
                  <span>• Quarterly Premium</span>
                  <span className="font-medium">₱4,000/3 months</span>
                </div>
                <div className="flex justify-between">
                  <span>• Annual VIP</span>
                  <span className="font-medium">₱15,000/year</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handleCreatePlans}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Create Plans Now
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}