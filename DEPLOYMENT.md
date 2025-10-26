# 🚀 Production Deployment Guide

## Overview
- **Backend**: Railway (NestJS + PostgreSQL)
- **Frontend**: Vercel (Next.js)
- **Storage**: Supabase (Photo uploads)
- **Repository**: https://github.com/manuelMarkDenver/creatives-membership-saas.git

---

## Prerequisites

1. ✅ GitHub repository with latest code
2. ✅ Railway account (https://railway.app)
3. ✅ Vercel account (https://vercel.com)
4. ✅ Supabase project already set up
5. ✅ Production-ready seeder script

---

## Part 1: Railway Backend Deployment

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose: `manuelMarkDenver/creatives-membership-saas`
5. Railway will detect multiple services - we'll configure them separately

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a PostgreSQL database
4. Note: Database credentials are automatically generated

### Step 3: Configure Backend Service

1. In Railway project, click "+ New"
2. Select "GitHub Repo"
3. Choose your repository
4. **Set Root Directory**: `/backend`
5. Railway will auto-detect it's a Node.js app

### Step 4: Set Environment Variables (Backend)

In Railway backend service settings → Variables, add:

```env
# Database (Railway provides these automatically when you link the database)
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}

# JWT Configuration (GENERATE NEW SECRETS FOR PRODUCTION!)
JWT_SECRET=YOUR_PRODUCTION_JWT_SECRET_HERE_CHANGE_THIS
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend URL (will update after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app

# Session Secret (GENERATE NEW SECRET!)
SESSION_SECRET=YOUR_PRODUCTION_SESSION_SECRET_CHANGE_THIS

# Supabase Storage (from your .env)
SUPABASE_URL=https://zhklwleqemtaykmokxoy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoa2x3bGVxZW10YXlrbW9reG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzY0OTEsImV4cCI6MjA2OTY1MjQ5MX0.nhecc2PF0MCG8xv2qGjC7DcUoFgWLF-tcQLkDB8z6CY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoa2x3bGVxZW10YXlrbW9reG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA3NjQ5MSwiZXhwIjoyMDY5NjUyNDkxfQ.B2S-7SI5CXeekgZ5hImJfbRvcPxXOin6qwxJ3gTh2ds

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Super Admin Credentials (for seeder)
SUPER_ADMIN_EMAIL=admin@creatives-saas.com
SUPER_ADMIN_PASSWORD=YOUR_SECURE_PASSWORD_HERE
```

### Step 5: Link PostgreSQL Database to Backend

1. In Railway backend service, go to "Settings"
2. Click "Connect" under Services
3. Select your PostgreSQL database
4. Railway will automatically inject `DATABASE_URL`

### Step 6: Set Build Configuration

In Railway backend service → Settings:

- **Build Command**: `npm run build`
- **Start Command**: `npm run start:prod`
- **Watch Paths**: `/backend`

### Step 7: Deploy Backend

1. Railway will automatically deploy when you push to GitHub
2. OR click "Deploy" manually in Railway dashboard
3. Wait for build to complete (~3-5 minutes)
4. Get your backend URL: `https://[your-project].up.railway.app`

### Step 8: Run Database Migrations & Seeder

**Option A: Using Railway CLI** (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run --service backend npx prisma db push

# Run seeder
railway run --service backend npm run seed
```

**Option B: Using Railway Dashboard**

1. Go to Railway backend service
2. Click "Settings" → "Deploy"
3. Add Deploy Command: `npx prisma db push && npm run seed`
4. Trigger a redeploy

---

## Part 2: Vercel Frontend Deployment

### Step 1: Push Code to GitHub

```bash
cd /home/mhackeedev/_apps/creatives-saas
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import `manuelMarkDenver/creatives-membership-saas`
4. Vercel will detect it's a Next.js app

### Step 3: Configure Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 4: Set Environment Variables (Frontend)

In Vercel project settings → Environment Variables:

```env
# Backend API URL (use your Railway URL)
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api/v1

# Frontend URL (Vercel will provide this after first deploy)
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app

# Node Environment
NODE_ENV=production
```

### Step 5: Deploy Frontend

1. Click "Deploy"
2. Vercel will build and deploy (~2-3 minutes)
3. Get your frontend URL: `https://your-app.vercel.app`

### Step 6: Update Backend CORS

1. Go back to Railway backend service
2. Update environment variables:
   ```env
   FRONTEND_URL=https://your-app.vercel.app
   CORS_ORIGIN=https://your-app.vercel.app
   ```
3. Redeploy backend

---

## Part 3: Post-Deployment Configuration

### Step 1: Verify Supabase Storage

1. Go to Supabase dashboard → Storage
2. Ensure `member-photos` bucket exists
3. Set bucket to **public** if needed for photo access
4. Verify CORS settings allow your domains

### Step 2: Test the Application

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Login with seeded credentials:
   - **Super Admin**: `admin@creatives-saas.com` / `YOUR_SECURE_PASSWORD_HERE`
   - **Gym Owner**: `owner@muscle-mania.com` / `MuscleManiaOwner123!`

### Step 3: Verify Core Features

- ✅ Login works
- ✅ Member creation works
- ✅ Subscription assignment works
- ✅ Photo upload works (Supabase)
- ✅ Location management works
- ✅ Membership plans CRUD works

---

## Part 4: Production Seeder Script

Your seeder (`backend/prisma/seed.js`) creates:

1. **Super Admin** user
2. **Subscription Plans** (Free Trial, Monthly, Annual)
3. **Muscle Mania Tenant** with:
   - Owner account
   - 3 Branches (Main, North, South)
   - 4 Gym Membership Plans (Day Pass, Monthly, Quarterly, Annual)
   - 12 Demo Members with:
     - Realistic names and contact info
     - Assigned subscriptions (various statuses)
     - Emergency contacts
     - Branch assignments

**To run seeder in production:**

```bash
# Using Railway CLI
railway run --service backend npm run seed

# Or via Railway dashboard Deploy Command
```

---

## Part 5: Domain Configuration (Optional)

### Custom Domain for Frontend (Vercel)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain: `app.yourdomain.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### Custom Domain for Backend (Railway)

1. Go to Railway backend service → Settings → Domains
2. Add custom domain: `api.yourdomain.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: api
   Value: [provided by Railway]
   ```

---

## Troubleshooting

### Backend Won't Start

1. Check Railway logs: Service → Deployments → View Logs
2. Common issues:
   - Missing environment variables
   - Database connection issues
   - Build failures

### Frontend Can't Connect to Backend

1. Verify `NEXT_PUBLIC_API_URL` in Vercel env vars
2. Check Railway backend CORS settings
3. Verify backend is running (check Railway dashboard)

### Database Migration Fails

1. Ensure DATABASE_URL is set correctly
2. Try manual migration:
   ```bash
   railway run --service backend npx prisma db push --force-reset
   ```

### Seeder Fails

1. Check if data already exists (seeder skips existing data)
2. View logs for specific errors
3. Ensure all required env vars are set

---

## Maintenance

### Updating Production

```bash
# 1. Commit changes locally
git add .
git commit -m "Your changes"
git push origin main

# 2. Railway and Vercel will auto-deploy

# 3. Run migrations if schema changed
railway run --service backend npx prisma db push
```

### Backing Up Production Database

```bash
# Export database (Railway CLI)
railway run --service postgres pg_dump > backup.sql

# Or use Railway dashboard → PostgreSQL → Backups
```

### Monitoring

- **Railway**: View logs and metrics in dashboard
- **Vercel**: View deployments and analytics
- **Supabase**: Monitor storage usage

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated new JWT_SECRET for production
- [ ] Generated new SESSION_SECRET for production
- [ ] Set NODE_ENV=production
- [ ] Configured CORS to only allow your frontend domain
- [ ] Set up HTTPS (automatic with Railway/Vercel)
- [ ] Enabled rate limiting
- [ ] Reviewed exposed environment variables
- [ ] Set up database backups
- [ ] Configured Supabase bucket permissions

---

## Costs

- **Railway**: ~$5-20/month (depending on usage)
- **Vercel**: Free tier (hobby projects)
- **Supabase**: Free tier (1GB storage, 50GB bandwidth)

**Total**: ~$5-20/month for production deployment

---

## Support

For issues:
1. Check Railway logs
2. Check Vercel deployment logs
3. Check Supabase dashboard
4. Review environment variables
5. Test API endpoints directly using curl/Postman

---

*Last Updated: October 26, 2025*
*Status: Ready for Production Deployment*
