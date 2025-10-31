# 📧 Email Quick Start Guide

## 🚀 TL;DR

**Development**: Mailpit captures emails locally → View at http://localhost:8025
**Production**: Brevo sends real emails → Set `BREVO_API_KEY` env var

---

## 🧪 Development Setup (5 minutes)

### Option 1: Docker Compose (Recommended)
```bash
# Start Mailpit with other services
docker compose -f docker-compose.dev.yml up -d mailpit

# Or start everything
docker compose -f docker-compose.dev.yml up -d
```

### Option 2: Docker Only
```bash
docker run -d --name mailpit \
  -p 8025:8025 \
  -p 1025:1025 \
  axllent/mailpit
```

### View Emails
Open http://localhost:8025 in your browser

### Environment Variables
```bash
# In your .env.local or .env
NODE_ENV=development  # Auto-uses Mailpit

# Optional overrides (defaults work fine)
SMTP_HOST=localhost
SMTP_PORT=1025
```

That's it! All emails now go to Mailpit.

---

## 🚀 Production Setup (10 minutes)

### 1. Get Brevo API Key
- Sign up: https://www.brevo.com
- Go to: SMTP & API → API Keys → Create new key
- Copy the key (format: `xkeysib-xxx...`)

### 2. Set Environment Variables

**Railway (Backend):**
```bash
railway variables set BREVO_API_KEY="xkeysib-your-key-here"
railway variables set EMAIL_FROM="hello@gymbosslab.com"
railway variables set EMAIL_FROM_NAME="GymBossLab"
railway variables set NODE_ENV="production"
```

**Or via Railway Dashboard:**
- Go to your project → Variables
- Add the variables above

### 3. Verify Domain (Recommended)
- Brevo Dashboard → Senders & IP → Domains
- Add your domain (gymbosslab.com)
- Add DNS records they provide (SPF, DKIM, DMARC)
- Verify sender email (hello@gymbosslab.com)

### 4. Test
Deploy and trigger an email (e.g., sign up). Check Brevo dashboard for delivery.

---

## 🔍 Quick Checks

### Is Mailpit Running? (Development)
```bash
# Check Docker container
docker ps | grep mailpit

# Or visit
open http://localhost:8025
```

### Check Email Provider (Backend logs)
Look for startup logs:
```
# Development
🧪 [DEVELOPMENT MODE]
✅ Email service using Mailpit SMTP (localhost:1025)

# Production
✅ [PRODUCTION] Email service using Brevo
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Mailpit not working | `docker restart mailpit` or `docker compose up -d mailpit` |
| Can't access localhost:8025 | Check if port is in use: `lsof -i :8025` |
| Emails not sending in prod | Check `BREVO_API_KEY` is set in Railway |
| Brevo 401 error | API key format should be `xkeysib-xxx` not `xsmtpsib-xxx` |

---

## 📖 Full Documentation
See `EMAIL-CONFIGURATION.md` for complete guide with examples and advanced configuration.

---

**Quick Commands:**
```bash
# Start Mailpit
docker compose -f docker-compose.dev.yml up -d mailpit

# View Mailpit logs
docker logs creatives-saas-mailpit

# Stop Mailpit
docker compose -f docker-compose.dev.yml stop mailpit

# Access Mailpit UI
open http://localhost:8025
```
