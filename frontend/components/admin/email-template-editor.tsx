import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Edit, Plus, Eye, Save, X, AlertCircle, CheckCircle2, Code, Eye as EyeIcon } from 'lucide-react'
// @ts-ignore - react-draft-wysiwyg doesn't have React 19 types yet
import { Editor } from 'react-draft-wysiwyg'
// @ts-ignore - draft-js doesn't have React 19 types yet
import { EditorState, convertToRaw, ContentState, convertFromHTML, Modifier } from 'draft-js'
// @ts-ignore - draftjs-to-html doesn't have types
import draftToHtml from 'draftjs-to-html'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

// Custom styles for the rich text editor with dark mode support
const editorStyles = `
  .rdw-editor-wrapper {
    border: 1px solid hsl(var(--border));
    border-radius: 6px;
    background: hsl(var(--background));
  }
  .rdw-editor-toolbar {
    border: none;
    border-bottom: 1px solid hsl(var(--border));
    background: hsl(var(--muted));
    padding: 8px 12px;
  }
  .rdw-editor-main {
    min-height: 300px;
    padding: 12px 16px;
    color: hsl(var(--foreground));
    background: hsl(var(--background));
  }
  .rdw-editor-main .public-DraftEditor-content {
    min-height: 280px;
    color: hsl(var(--foreground));
  }
  .rdw-editor-main .public-DraftEditor-content [data-contents="true"] {
    color: hsl(var(--foreground));
  }
  .rdw-option-wrapper {
    border: 1px solid hsl(var(--border));
    background: hsl(var(--background));
    color: hsl(var(--foreground));
  }
  .rdw-option-wrapper:hover {
    background: hsl(var(--accent));
  }
  .rdw-option-active {
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
  }
  .rdw-dropdown-wrapper {
    border: 1px solid hsl(var(--border));
    background: hsl(var(--background));
  }
  .rdw-dropdown-optionwrapper {
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
  }
  .rdw-dropdown-optionwrapper:hover {
    background: hsl(var(--accent));
  }
  .rdw-colorpicker-modal {
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    color: hsl(var(--foreground));
  }
  .rdw-colorpicker-modal .rdw-colorpicker-cube {
    border: 1px solid hsl(var(--border));
  }
  /* Dark mode specific overrides */
  .dark .rdw-editor-main {
    background: hsl(var(--background));
    color: hsl(var(--foreground));
  }
  .dark .rdw-editor-main .public-DraftEditor-content {
    color: hsl(var(--foreground));
  }
  .dark .rdw-editor-main .public-DraftEditor-content [data-contents="true"] {
    color: hsl(var(--foreground));
  }
`
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

// Helper functions for rich text editor
const htmlToEditorState = (html: string): EditorState => {
  const blocksFromHTML = convertFromHTML(html)
  const contentState = ContentState.createFromBlockArray(
    blocksFromHTML.contentBlocks,
    blocksFromHTML.entityMap
  )
  return EditorState.createWithContent(contentState)
}

const editorStateToHtml = (editorState: EditorState): string => {
  return draftToHtml(convertToRaw(editorState.getCurrentContent()))
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [editorState, setEditorState] = useState(EditorState.createEmpty())
  const [formData, setFormData] = useState({
    templateType: '',
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    variables: null as Record<string, any> | null,
    isActive: true,
  })

  // Reset form when starting to edit/create
  const resetForm = () => {
    const defaultContent = getDefaultContent('welcome')
    setFormData({
      templateType: 'welcome',
      name: 'Welcome Email Template',
      subject: getDefaultSubject('welcome'),
      htmlContent: defaultContent,
      textContent: '',
      variables: null,
      isActive: true,
    })
    setEditorState(htmlToEditorState(defaultContent))
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
    setEditorState(htmlToEditorState(template.htmlContent))
    setIsEditing(true)
  }

  // Handle form submission
  const handleSubmit = async () => {
    const htmlContent = editorStateToHtml(editorState)
    if (!formData.templateType || !formData.name || !formData.subject || !htmlContent.trim()) {
      return
    }

    const templateData = {
      tenantId: tenantId || null,
      templateType: formData.templateType,
      name: formData.name,
      subject: formData.subject,
      htmlContent: htmlContent,
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
    const contentState = editorState.getCurrentContent()
    const selection = editorState.getSelection()
    const text = variable + ' '

    const newContentState = Modifier.insertText(
      contentState,
      selection,
      text
    )

    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      'insert-characters'
    )

    setEditorState(newEditorState)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
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
                    onClick={() => {
                      setSelectedTemplate(template)
                      setIsPreviewOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    className="text-destructive hover:text-destructive"
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
                    setEditorState(htmlToEditorState(defaultContent))
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
                <div className="flex flex-wrap gap-2">
                  {VARIABLE_SUGGESTIONS.slice(0, 4).map((suggestion) => (
                    <Button
                      key={suggestion.variable}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(suggestion.variable)}
                      className="text-xs"
                      title={suggestion.description}
                    >
                      {suggestion.variable}
                    </Button>
                  ))}
                </div>
              </AlertDescription>
            </Alert>

            {/* Email Content - Rich Text Editor */}
            <div className="space-y-2">
              <Label>Email Content</Label>
              <div className="border rounded-md">
                <Editor
                  editorState={editorState}
                  onEditorStateChange={(state: any) => {
                    try {
                      setEditorState(state)
                    } catch (error) {
                      console.error('Editor state update error:', error)
                    }
                  }}
                  toolbar={{
                    options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'link', 'history'],
                    inline: {
                      options: ['bold', 'italic', 'underline', 'strikethrough']
                    },
                    blockType: {
                      options: ['Normal', 'H1', 'H2', 'H3', 'Blockquote']
                    },
                    list: {
                      options: ['unordered', 'ordered']
                    }
                  }}
                  editorClassName="px-4 py-2 min-h-[300px] prose prose-sm max-w-none"
                  toolbarClassName="border-b px-3 py-2"
                  wrapperClassName="w-full"
                />
              </div>
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
                    {selectedTemplate ? 'Update' : 'Create'} Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className="max-h-[90vh] h-[90vh] overflow-y-auto"
          style={{ width: '70vw', maxWidth: 'none' }}
        >
          <DialogHeader className="!mb-2 !space-y-0.5">
            <DialogTitle className="!text-sm !leading-tight">Template Preview</DialogTitle>
            <DialogDescription className="!text-xs !leading-tight !mt-0.5">
              Preview of the email template content
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Subject:</Label>
                <p className="text-sm bg-muted p-2 rounded">{selectedTemplate.subject}</p>
              </div>

               <div>
                 <Label className="text-sm font-medium">HTML Content:</Label>
                 <div
                   className="text-sm bg-muted p-4 rounded max-h-[60vh] overflow-y-auto border"
                   dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }}
                 />
               </div>

               {selectedTemplate.textContent && (
                 <div>
                   <Label className="text-sm font-medium">Plain Text Content:</Label>
                   <pre className="text-sm bg-muted p-4 rounded whitespace-pre-wrap max-h-64 overflow-y-auto border font-mono">
                     {selectedTemplate.textContent}
                   </pre>
                 </div>
               )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}