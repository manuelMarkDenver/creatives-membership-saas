import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Edit, Plus, Eye, Save, X, AlertCircle, Bold, Italic, Underline, List, ListOrdered } from 'lucide-react'


import { useEmailTemplates, useCreateEmailTemplate, useUpdateEmailTemplate, useDeleteEmailTemplate } from '@/lib/hooks/use-email'
import type { EmailTemplate } from '@/lib/api/email'

const TEMPLATE_TYPES = [
  { value: 'welcome', label: 'Welcome Email', description: 'Sent when a new member joins' },
  { value: 'admin_alert', label: 'Admin Alert', description: 'Sent to admins when new tenant registers' },
  { value: 'tenant_notification', label: 'Tenant Notification', description: 'Sent to tenant owners for member updates' },
]

const VARIABLE_SUGGESTIONS = [
  { variable: '{{memberName}}', description: 'Member\'s full name' },
  { variable: '{{memberEmail}}', description: 'Member\'s email address' },
  { variable: '{{tenantName}}', description: 'Tenant/organization name' },
  { variable: '{{membershipPlanName}}', description: 'Membership plan name' },
  { variable: '{{ownerEmail}}', description: 'Tenant owner email' },
  { variable: '{{ownerName}}', description: 'Tenant owner name' },
]

// Helper functions for HTML formatting
const insertHtmlTag = (tag: string, content: string): string => {
  switch (tag) {
    case 'bold':
      return `<strong>${content}</strong>`
    case 'italic':
      return `<em>${content}</em>`
    case 'underline':
      return `<u>${content}</u>`
    case 'h1':
      return `<h1>${content}</h1>`
    case 'h2':
      return `<h2>${content}</h2>`
    case 'h3':
      return `<h3>${content}</h3>`
    case 'ul':
      return `<ul><li>${content}</li></ul>`
    case 'ol':
      return `<ol><li>${content}</li></ol>`
    default:
      return content
  }
}

// Helper functions for default content
const getDefaultSubject = (templateType: string): string => {
  switch (templateType) {
    case 'welcome':
      return 'Welcome to {{tenantName}}!'
    case 'admin_alert':
      return 'New Member Registration - {{tenantName}}'
    case 'tenant_notification':
      return 'New Member Joined Your Gym'
    default:
      return 'Email from {{tenantName}}'
  }
}

const getDefaultContent = (templateType: string): string => {
  switch (templateType) {
    case 'welcome':
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 32px; margin: 0;">{{tenantName}}</h1>
  </div>

  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px;">
    <h2 style="color: #1f2937; margin-top: 0;">Welcome to {{tenantName}}! 🎉</h2>

    <p>Hi {{memberName}},</p>

    <p>We're excited to have you join our fitness community! Your membership is now active and you can start your fitness journey right away.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #374151;">Your Membership Details:</h3>
      <p><strong>Name:</strong> {{memberName}}</p>
      <p><strong>Email:</strong> {{memberEmail}}</p>
      <p><strong>Plan:</strong> {{membershipPlanName}}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Get Started</a>
    </div>

    <p>If you have any questions, feel free to reach out to us. We're here to help you achieve your fitness goals!</p>

    <p>Best regards,<br>The {{tenantName}} Team</p>
  </div>

  <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
    <p>This email was sent to {{memberEmail}}</p>
  </div>
</div>`
    case 'admin_alert':
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px;">
    <h2 style="color: #1f2937; margin-top: 0;">New Member Registration 🔔</h2>

    <p>A new member has registered for {{tenantName}}.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #374151;">Member Details:</h3>
      <p><strong>Name:</strong> {{memberName}}</p>
      <p><strong>Email:</strong> {{memberEmail}}</p>
      <p><strong>Plan:</strong> {{membershipPlanName}}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View in Dashboard</a>
    </div>
  </div>
</div>`
    case 'tenant_notification':
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px;">
    <h2 style="color: #1f2937; margin-top: 0;">New Member Joined! 🎉</h2>

    <p>Great news! A new member has joined {{tenantName}}.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #374151;">Member Details:</h3>
      <p><strong>Name:</strong> {{memberName}}</p>
      <p><strong>Email:</strong> {{memberEmail}}</p>
      <p><strong>Plan:</strong> {{membershipPlanName}}</p>
    </div>

    <p>Welcome your new member and help them get started on their fitness journey!</p>
  </div>
</div>`
    default:
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px;">
    <h2 style="color: #1f2937; margin-top: 0;">Message from {{tenantName}}</h2>
    <p>Hi {{memberName}},</p>
    <p>Your message content here.</p>
  </div>
</div>`
  }
}

interface EmailTemplateEditorProps {
  tenantId?: string
}

export function EmailTemplateEditor({ tenantId }: EmailTemplateEditorProps) {
  const { data: templates, isLoading } = useEmailTemplates(tenantId)
  const createTemplate = useCreateEmailTemplate()
  const updateTemplate = useUpdateEmailTemplate()
  const deleteTemplate = useDeleteEmailTemplate()

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [formData, setFormData] = useState({
    templateType: '',
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    variables: null as Record<string, string> | null,
    isActive: true,
  })

  // Reset form when starting to edit/create
  const resetForm = () => {
    setFormData({
      templateType: 'welcome',
      name: 'Welcome Email Template',
      subject: getDefaultSubject('welcome'),
      htmlContent: getDefaultContent('welcome'),
      textContent: '',
      variables: null,
      isActive: true,
    })
    setSelectedTemplate(null)
    setIsEditing(false)
  }

  // Load template data for editing
  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      templateType: template.templateType,
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: '',
      variables: null,
      isActive: true,
    })
    setIsEditing(true)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.templateType || !formData.name || !formData.subject || !formData.htmlContent.trim()) {
      return
    }

    const templateData = {
      tenantId: tenantId || null,
      templateType: formData.templateType,
      name: formData.name,
      subject: formData.subject,
      htmlContent: formData.htmlContent,
      textContent: null, // Simplified - no text content needed
      variables: null, // Simplified - no custom variables
      isActive: true, // Always active for simplicity
    }

    try {
      if (selectedTemplate) {
        await updateTemplate.mutateAsync({ id: selectedTemplate.id, data: templateData })
      } else {
        await createTemplate.mutateAsync(templateData)
      }
      resetForm()
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  // Handle template preview
  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template)
  }

  // Handle template duplication
  const handleDuplicate = (template: EmailTemplate) => {
    setFormData({
      templateType: template.templateType,
      name: `${template.name} (Copy)`,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: '',
      variables: null,
      isActive: true,
    })
    setSelectedTemplate(null)
    setIsEditing(true)
  }

  // Handle template deletion
  const handleDelete = async (template: EmailTemplate) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate.mutateAsync(template.id)
      } catch (error) {
        console.error('Failed to delete template:', error)
      }
    }
  }

  // Insert variable into content
  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('htmlContent') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end)
      const newText = before + variable + ' ' + after
      setFormData(prev => ({ ...prev, htmlContent: newText }))

      // Focus back and set cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 1, start + variable.length + 1)
      }, 0)
    }
  }

  // Insert HTML formatting
  const insertFormatting = (tag: string) => {
    const textarea = document.getElementById('htmlContent') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = textarea.value.substring(start, end)
      const text = textarea.value

      let formattedText = selectedText || 'text'
      formattedText = insertHtmlTag(tag, formattedText)

      const before = text.substring(0, start)
      const after = text.substring(end)
      const newText = before + formattedText + after

      setFormData(prev => ({ ...prev, htmlContent: newText }))

      // Focus back and set cursor position
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + formattedText.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Email Templates
          </h2>
          <p className="text-muted-foreground mt-1">
            Customize email templates for system notifications
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsEditing(true); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Template List */}
      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template)}
                      title="Preview template"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      title="Edit template"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                      title="Duplicate template"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      className="text-destructive hover:text-destructive"
                      title="Delete template"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
              </div>
              <CardDescription>
                Type: {TEMPLATE_TYPES.find(t => t.value === template.templateType)?.label || template.templateType}
                <br />
                Subject: {template.subject}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}

        {templates?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No email templates yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first email template to customize system notifications
              </p>
               <Button onClick={() => { resetForm(); setIsEditing(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Template Editor Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent
          className="max-h-[95vh] h-[95vh] overflow-y-auto"
          style={{ width: '75vw', maxWidth: 'none' }}
        >
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create Email Template'}
            </DialogTitle>
            <DialogDescription>
              Customize the email template content and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Type & Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateType">Email Type</Label>
                <Select
                  value={formData.templateType}
                  onValueChange={(value) => {
                    const defaultContent = getDefaultContent(value)
                    setFormData(prev => ({
                      ...prev,
                      templateType: value,
                      name: `${TEMPLATE_TYPES.find(t => t.value === value)?.label || 'Email'} Template`,
                      subject: getDefaultSubject(value),
                      htmlContent: defaultContent
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select email type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Template name"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject line"
              />
            </div>

            {/* Variables Helper */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Available Variables:</p>
                <div className="grid grid-cols-2 gap-2">
                  {VARIABLE_SUGGESTIONS.map((suggestion) => (
                    <div key={suggestion.variable} className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(suggestion.variable)}
                        className="text-xs flex-1 justify-start"
                        title={suggestion.description}
                      >
                        {suggestion.variable}
                      </Button>
                      <span className="text-xs text-muted-foreground truncate" title={suggestion.description}>
                        {suggestion.description}
                      </span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>

            {/* Email Content */}
            <div className="space-y-2">
              <Label htmlFor="htmlContent">Email Content (HTML)</Label>

              {/* Formatting Toolbar */}
              <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-t-md border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('bold')}
                  className="h-8 px-2"
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('italic')}
                  className="h-8 px-2"
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('underline')}
                  className="h-8 px-2"
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('h1')}
                  className="h-8 px-2 text-xs"
                  title="Heading 1"
                >
                  H1
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('h2')}
                  className="h-8 px-2 text-xs"
                  title="Heading 2"
                >
                  H2
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('h3')}
                  className="h-8 px-2 text-xs"
                  title="Heading 3"
                >
                  H3
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('ul')}
                  className="h-8 px-2"
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('ol')}
                  className="h-8 px-2"
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </div>

              <Textarea
                id="htmlContent"
                value={formData.htmlContent}
                onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                placeholder="Enter your email content here..."
                rows={16}
                className="font-mono text-sm rounded-t-none border-t-0"
              />

              <p className="text-xs text-muted-foreground">
                Use the toolbar above to format your email. Variables like {'{{memberName}}'} will be replaced when emails are sent.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createTemplate.isPending || updateTemplate.isPending}
              >
                {createTemplate.isPending || updateTemplate.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </>
                )}
              </Button>
            </div>

            {/* Email Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-md p-4 bg-background min-h-[400px] overflow-y-auto">
                <style>{`
                  /* Only override text colors, preserve visual styling */
                  .email-preview-content [style*="color: #1f2937"],
                  .email-preview-content [style*="color: #374151"],
                  .email-preview-content [style*="color: #9ca3af"],
                  .email-preview-content [style*="color:#1f2937"],
                  .email-preview-content [style*="color:#374151"],
                  .email-preview-content [style*="color:#9ca3af"] {
                    color: hsl(var(--foreground)) !important;
                  }

                  /* Convert light backgrounds to theme-aware */
                  .email-preview-content [style*="background: #f3f4f6"],
                  .email-preview-content [style*="background: #ffffff"],
                  .email-preview-content [style*="background:#f3f4f6"],
                  .email-preview-content [style*="background:#ffffff"] {
                    background: hsl(var(--muted)) !important;
                  }

                  /* Preserve gradients and complex styling */
                  .email-preview-content [style*="linear-gradient"],
                  .email-preview-content [style*="background-clip"],
                  .email-preview-content [style*="text-fill-color"] {
                    /* Keep original gradient and text styling */
                  }

                  /* Links should remain primary color */
                  .email-preview-content a {
                    color: hsl(var(--primary)) !important;
                  }
                `}</style>
                <div
                  dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                  className="prose prose-sm max-w-none email-preview-content"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent
          className="max-h-[95vh] h-[95vh] overflow-y-auto"
          style={{ width: '75vw', maxWidth: 'none' }}
        >
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Email template preview with applied styling
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Subject:</Label>
              <p className="text-sm text-muted-foreground mt-1">{previewTemplate?.subject}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Content:</Label>
              <div className="border rounded-md p-4 bg-background min-h-[400px] overflow-y-auto mt-2">
                <style>{`
                  /* Only override text colors, preserve visual styling */
                  .email-preview-content [style*="color: #1f2937"],
                  .email-preview-content [style*="color: #374151"],
                  .email-preview-content [style*="color: #9ca3af"],
                  .email-preview-content [style*="color:#1f2937"],
                  .email-preview-content [style*="color:#374151"],
                  .email-preview-content [style*="color:#9ca3af"] {
                    color: hsl(var(--foreground)) !important;
                  }

                  /* Convert light backgrounds to theme-aware */
                  .email-preview-content [style*="background: #f3f4f6"],
                  .email-preview-content [style*="background: #ffffff"],
                  .email-preview-content [style*="background:#f3f4f6"],
                  .email-preview-content [style*="background:#ffffff"] {
                    background: hsl(var(--muted)) !important;
                  }

                  /* Preserve gradients and complex styling */
                  .email-preview-content [style*="linear-gradient"],
                  .email-preview-content [style*="background-clip"],
                  .email-preview-content [style*="text-fill-color"] {
                    /* Keep original gradient and text styling */
                  }

                  /* Links should remain primary color */
                  .email-preview-content a {
                    color: hsl(var(--primary)) !important;
                  }
                `}</style>
                <div
                  dangerouslySetInnerHTML={{ __html: previewTemplate?.htmlContent || '' }}
                  className="prose prose-sm max-w-none email-preview-content"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}