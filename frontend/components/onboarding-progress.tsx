'use client'

import { Check, Lock, Shield, Building2, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  completed: boolean
  current: boolean
}

interface OnboardingProgressProps {
  steps: OnboardingStep[]
  className?: string
}

export default function OnboardingProgress({ steps, className }: OnboardingProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Setup Progress</h3>
          <p className="text-sm text-gray-500 mt-1">
            Complete these steps to get started with your account
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === steps.length - 1

            return (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-6 top-12 w-0.5 h-8',
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}

                {/* Step Item */}
                <div
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg transition-all',
                    step.current && 'bg-blue-50 border border-blue-200',
                    step.completed && 'bg-gray-50'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all',
                      step.completed && 'bg-green-500',
                      step.current && !step.completed && 'bg-blue-500 animate-pulse',
                      !step.completed && !step.current && 'bg-gray-200'
                    )}
                  >
                    {step.completed ? (
                      <Check className="h-6 w-6 text-white" />
                    ) : (
                      <Icon
                        className={cn(
                          'h-6 w-6',
                          step.current ? 'text-white' : 'text-gray-400'
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={cn(
                          'font-semibold text-base',
                          step.completed && 'text-gray-700',
                          step.current && 'text-blue-700',
                          !step.completed && !step.current && 'text-gray-500'
                        )}
                      >
                        {step.title}
                      </h4>
                      {step.completed && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Complete
                        </span>
                      )}
                      {step.current && !step.completed && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        'text-sm mt-1',
                        step.current ? 'text-gray-700' : 'text-gray-500'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-semibold text-blue-600">
              {steps.filter(s => s.completed).length} / {steps.length} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper to create step configuration
export function createOnboardingSteps(status: {
  hasChangedPassword: boolean
  hasMembershipPlans: boolean
  hasMembers: boolean
  isOnboardingComplete: boolean
}): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    {
      id: 'password',
      title: 'Set Your Password',
      description: 'Secure your account with a strong password',
      icon: Shield,
      completed: status.hasChangedPassword,
      current: !status.hasChangedPassword,
    },
    {
      id: 'branch',
      title: 'Customize Your Branch',
      description: 'Add details about your location',
      icon: Building2,
      completed: status.hasChangedPassword, // Branch is customized after password
      current: status.hasChangedPassword && !status.hasMembershipPlans,
    },
    {
      id: 'plans',
      title: 'Create Membership Plans',
      description: 'Set up pricing and membership options',
      icon: CreditCard,
      completed: status.hasMembershipPlans,
      current: status.hasChangedPassword && !status.hasMembershipPlans,
    },
  ]

  return steps
}
