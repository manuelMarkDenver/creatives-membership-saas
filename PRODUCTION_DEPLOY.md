# Production Deployment Guide

## Pre-Deployment Checklist

✅ **Environment Variables Updated**
- `.env.prod` updated with Wasabi credentials
- Supabase variables commented out (deprecated)
- Using Wasabi Tokyo region (ap-northeast-1)

✅ **Storage Migration Complete**
- Migrated from Supabase to Wasabi
- Pre-signed URLs implemented for secure photo access
- Existing photos need bucket policy update (see below)

✅ **Branding Complete**
- GymBossLab logo and theme applied
- Favicon updated
- All UI components themed with pink→purple→orange gradient

---

## Railway (Backend) Deployment

### 1. Set Environment Variables in Railway Dashboard

Go to your Railway project → Variables tab and add:

```bash
# Wasabi Storage (CRITICAL - NEW)
WASABI_ACCESS_KEY_ID=NL79LP8IQU0HBQ82IZX2
WASABI_SECRET_ACCESS_KEY=ZYcfNa0EoWuUDhT1wi4rK8YlSgmrrKzgVC4uiB3V
WASABI_BUCKET_NAME=gympinoy-member-photos
WASABI_REGION=ap-northeast-1

# Database (Already configured)
DATABASE_URL=postgresql://postgres:cAQMJEXPFaSKFNHfKuBYfzlHqgujjNoV@tramway.proxy.rlwy.net:48777/railway
DIRECT_URL=postgresql://postgres:cAQMJEXPFaSKFNHfKuBYfzlHqgujjNoV@tramway.proxy.rlwy.net:48777/railway

# JWT & Server
JWT_SECRET=your-super-secure-jwt-secret-for-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production

# Frontend URLs
FRONTEND_URL=https://frontend-2q1gglz7b-manuelmarkdenvers-projects.vercel.app
NEXT_PUBLIC_API_URL=https://happy-respect-production.up.railway.app

# Remove these if present (deprecated):
# SUPABASE_URL
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

### 2. Deploy Backend

```bash
cd /home/mhackeedev/_apps/creatives-saas/backend

# Commit changes
git add .
git commit -m "feat: rebrand to GymBossLab with vibrant gradient theme"

# Push to Railway
git push railway main
# OR if using GitHub integration, just push to main
git push origin main
```

### 3. Verify Backend Deployment

Check Railway logs for:
```
✅ Wasabi S3 client initialized successfully
✅ Backend running on port 5000
```

---

## Vercel (Frontend) Deployment

### 1. Deploy Frontend

```bash
cd /home/mhackeedev/_apps/creatives-saas/frontend

# Make sure changes are committed
git add .
git commit -m "feat: rebrand to GymBossLab with vibrant gradient theme"

# Push to Vercel (via GitHub or direct)
git push origin main
# Vercel will auto-deploy if GitHub integration is set up
```

### 2. Verify Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Ensure these are set:
```bash
NEXT_PUBLIC_API_URL=https://happy-respect-production.up.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://frontend-2q1gglz7b-manuelmarkdenvers-projects.vercel.app
NEXT_PUBLIC_API_BYPASS_AUTH=false
NEXT_PUBLIC_FEATURE_ADVANCED_ANALYTICS=false
```

**Remove these if present (deprecated):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Post-Deployment: Wasabi Bucket Configuration

### Critical: Make Bucket Public

1. **Go to Wasabi Console**: https://console.wasabisys.com
2. **Select bucket**: `gympinoy-member-photos`
3. **Go to Policies tab**
4. **Add this bucket policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::gympinoy-member-photos/*"
    }
  ]
}
```

5. **Enable Public Access**:
   - Go to **Access Control** tab
   - Select **"Public Read"**
   - Click **"Set"**

### Alternative: Contact Wasabi Support

If public access is blocked at account level, email:
- **support@wasabi.com**
- Request: Enable public bucket access for account
- Mention: Using for gym member profile photos with pre-signed URLs

---

## Testing Production Deployment

### 1. Test Backend Health
```bash
curl https://happy-respect-production.up.railway.app/health
```

### 2. Test Frontend
1. Visit: https://frontend-2q1gglz7b-manuelmarkdenvers-projects.vercel.app
2. Verify:
   - ✅ GymBossLab branding appears
   - ✅ Pink/purple/orange gradient theme
   - ✅ Login page styled correctly
   - ✅ Favicon shows GymBossLab logo

### 3. Test Photo Upload
1. Login to production
2. Go to Members → Add Member
3. Upload a profile photo
4. Verify photo displays correctly
5. Check Wasabi console to see file uploaded

### 4. Test Analytics
1. Create a new subscription (today)
2. Filter by "Today" in dashboard
3. Verify revenue shows correctly
4. Test branch filtering

---

## Rollback Plan (If Issues Occur)

### Backend Rollback
```bash
# In Railway dashboard, go to Deployments
# Click on previous successful deployment
# Click "Redeploy"
```

### Frontend Rollback
```bash
# In Vercel dashboard, go to Deployments
# Find previous deployment
# Click "..." → "Promote to Production"
```

### Quick Fix: Wasabi Issues
If photos not loading:
1. Temporarily enable public bucket access in Wasabi
2. Or revert to Supabase by adding env vars back
3. Redeploy backend with Supabase credentials

---

## Success Criteria

✅ Backend deployed to Railway with Wasabi configured
✅ Frontend deployed to Vercel with new branding
✅ Member photos upload and display correctly
✅ Analytics "Today" filter works
✅ Branch filtering works in dashboard
✅ All buttons use gradient theme
✅ All stat cards show gradient styling
✅ Dark mode works correctly
✅ Mobile responsive

---

## Support

If deployment issues:
1. Check Railway logs: `railway logs`
2. Check Vercel deployment logs
3. Verify Wasabi bucket policy
4. Test with `curl` commands
5. Check browser console for errors

**Storage Migration Status**: Complete ✅
**Theme Migration Status**: Complete ✅
**Ready for Production**: ✅
