# Test Mailpit Connection

## ✅ Your Setup

Based on your environment:
- ✅ Mailpit running: `mailpit` container on ports 1025/8025
- ✅ Environment configured: `SMTP_HOST=localhost`, `SMTP_PORT=1025`
- ✅ Email service: Auto-detects development mode

## 🧪 Quick Test

### 1. Check Mailpit is Accessible
```bash
# Web UI should be accessible
curl -s http://localhost:8025 > /dev/null && echo "✅ Mailpit UI is running" || echo "❌ Mailpit UI not accessible"

# SMTP port should be listening
nc -zv localhost 1025 2>&1 | grep -q succeeded && echo "✅ SMTP port ready" || echo "❌ SMTP port not accessible"
```

### 2. Start Your Backend
```bash
cd /home/mhackeedev/_apps/creatives-saas/backend
npm run start:dev
```

Look for this in the logs:
```
🧪 [DEVELOPMENT MODE]
✅ Email service using Mailpit SMTP (localhost:1025)
📧 View emails at: http://localhost:8025
```

### 3. Trigger a Test Email
- Go to frontend: http://localhost:3000/auth/login
- Click "Sign Up" tab
- Fill in the signup form
- Click "Create Account"

### 4. Check Mailpit
Open http://localhost:8025 - you should see the verification email!

## 🎉 Success Criteria

- [ ] Backend logs show "Email service using Mailpit SMTP"
- [ ] Signup creates account without errors
- [ ] Email appears in Mailpit inbox (http://localhost:8025)
- [ ] Email has proper formatting and verification link

## 🐛 If Something Goes Wrong

**Backend can't connect to SMTP:**
```bash
# Restart Mailpit
docker restart mailpit

# Check if it's running
docker ps | grep mailpit
```

**No emails showing in Mailpit:**
- Check backend logs for email sending confirmation
- Verify Mailpit UI is accessible at http://localhost:8025
- Check for any error messages in backend console

**Email service using wrong provider:**
- Verify `NODE_ENV` is not set to "production" in your .env.local
- Check backend startup logs for which provider it's using

---

**Your Current Config:**
```
SMTP_HOST=localhost
SMTP_PORT=1025
NODE_ENV=development (default if not set)
```

This will automatically use Mailpit! 🎉
