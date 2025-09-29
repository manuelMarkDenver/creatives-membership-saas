'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  AlertTriangle, 
  Key, 
  CreditCard, 
  Users, 
  ArrowRight,
  Clock,
  Shield
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FirstTimeSetupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  hasPlans: boolean
  hasMembers: boolean
  isPasswordTemporary?: boolean
}

interface SetupStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  completed: boolean
  urgent: boolean
  action: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function FirstTimeSetupModal({
  open,
  onOpenChange,
  userName,
  hasPlans,
  hasMembers,
  isPasswordTemporary = true
}: FirstTimeSetupModalProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const steps: SetupStep[] = [
    {
      id: 'password',
      title: 'Change Your Temporary Password',
      description: 'Your account was created with a temporary password. Please change it to something secure and memorable.',
      icon: Key,
      completed: !isPasswordTemporary,
      urgent: true,
      action: {
        label: 'Change Password',
        onClick: () => {
          // This will be handled by the parent component
          // We'll emit an event or use a callback
          window.dispatchEvent(new CustomEvent('openPasswordChange'))
        }
      }
    },
    {
      id: 'plans',
      title: 'Create Membership Plans',
      description: 'Set up your gym membership plans with pricing and benefits before adding members.',
      icon: CreditCard,
      completed: hasPlans,
      urgent: false,
      action: {
        label: 'Create Plans',
        href: '/membership-plans'
      }
    },
    {
      id: 'members',
      title: 'Add Your First Members',
      description: 'Once you have membership plans, you can start adding members to your gym.',
      icon: Users,
      completed: hasMembers,
      urgent: false,
      action: {
        label: 'Add Members',
        href: '/members'
      }
    }
  ]

  const completedSteps = steps.filter(step => step.completed).length
  const urgentSteps = steps.filter(step => step.urgent && !step.completed)
  const nextStep = steps.find(step => !step.completed)

  const handleStepAction = (step: SetupStep) => {
    if (step.action.onClick) {
      step.action.onClick()
    } else if (step.action.href) {
      onOpenChange(false)
      router.push(step.action.href)
    }
  }

  const handleRemindLater = () => {
    // Set a reminder for next login (localStorage)
    localStorage.setItem('first-time-setup-remind-later', new Date().toISOString())
    onOpenChange(false)
  }

  const handleSkipSetup = () => {
    // Mark as completed in localStorage (won't show again)
    localStorage.setItem('first-time-setup-completed', 'true')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Shield className="h-5 w-5" />
            Welcome to Your Gym, {userName}! 
          </DialogTitle>
          <DialogDescription>
            Let's get your gym management system set up properly. Here's your setup checklist:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress Overview */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Setup Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {completedSteps}/{steps.length}
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {completedSteps === steps.length 
                  ? "🎉 All setup steps completed!" 
                  : `${steps.length - completedSteps} steps remaining`
                }
              </p>
            </CardContent>
          </Card>

          {/* Urgent Items */}
          {urgentSteps.length > 0 && (
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  Urgent Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                  These items need immediate attention for security and functionality:
                </p>
                {urgentSteps.map(step => (
                  <div key={step.id} className="flex items-center justify-between text-sm">
                    <span className="text-amber-800 dark:text-amber-200">{step.title}</span>
                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Setup Steps */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Setup Steps</h3>
            {steps.map((step, index) => (
              <Card 
                key={step.id} 
                className={`transition-all ${
                  step.completed 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                    : step.urgent 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      step.completed 
                        ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300' 
                        : step.urgent 
                          ? 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300' 
                          : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium">
                          {step.title}
                        </h4>
                        {step.completed && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            ✓ Done
                          </Badge>
                        )}
                        {step.urgent && !step.completed && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {step.description}
                      </p>
                      
                      {!step.completed && (
                        <Button
                          size="sm"
                          variant={step.urgent ? "destructive" : "default"}
                          onClick={() => handleStepAction(step)}
                          className="text-xs h-7"
                        >
                          {step.action.label}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleRemindLater}
            className="flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Remind Later
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSkipSetup}
            className="text-gray-500"
          >
            Skip Setup
          </Button>
          <Button 
            onClick={() => nextStep && handleStepAction(nextStep)}
            disabled={!nextStep}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {nextStep ? `${nextStep.action.label}` : 'All Done!'}
            {nextStep && <ArrowRight className="ml-1 h-3 w-3" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}