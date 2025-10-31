# Email Configuration Guide

## Overview

The email service automatically switches between **Mailpit** (development) and **Brevo** (production) based on the `NODE_ENV` environment variable.

---

## 🧪 Development Configuration (Mailpit)

### What is Mailpit?
Mailpit is a local email testing tool that captures all outgoing emails without actually sending them. Perfect for development and testing.

### Setup

1. **Install Mailpit** (if not already installed):
```bash
# Using Docker (recommended)
docker run -d --name mailpit \
  -p 8025:8025 \
  -p 1025:1025 \
  axllent/mailpit

# Or using Homebrew (macOS)
brew install mailpit

# Or download binary from: https://github.com/axllent/mailpit/releases
```

2. **Environment Variables** (`.env.local` or `.env`):
```bash
NODE_ENV=development

# Mailpit SMTP settings (defaults - can be omitted)
SMTP_HOST=localhost
SMTP_PORT=1025

# Optional: Intercept all emails to a test address
# DEV_EMAIL_INTERCEPT=your-test@email.com
```

3. **Start Mailpit** (if not using Docker):
```bash
mailpit
```

4. **View Emails**:
- Open browser: http://localhost:8025
- All emails sent by the app will appear here

### How It Works
- When `NODE_ENV !== 'production'`, the email service **always** uses Mailpit/SMTP
- Emails are captured locally and viewable at http://localhost:8025
- No actual emails are sent to real addresses
- Perfect for testing email templates and verification flows

---

## 🚀 Production Configuration (Brevo)

### What is Brevo?
Brevo (formerly Sendinblue) is a professional email service provider with:
- Free tier: 300 emails/day
- Advanced deliverability
- Email tracking and analytics
- Transactional email API

### Setup

1. **Get Brevo API Key**:
   - Sign up at https://www.brevo.com
   - Go to: SMTP & API → API Keys
   - Create new API key (copy it securely)

2. **Configure Domain** (recommended):
   - Add your domain (e.g., gymbosslab.com)
   - Add DNS records (SPF, DKIM, DMARC)
   - Verify domain ownership
   - Add verified sender email (e.g., hello@gymbosslab.com)

3. **Environment Variables** (Railway, Vercel, or `.env.prod`):
```bash
NODE_ENV=production

# Brevo Configuration (Priority #1)
BREVO_API_KEY=xkeysib-your-api-key-here

# Email Settings
EMAIL_FROM=hello@gymbosslab.com
EMAIL_FROM_NAME=GymBossLab

# Frontend URL for email links
FRONTEND_URL=https://gymbosslab.com
```

### How It Works
- When `NODE_ENV === 'production'`, the email service uses Brevo API
- Emails are sent via Brevo's SMTP service
- Professional delivery with tracking
- Automatic fallback to other providers if Brevo is unavailable

---

## 🔄 Provider Priority (Production)

The service checks for providers in this order:

1. **Brevo** (recommended) - `BREVO_API_KEY`
2. **SendGrid** - `SENDGRID_API_KEY`
3. **Mailgun** - `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`
4. **Resend** - `RESEND_API_KEY`
5. **SMTP Fallback** (not recommended for production)

---

## 📧 Email Features

### Verification Emails
- Welcome message with business name
- Clickable verification button
- 24-hour token expiration
- Copy-paste fallback URL
- Professional branding with gradient theme

### Development Mode Features
- **Email Interception**: Set `DEV_EMAIL_INTERCEPT=test@example.com` to redirect all emails
- **Console Logging**: All email details logged to console
- **Mailpit Web UI**: Visual email preview at http://localhost:8025

---

## 🧪 Testing

### Development Testing
```bash
# 1. Start backend with NODE_ENV=development
cd backend
npm run start:dev

# 2. Open Mailpit UI
open http://localhost:8025

# 3. Trigger email (e.g., sign up)
# 4. Check Mailpit UI for email
```

### Production Testing
```bash
# 1. Set environment to production
export NODE_ENV=production

# 2. Ensure BREVO_API_KEY is set
echo $BREVO_API_KEY

# 3. Test email sending
# Emails will be sent via Brevo to real addresses
```

---

## 🔍 Debugging

### Check Email Service Logs
Look for startup logs:
```
🧪 [DEVELOPMENT MODE]
✅ Email service using Mailpit SMTP (localhost:1025)
📧 View emails at: http://localhost:8025
```

Or in production:
```
✅ [PRODUCTION] Email service using Brevo
```

### Common Issues

**Development:**
- ❌ Emails not showing in Mailpit → Check if Mailpit is running on port 8025
- ❌ Connection refused → Ensure SMTP port 1025 is available
- ✅ Solution: `docker ps` to check Mailpit container or restart Mailpit

**Production:**
- ❌ Emails not sending → Check `BREVO_API_KEY` is set correctly
- ❌ Invalid API key → Use format `xkeysib-xxx` (not `xsmtpsib-xxx`)
- ❌ Sender not verified → Verify domain and sender email in Brevo dashboard
- ✅ Solution: Check Brevo dashboard → SMTP & API → Settings

---

## 📋 Environment Variable Checklist

### Development (`.env.local`)
- [ ] `NODE_ENV=development` (or omit - defaults to development)
- [ ] Mailpit running on port 1025/8025
- [ ] Optional: `DEV_EMAIL_INTERCEPT` for email redirection

### Production (Railway/Vercel)
- [ ] `NODE_ENV=production`
- [ ] `BREVO_API_KEY=xkeysib-...`
- [ ] `EMAIL_FROM=hello@gymbosslab.com`
- [ ] `EMAIL_FROM_NAME=GymBossLab`
- [ ] `FRONTEND_URL=https://gymbosslab.com`

---

## 🔗 Useful Links

- **Mailpit GitHub**: https://github.com/axllent/mailpit
- **Mailpit UI** (dev): http://localhost:8025
- **Brevo Dashboard**: https://app.brevo.com
- **Brevo API Docs**: https://developers.brevo.com

---

## 💡 Tips

1. **Use Docker for Mailpit**: Easiest setup, starts automatically
2. **Verify Sender Domain**: Improves email deliverability in production
3. **Monitor Brevo Dashboard**: Check email delivery rates and bounces
4. **Keep API Keys Secret**: Never commit to git, use environment variables
5. **Test in Development First**: Always test email templates in Mailpit before production

---

**Last Updated**: October 31, 2025
