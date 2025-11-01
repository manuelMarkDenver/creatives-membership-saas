# Production Email Configuration Guide

## Overview

This guide covers configuring the email system for production deployment of the Creatives SaaS platform.

## Environment Variables

Add these to your production `.env` file:

```bash
# Email Configuration
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Company Name

# Optional: SMTP fallback (if Brevo is unavailable)
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
```

## Brevo Setup

1. **Create Brevo Account**: Sign up at [brevo.com](https://brevo.com)

2. **Get API Key**:
   - Go to SMTP & API → API Keys
   - Create a new API key with "Transactional emails" permission
   - Copy the API key to your environment variables

3. **Verify Domain** (Recommended):
   - Go to Senders & IP → Domains
   - Add and verify your domain
   - This improves deliverability

4. **Configure Admin Email Recipients**:
   - In the admin panel, set up admin email recipients for alerts
   - Use comma-separated email addresses

## Admin Panel Configuration

After deployment, configure email settings in the admin panel:

1. **Navigate**: Admin → Settings → Email Configuration

2. **Basic Settings**:
   - From Email: `noreply@yourdomain.com`
   - From Name: `Your Company Name`

3. **Provider Settings**:
   - Brevo API Key: Set via environment variable
   - Mailpit Enabled: `false` (uncheck for production)

4. **Admin Recipients**:
   - Add email addresses that should receive admin alerts
   - Format: `admin1@yourdomain.com, admin2@yourdomain.com`

## Email Templates

### Default Templates

The system includes default templates that are automatically seeded:

1. **Welcome Email**: Sent to new members
2. **Admin Alert**: Sent when new tenants register
3. **Tenant Notification**: Sent for member updates

### Customizing Templates

1. **Access**: Admin → Settings → Email Templates
2. **Edit**: Click on any template to customize
3. **Variables**: Use the available variables for dynamic content
4. **Testing**: Send test emails to verify formatting

## Tenant Email Preferences

Each tenant can configure their email preferences:

1. **Master Toggle**: Enable/disable all email notifications
2. **Individual Controls**:
   - Welcome emails for new members
   - Admin alerts for new registrations
   - Notifications for member updates
3. **Digest Settings**: Configure periodic summary emails

## Monitoring & Troubleshooting

### Email Logs

Monitor email delivery in the admin panel:

- **Location**: Admin → Settings → Email Logs
- **Features**:
  - Filter by status (sent, failed, pending)
  - View delivery details and errors
  - Track provider usage

### Common Issues

1. **Emails Not Sending**:
   - Check Brevo API key is valid
   - Verify domain authentication
   - Check email logs for errors

2. **Emails Going to Spam**:
   - Ensure proper domain verification
   - Use consistent From address
   - Monitor sender reputation

3. **Template Variables Not Working**:
   - Check variable syntax: `{{variableName}}`
   - Ensure variables are defined in template
   - Test with sample data

### Support

For email delivery issues:
- Check Brevo dashboard for delivery statistics
- Review email logs in the application
- Contact support@brevo.com for API issues

## Security Considerations

- **API Keys**: Never commit Brevo API keys to version control
- **Rate Limiting**: The system includes built-in rate limiting
- **Input Validation**: All email data is validated before sending
- **Logging**: Sensitive data is not logged in email records

## Performance

- **Batch Sending**: Large email campaigns are batched automatically
- **Caching**: Email templates are cached for performance
- **Async Processing**: Email sending is handled asynchronously
- **Retry Logic**: Failed emails are automatically retried