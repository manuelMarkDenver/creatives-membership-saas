'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Shield, Lock, AlertCircle, CheckCircle2, Mail, Settings as SettingsIcon, RotateCcw } from 'lucide-react'
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
  const [emailConfig, setEmailConfig] = useState<'development' | 'production' | 'custom'>('development')
  const [editMode, setEditMode] = useState(false)
  const [emailForm, setEmailForm] = useState({
    smtpHost: '',
    smtpPort: 1025,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    mailpitEnabled: true,
  })

  // Preset configurations
  const emailPresets = {
    development: {
      smtpHost: 'localhost',
      smtpPort: 1025,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@gymbosslab.com',
      fromName: 'GymBossLab',
      mailpitEnabled: true,
    },
    production: {
      smtpHost: 'smtp-relay.brevo.com',
      smtpPort: 587,
      smtpUser: 'your-email@gymbosslab.com',
      smtpPassword: '',
      fromEmail: 'noreply@gymbosslab.com',
      fromName: 'GymBossLab',
      mailpitEnabled: false,
    },
  }

  // Update selected level when data loads
  useEffect(() => {
    if (settings && !selectedLevel) {
      setSelectedLevel(settings.passwordSecurityLevel)
    }
  }, [settings, selectedLevel])

  // Update email form when data loads
  useEffect(() => {
    if (emailSettings) {
      const currentSettings = {
        smtpHost: emailSettings.smtpHost || '',
        smtpPort: emailSettings.smtpPort || 1025,
        smtpUser: emailSettings.smtpUser || '',
        smtpPassword: emailSettings.smtpPassword || '',
        fromEmail: emailSettings.fromEmail || '',
        fromName: emailSettings.fromName || '',
        mailpitEnabled: emailSettings.mailpitEnabled ?? true,
      }

      // Determine if current settings match a preset
      const isDevelopment = JSON.stringify(currentSettings) === JSON.stringify(emailPresets.development)
      const isProduction = emailSettings.brevoApiKey && !emailSettings.mailpitEnabled

      if (isDevelopment) {
        setEmailConfig('development')
        setEditMode(false)
      } else if (isProduction) {
        setEmailConfig('production')
        setEditMode(false)
      } else {
        setEmailConfig('custom')
        setEditMode(true)
      }

      setEmailForm(currentSettings)
    }
  }, [emailSettings])

  const handleSavePasswordSecurity = () => {
    if (selectedLevel) {
      updatePasswordSecurity.mutate(selectedLevel)
    }
  }

  // Handle email configuration change
  const handleEmailConfigChange = (config: 'development' | 'production' | 'custom') => {
    setEmailConfig(config)
    if (config === 'development') {
      setEmailForm(emailPresets.development)
      setEditMode(false)
    } else if (config === 'production') {
      setEmailForm(emailPresets.production)
      setEditMode(false)
    } else {
      setEditMode(true)
    }
  }

  // Handle restore to default
  const handleRestoreDefault = () => {
    if (emailConfig === 'development') {
      setEmailForm(emailPresets.development)
    } else if (emailConfig === 'production') {
      setEmailForm(emailPresets.production)
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
          {/* Configuration Type Selector */}
          <div className="space-y-2">
            <Label>Email Configuration</Label>
            <Select value={emailConfig} onValueChange={handleEmailConfigChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">
                  🧪 Development (Mailpit) - Local testing
                </SelectItem>
                <SelectItem value="production">
                  🚀 Production (Brevo) - Live email delivery
                </SelectItem>
                <SelectItem value="custom">
                  ⚙️ Custom Configuration - Advanced settings
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {emailConfig === 'development' && 'Uses Mailpit for local email testing. View emails at http://localhost:8025'}
              {emailConfig === 'production' && 'Uses Brevo for reliable production email delivery'}
              {emailConfig === 'custom' && 'Configure custom SMTP or email provider settings'}
            </p>
          </div>

          {/* Edit Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-mode"
                checked={editMode}
                onCheckedChange={setEditMode}
              />
              <Label htmlFor="edit-mode" className="text-sm">
                Edit configuration manually
              </Label>
            </div>
            {emailConfig !== 'custom' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestoreDefault}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restore Default
              </Button>
            )}
          </div>

          {/* Configuration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={emailForm.smtpHost}
                onChange={(e) => setEmailForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                disabled={!editMode}
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
                disabled={!editMode}
                placeholder="1025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={emailForm.smtpUser}
                onChange={(e) => setEmailForm(prev => ({ ...prev, smtpUser: e.target.value }))}
                disabled={!editMode}
                placeholder="username (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={emailForm.smtpPassword}
                onChange={(e) => setEmailForm(prev => ({ ...prev, smtpPassword: e.target.value }))}
                disabled={!editMode}
                placeholder="password (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                value={emailForm.fromEmail}
                onChange={(e) => setEmailForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                disabled={!editMode}
                placeholder="noreply@gymbosslab.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={emailForm.fromName}
                onChange={(e) => setEmailForm(prev => ({ ...prev, fromName: e.target.value }))}
                disabled={!editMode}
                placeholder="GymBossLab"
              />
            </div>
          </div>



          {/* Status Indicator */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Current Configuration:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li><strong>Provider:</strong> {emailConfig === 'development' ? 'Mailpit (Development)' : emailConfig === 'production' ? 'Brevo (Production)' : 'Custom SMTP'}</li>
                  <li><strong>Host:</strong> {emailForm.smtpHost}:{emailForm.smtpPort}</li>
                  <li><strong>From:</strong> {emailForm.fromName} &lt;{emailForm.fromEmail}&gt;</li>
                  <li><strong>Environment:</strong> API keys configured via environment variables</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
                  const currentSettings = {
                    smtpHost: emailSettings.smtpHost || '',
                    smtpPort: emailSettings.smtpPort || 1025,
                    smtpUser: emailSettings.smtpUser || '',
                    smtpPassword: emailSettings.smtpPassword || '',
                    fromEmail: emailSettings.fromEmail || '',
                    fromName: emailSettings.fromName || '',
                    brevoApiKey: emailSettings.brevoApiKey || '',
                    mailpitEnabled: emailSettings.mailpitEnabled ?? true,
                  }
                  setEmailForm(currentSettings)
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