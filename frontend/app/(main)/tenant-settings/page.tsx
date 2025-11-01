'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Mail, Settings as SettingsIcon, CheckCircle2, Crown, X } from 'lucide-react'
import { useTenantSettings, useUpdateTenantAdminEmails, useUpdateTenantSettings } from '@/lib/hooks/use-tenant-settings'
import { useAuthValidation } from '@/lib/hooks/use-auth-validation'

export default function TenantSettingsPage() {
  const { data: settings, isLoading } = useTenantSettings()
  const updateAdminEmailsMutation = useUpdateTenantAdminEmails()
  const updateTenantSettingsMutation = useUpdateTenantSettings()
  const { user } = useAuthValidation()

  const [adminEmails, setAdminEmails] = useState<string[]>([])
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [welcomeEmailEnabled, setWelcomeEmailEnabled] = useState(true)
  const [tenantSignupNotificationEnabled, setTenantSignupNotificationEnabled] = useState(true)
  const [newEmail, setNewEmail] = useState('')

  // Owner's email is always included and cannot be removed
  const ownerEmail = user?.email || ''
  const additionalEmails = adminEmails.filter(email => email !== ownerEmail)

  // Update form when data loads
  useEffect(() => {
    if (settings) {
      // Ensure owner's email is always included
      const recipients = settings.adminEmailRecipients || []
      if (ownerEmail && !recipients.includes(ownerEmail)) {
        recipients.unshift(ownerEmail) // Add owner's email first
      }
      setAdminEmails(recipients)
      setEmailNotificationsEnabled(settings.emailNotificationsEnabled ?? true)
      setTenantSignupNotificationEnabled(settings.tenantSignupNotificationEnabled ?? true)
      setWelcomeEmailEnabled(settings.welcomeEmailEnabled ?? true)
    }
  }, [settings, ownerEmail])

  const handleSaveSettings = () => {
    if (!hasAnyChanges) return

    // Always include owner's email
    const emailsToSave = [...additionalEmails]
    if (ownerEmail && !emailsToSave.includes(ownerEmail)) {
      emailsToSave.unshift(ownerEmail)
    }

    updateAdminEmailsMutation.mutate({
      adminEmailRecipients: emailsToSave,
      emailNotificationsEnabled,
    })

    if (hasTenantSignupNotificationChanges) {
      updateTenantSettingsMutation.mutate({
        tenantSignupNotificationEnabled,
      })
    }
  }

  const handleSaveWelcomeEmail = () => {
    if (!hasWelcomeEmailChanges) return

    updateTenantSettingsMutation.mutate({
      welcomeEmailEnabled,
    })
  }

  const addEmail = () => {
    if (newEmail.trim() && !adminEmails.includes(newEmail.trim())) {
      setAdminEmails([...adminEmails, newEmail.trim()])
      setNewEmail('')
    }
  }

  const removeEmail = (emailToRemove: string) => {
    if (emailToRemove === ownerEmail) return // Cannot remove owner's email
    setAdminEmails(adminEmails.filter(email => email !== emailToRemove))
  }

  const hasAdminEmailChanges = settings && (
    JSON.stringify(adminEmails) !== JSON.stringify(settings.adminEmailRecipients || []) ||
    emailNotificationsEnabled !== (settings.emailNotificationsEnabled ?? true)
  )

  const hasTenantSignupNotificationChanges = settings && (
    tenantSignupNotificationEnabled !== (settings.tenantSignupNotificationEnabled ?? true)
  )

  const hasWelcomeEmailChanges = settings && (
    welcomeEmailEnabled !== (settings.welcomeEmailEnabled ?? true)
  )

  const hasAnyChanges = hasAdminEmailChanges || hasWelcomeEmailChanges || hasTenantSignupNotificationChanges

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
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Admin Email Recipients</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Email addresses that will receive notifications about new member signups and gym activities
              </p>

              {/* Owner's email - always included and cannot be removed */}
              {ownerEmail && (
                <div className="mb-3">
                  <Label className="text-xs text-muted-foreground mb-2 block">Owner (Default)</Label>
                  <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                    <Crown className="h-3 w-3" />
                    {ownerEmail}
                    <span className="text-xs opacity-70">(cannot be removed)</span>
                  </Badge>
                </div>
              )}

              {/* Additional admin emails */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Additional Recipients</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="manager@gym.com"
                    onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmail}
                    disabled={!newEmail.trim() || adminEmails.includes(newEmail.trim())}
                  >
                    Add
                  </Button>
                </div>

                {/* Display additional emails */}
                {additionalEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {additionalEmails.map((email) => (
                      <Badge key={email} variant="outline" className="flex items-center gap-2">
                        {email}
                        <button
                          onClick={() => removeEmail(email)}
                          className="hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {additionalEmails.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No additional recipients added</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="tenantSignupNotifications"
              checked={tenantSignupNotificationEnabled}
              onCheckedChange={setTenantSignupNotificationEnabled}
            />
            <Label htmlFor="tenantSignupNotifications" className="text-sm">
              Enable email notifications for new member signups
            </Label>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Current Configuration:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li><strong>Owner:</strong> {ownerEmail || 'Not available'}</li>
                   <li><strong>Additional Recipients:</strong> {additionalEmails.length > 0 ? additionalEmails.join(', ') : 'None'}</li>
                   <li><strong>Total Recipients:</strong> {adminEmails.length}</li>
                   <li><strong>Signup Notifications:</strong> {tenantSignupNotificationEnabled ? 'Enabled' : 'Disabled'}</li>
                   <li><strong>Events:</strong> New member signups</li>
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
                  // Reset to original settings, ensuring owner's email is included
                  const recipients = settings.adminEmailRecipients || []
                  if (ownerEmail && !recipients.includes(ownerEmail)) {
                    recipients.unshift(ownerEmail)
                  }
                   setAdminEmails(recipients)
                   setEmailNotificationsEnabled(settings.emailNotificationsEnabled ?? true)
                   setTenantSignupNotificationEnabled(settings.tenantSignupNotificationEnabled ?? true)
                   setNewEmail('')
                }
              }}
              disabled={!hasAdminEmailChanges || updateAdminEmailsMutation.isPending}
            >
              Reset
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={!hasAnyChanges || updateAdminEmailsMutation.isPending || updateTenantSettingsMutation.isPending}
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

       {/* Welcome Email Settings */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Mail className="h-5 w-5" />
             Welcome Email Settings
           </CardTitle>
           <CardDescription>
             Configure automatic welcome emails for new gym members
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="space-y-4">
             <div>
               <Label className="text-sm font-medium">Welcome Email Toggle</Label>
               <p className="text-xs text-muted-foreground mb-3">
                 Control whether welcome emails are sent automatically when adding new members
               </p>

               <div className="flex items-center space-x-2">
                 <Switch
                   id="welcomeEmailEnabled"
                   checked={welcomeEmailEnabled}
                   onCheckedChange={setWelcomeEmailEnabled}
                 />
                 <Label htmlFor="welcomeEmailEnabled" className="text-sm">
                   Send welcome emails to new members by default
                 </Label>
               </div>
             </div>
           </div>

           <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
             <div className="flex items-start gap-3">
               <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
               <div className="text-sm text-green-900 dark:text-green-100">
                 <p className="font-medium mb-1">Welcome Email Behavior:</p>
                 <ul className="list-disc list-inside space-y-1 text-green-800 dark:text-green-200">
                   <li><strong>Status:</strong> {welcomeEmailEnabled ? 'Enabled' : 'Disabled'}</li>
                   <li><strong>Default for new members:</strong> {welcomeEmailEnabled ? 'Welcome email will be sent' : 'Welcome email will not be sent'}</li>
                   <li><strong>Per-member override:</strong> Available in add member modal</li>
                   <li><strong>Email template:</strong> Customizable welcome message with member details</li>
                 </ul>
               </div>
             </div>
           </div>

           <div className="flex items-center justify-end gap-3 pt-4 border-t">
             {hasWelcomeEmailChanges && (
               <p className="text-sm text-muted-foreground mr-auto">
                 You have unsaved changes
               </p>
             )}
             <Button
               variant="outline"
               onClick={() => {
                 if (settings) {
                   setWelcomeEmailEnabled(settings.welcomeEmailEnabled ?? true)
                 }
               }}
               disabled={!hasWelcomeEmailChanges || updateTenantSettingsMutation.isPending}
             >
               Reset
             </Button>
             <Button
               onClick={handleSaveWelcomeEmail}
               disabled={!hasWelcomeEmailChanges || updateTenantSettingsMutation.isPending}
             >
               {updateTenantSettingsMutation.isPending ? (
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