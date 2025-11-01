'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Shield, Lock, AlertCircle, CheckCircle2, Mail, FileText, Send, Settings as SettingsIcon } from 'lucide-react'
import { useSystemSettings, useUpdatePasswordSecurityLevel } from '@/lib/hooks/use-system-settings'
import { useEmailSettings, useUpdateEmailSettings } from '@/lib/hooks/use-email'
import { EmailLogsViewer } from '@/components/admin/email-logs-viewer'
import { EmailTemplateEditor } from '@/components/admin/email-template-editor'
import type { PasswordSecurityLevel } from '@/lib/api/system-settings'

export default function SystemSettingsPage() {
  const { data: settings, isLoading } = useSystemSettings()
  const updatePasswordSecurity = useUpdatePasswordSecurityLevel()
  const [selectedLevel, setSelectedLevel] = useState<PasswordSecurityLevel>()

  // Email settings
  const { data: emailSettings, isLoading: emailLoading } = useEmailSettings()
  const updateEmailSettingsMutation = useUpdateEmailSettings()
  const [emailForm, setEmailForm] = useState({
    smtpHost: '',
    smtpPort: 1025,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    brevoApiKey: '',
    mailpitEnabled: true,
  })

  // Update selected level when data loads
  useEffect(() => {
    if (settings && !selectedLevel) {
      setSelectedLevel(settings.passwordSecurityLevel)
    }
  }, [settings, selectedLevel])

  // Update email form when data loads
  useEffect(() => {
    if (emailSettings) {
      setEmailForm({
        smtpHost: emailSettings.smtpHost || '',
        smtpPort: emailSettings.smtpPort || 1025,
        smtpUser: emailSettings.smtpUser || '',
        smtpPassword: emailSettings.smtpPassword || '',
        fromEmail: emailSettings.fromEmail || '',
        fromName: emailSettings.fromName || '',
        brevoApiKey: emailSettings.brevoApiKey || '',
        mailpitEnabled: emailSettings.mailpitEnabled ?? true,
      })
    }
  }, [emailSettings])

  const handleSavePasswordSecurity = () => {
    if (selectedLevel) {
      updatePasswordSecurity.mutate(selectedLevel)
    }
  }

  const handleSaveEmailSettings = () => {
    updateEmailSettingsMutation.mutate(emailForm)
  }

  const hasPasswordChanges = selectedLevel && settings && selectedLevel !== settings.passwordSecurityLevel

  const hasEmailChanges = emailSettings && (
    emailForm.smtpHost !== (emailSettings.smtpHost || '') ||
    emailForm.smtpPort !== (emailSettings.smtpPort || 1025) ||
    emailForm.smtpUser !== (emailSettings.smtpUser || '') ||
    emailForm.smtpPassword !== (emailSettings.smtpPassword || '') ||
    emailForm.fromEmail !== (emailSettings.fromEmail || '') ||
    emailForm.fromName !== (emailSettings.fromName || '') ||
    emailForm.brevoApiKey !== (emailSettings.brevoApiKey || '') ||
    emailForm.mailpitEnabled !== (emailSettings.mailpitEnabled ?? true)
  )

  const securityLevels: Array<{
    value: PasswordSecurityLevel
    label: string
    description: string
    requirements: string[]
    icon: any
    color: string
  }> = [
    {
      value: 'LOW',
      label: 'Low Security',
      description: 'Basic password requirements - suitable for internal testing',
      requirements: ['At least 6 characters', 'Lowercase letters'],
      icon: AlertCircle,
      color: 'text-yellow-600 dark:text-yellow-500',
    },
    {
      value: 'MEDIUM',
      label: 'Medium Security',
      description: 'Balanced security - recommended for most organizations',
      requirements: [
        'At least 8 characters',
        'Uppercase letters',
        'Lowercase letters',
        'Numbers',
      ],
      icon: Shield,
      color: 'text-blue-600 dark:text-blue-500',
    },
    {
      value: 'HIGH',
      label: 'High Security',
      description: 'Maximum security - best for sensitive environments',
      requirements: [
        'At least 8 characters',
        'Uppercase letters',
        'Lowercase letters',
        'Numbers',
        'Special characters (!@#$%^&*)',
      ],
      icon: Lock,
      color: 'text-green-600 dark:text-green-500',
    },
  ]

  if (isLoading || emailLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          System Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure platform-wide settings that affect all tenants
        </p>
      </div>

      {/* Password Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Security Level
          </CardTitle>
          <CardDescription>
            Set the password strength requirements for <strong>new accounts only</strong>.
            Existing user passwords will not be affected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li>This setting only applies to <strong>new account creation</strong></li>
                  <li>Existing users can keep their current passwords</li>
                  <li>Changes take effect immediately for new signups</li>
                </ul>
              </div>
            </div>
          </div>

          <RadioGroup
            value={selectedLevel}
            onValueChange={(value) => setSelectedLevel(value as PasswordSecurityLevel)}
            className="space-y-4"
          >
            {securityLevels.map((level) => {
              const Icon = level.icon
              const isSelected = selectedLevel === level.value
              const isCurrent = settings?.passwordSecurityLevel === level.value

              return (
                <div
                  key={level.value}
                  className={`relative flex items-start space-x-4 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedLevel(level.value)}
                >
                  <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={level.value} className="cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-5 w-5 ${level.color}`} />
                        <span className="font-semibold text-lg">{level.label}</span>
                        {isCurrent && (
                          <span className="ml-auto flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{level.description}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-foreground">Requirements:</p>
                        {level.requirements.map((req, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            {req}
                          </div>
                        ))}
                      </div>
                    </Label>
                  </div>
                </div>
              )
            })}
          </RadioGroup>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {hasPasswordChanges && (
              <p className="text-sm text-muted-foreground mr-auto">
                You have unsaved changes
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => setSelectedLevel(settings?.passwordSecurityLevel)}
              disabled={!hasPasswordChanges || updatePasswordSecurity.isPending}
            >
              Reset
            </Button>
            <Button
              onClick={handleSavePasswordSecurity}
              disabled={!hasPasswordChanges || updatePasswordSecurity.isPending}
            >
              {updatePasswordSecurity.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            Configure email providers and settings for system notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={emailForm.smtpHost}
                onChange={(e) => setEmailForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                placeholder="localhost"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={emailForm.smtpPort}
                onChange={(e) => setEmailForm(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 1025 }))}
                placeholder="1025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username (Optional)</Label>
              <Input
                id="smtpUser"
                value={emailForm.smtpUser}
                onChange={(e) => setEmailForm(prev => ({ ...prev, smtpUser: e.target.value }))}
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password (Optional)</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={emailForm.smtpPassword}
                onChange={(e) => setEmailForm(prev => ({ ...prev, smtpPassword: e.target.value }))}
                placeholder="password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                value={emailForm.fromEmail}
                onChange={(e) => setEmailForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                placeholder="noreply@gymbosslab.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={emailForm.fromName}
                onChange={(e) => setEmailForm(prev => ({ ...prev, fromName: e.target.value }))}
                placeholder="GymBossLab"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brevoApiKey">Brevo API Key (Optional)</Label>
            <Input
              id="brevoApiKey"
              value={emailForm.brevoApiKey}
              onChange={(e) => setEmailForm(prev => ({ ...prev, brevoApiKey: e.target.value }))}
              placeholder="xkeysib-..."
            />
            <p className="text-xs text-muted-foreground">
              For production email delivery. Leave empty to use SMTP/Mailpit.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="mailpitEnabled"
              checked={emailForm.mailpitEnabled}
              onChange={(e) => setEmailForm(prev => ({ ...prev, mailpitEnabled: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="mailpitEnabled" className="text-sm">
              Enable Mailpit for development (port 8025)
            </Label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {hasEmailChanges && (
              <p className="text-sm text-muted-foreground mr-auto">
                You have unsaved changes
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (emailSettings) {
                  setEmailForm({
                    smtpHost: emailSettings.smtpHost || '',
                    smtpPort: emailSettings.smtpPort || 1025,
                    smtpUser: emailSettings.smtpUser || '',
                    smtpPassword: emailSettings.smtpPassword || '',
                    fromEmail: emailSettings.fromEmail || '',
                    fromName: emailSettings.fromName || '',
                    brevoApiKey: emailSettings.brevoApiKey || '',
                    mailpitEnabled: emailSettings.mailpitEnabled ?? true,
                  })
                }
              }}
              disabled={!hasEmailChanges || updateEmailSettingsMutation.isPending}
            >
              Reset
            </Button>
            <Button
              onClick={handleSaveEmailSettings}
              disabled={!hasEmailChanges || updateEmailSettingsMutation.isPending}
            >
              {updateEmailSettingsMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

       {/* Email Templates */}
       <EmailTemplateEditor />

       {/* Email Logs */}
       <EmailLogsViewer />

       {/* Future settings placeholder */}
      <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
        <p className="text-sm">More system settings coming soon...</p>
        <p className="text-xs mt-1">Email templates, notification settings, etc.</p>
      </div>
    </div>
  )
}