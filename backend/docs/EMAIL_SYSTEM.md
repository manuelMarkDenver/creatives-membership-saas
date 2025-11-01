# Creatives SaaS - Email System Documentation

## Overview

The Creatives SaaS platform includes a comprehensive email notification system that supports multiple email providers (Mailpit for development, Brevo for production) and customizable email templates.

## Features

- **Dual Provider Support**: Mailpit (development) and Brevo (production)
- **Customizable Templates**: HTML/text templates with variable substitution
- **System Notifications**: Welcome emails, admin alerts, tenant notifications
- **Email Logging**: Track all sent emails with status and metadata
- **Admin Configuration**: System-wide email settings management
- **Tenant Preferences**: Per-tenant email notification controls

## API Endpoints

### Email Settings (Admin Only)

- `GET /api/v1/admin/email-settings` - Get current email configuration
- `PUT /api/v1/admin/email-settings` - Update email settings

### Email Templates

- `GET /api/v1/email/templates` - List email templates (optionally filtered by tenant)
- `POST /api/v1/email/templates` - Create new email template
- `PUT /api/v1/email/templates/:id` - Update email template
- `DELETE /api/v1/email/templates/:id` - Delete email template

### Email Sending

- `POST /api/v1/email/send-welcome` - Send welcome email to new member
- `POST /api/v1/email/send-admin-alert` - Send admin alert for new tenant
- `POST /api/v1/email/send-tenant-notification` - Send tenant notification

### Email Logs

- `GET /api/v1/email/logs` - Get email sending history

## Email Templates

The system includes default templates for:

1. **Welcome Email** (`welcome`)
   - Sent when new members join
   - Variables: `{{memberName}}`, `{{memberEmail}}`, `{{tenantName}}`, `{{membershipPlanName}}`

2. **Admin Alert** (`admin_alert`)
   - Sent to admins when new tenants register
   - Variables: `{{tenantName}}`, `{{ownerEmail}}`

3. **Tenant Notification** (`tenant_notification`)
   - Sent to tenant owners for member updates
   - Variables: `{{tenantName}}`, `{{memberName}}`, `{{memberEmail}}`, `{{membershipPlanName}}`

## Configuration

### Development (Mailpit)

```bash
# Email settings in admin panel:
SMTP Host: localhost
SMTP Port: 1025
Mailpit Enabled: true

# View emails at: http://localhost:8025
```

### Production (Brevo)

```bash
# Set environment variables:
BREVO_API_KEY=your_brevo_api_key

# Email settings in admin panel:
Brevo API Key: your_api_key
Mailpit Enabled: false
```

## Testing

Run the email API tests:

```bash
# Start the backend server first
npm run start:dev

# Then run the email tests
./test-email-curl.sh
```

## Database Schema

### EmailSettings
- SMTP/Brevo configuration
- Provider settings
- Admin email recipients

### EmailTemplate
- Template type and content
- HTML/text versions
- Variable definitions
- Tenant association

### EmailLog
- Sending history
- Status tracking
- Provider information
- Error logging

## Security

- Admin-only access to email settings
- Input validation on all email data
- Secure credential storage
- Rate limiting on email sending

## Integration Points

- **Member Creation**: Automatically sends welcome emails
- **Tenant Registration**: Triggers admin alerts
- **Member Updates**: Sends tenant notifications
- **Admin Panel**: Email configuration and template management