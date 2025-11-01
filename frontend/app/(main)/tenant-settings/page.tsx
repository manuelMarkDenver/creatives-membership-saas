'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Mail, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react'
import { useTenantSettings, useUpdateTenantAdminEmails } from '@/lib/hooks/use-tenant-settings'

export default function TenantSettingsPage() {
  const { data: settings, isLoading } = useTenantSettings()
  const updateAdminEmailsMutation = useUpdateTenantAdminEmails()

  const [adminEmails, setAdminEmails] = useState<string[]>([])
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)

  // Update form when data loads
  useEffect(() => {
    if (settings) {
      setAdminEmails(settings.adminEmailRecipients || [])
      setEmailNotificationsEnabled(settings.emailNotificationsEnabled ?? true)
    }
  }, [settings])

  const handleSaveAdminEmails = () => {
    if (!hasAdminEmailChanges) return

    updateAdminEmailsMutation.mutate({
      adminEmailRecipients: adminEmails,
      emailNotificationsEnabled,
    })
  }

  const hasAdminEmailChanges = settings && (
    JSON.stringify(adminEmails) !== JSON.stringify(settings.adminEmailRecipients || []) ||
    emailNotificationsEnabled !== (settings.emailNotificationsEnabled ?? true)
  )

  if (isLoading) {
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
          Tenant Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure settings for your gym business
        </p>
      </div>

      {/* Admin Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin Email Notifications
          </CardTitle>
          <CardDescription>
            Configure email addresses that will receive notifications about your gym
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="adminEmails">Admin Email Recipients</Label>
            <Input
              id="adminEmails"
              value={adminEmails.join(', ')}
              onChange={(e) => setAdminEmails(
                e.target.value.split(',').map(email => email.trim()).filter(email => email)
              )}
              placeholder="owner@gym.com, manager@gym.com"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of email addresses that will receive gym notifications
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="emailNotifications"
              checked={emailNotificationsEnabled}
              onCheckedChange={setEmailNotificationsEnabled}
            />
            <Label htmlFor="emailNotifications" className="text-sm">
              Enable email notifications for new member signups
            </Label>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Current Configuration:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li><strong>Recipients:</strong> {adminEmails.length > 0 ? adminEmails.join(', ') : 'None configured'}</li>
                  <li><strong>Notifications:</strong> {emailNotificationsEnabled ? 'Enabled' : 'Disabled'}</li>
                  <li><strong>Events:</strong> New member signups, subscription changes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {hasAdminEmailChanges && (
              <p className="text-sm text-muted-foreground mr-auto">
                You have unsaved changes
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (settings) {
                  setAdminEmails(settings.adminEmailRecipients || [])
                  setEmailNotificationsEnabled(settings.emailNotificationsEnabled ?? true)
                }
              }}
              disabled={!hasAdminEmailChanges || updateAdminEmailsMutation.isPending}
            >
              Reset
            </Button>
            <Button
              onClick={handleSaveAdminEmails}
              disabled={!hasAdminEmailChanges || updateAdminEmailsMutation.isPending}
            >
              {updateAdminEmailsMutation.isPending ? (
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

      {/* Future settings placeholder */}
      <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
        <p className="text-sm">More tenant settings coming soon...</p>
        <p className="text-xs mt-1">Business hours, contact information, branding, etc.</p>
      </div>
    </div>
  )
}