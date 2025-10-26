# 🚀 Production Deployment Checklist

**Date**: October 26, 2025
**Goal**: Deploy to Railway + Vercel for client demo

---

## Pre-Deployment

- [ ] Commit all latest changes to GitHub
- [ ] Generate new JWT_SECRET and SESSION_SECRET for production
- [ ] Have Railway account ready (https://railway.app)
- [ ] Have Vercel account ready (https://vercel.com)
- [ ] Verify Supabase `member-photos` bucket exists

---

## Railway Backend Deployment

### 1. Create Project
- [ ] Go to Railway → New Project
- [ ] Deploy from GitHub: `manuelMarkDenver/creatives-membership-saas`

### 2. Add PostgreSQL
- [ ] Click "+ New" → Database → PostgreSQL
- [ ] Wait for provisioning (~1 min)

### 3. Configure Backend Service
- [ ] Click "+ New" → GitHub Repo
- [ ] Set root directory: `/backend`
- [ ] Link PostgreSQL database to backend service

### 4. Set Environment Variables
Copy these to Railway backend service → Variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=[GENERATE_NEW_SECRET]
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=[WILL_UPDATE_AFTER_VERCEL]
CORS_ORIGIN=[WILL_UPDATE_AFTER_VERCEL]
SESSION_SECRET=[GENERATE_NEW_SECRET]
SUPABASE_URL=https://zhklwleqemtaykmokxoy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoa2x3bGVxZW10YXlrbW9reG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzY0OTEsImV4cCI6MjA2OTY1MjQ5MX0.nhecc2PF0MCG8xv2qGjC7DcUoFgWLF-tcQLkDB8z6CY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoa2x3bGVxZW10YXlrbW9reG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA3NjQ5MSwiZXhwIjoyMDY5NjUyNDkxfQ.B2S-7SI5CXeekgZ5hImJfbRvcPxXOin6qwxJ3gTh2ds
SUPER_ADMIN_EMAIL=admin@creatives-saas.com
SUPER_ADMIN_PASSWORD=[CHOOSE_SECURE_PASSWORD]
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Deploy Backend
- [ ] Railway will auto-deploy (~3-5 min)
- [ ] Note your Railway backend URL: `https://[project].up.railway.app`

### 6. Run Database Setup
- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Link project: `railway link`
- [ ] Run migrations: `railway run --service backend npx prisma db push`
- [ ] Run seeder: `railway run --service backend npm run seed`
- [ ] Verify seeder output shows "Super Admin created" and "Muscle Mania" tenant

---

## Vercel Frontend Deployment

### 1. Push to GitHub
```bash
cd /home/mhackeedev/_apps/creatives-saas
git add .
git commit -m "Production deployment"
git push origin main
```

### 2. Import to Vercel
- [ ] Go to Vercel → Add New → Project
- [ ] Import `manuelMarkDenver/creatives-membership-saas`
- [ ] Set framework: Next.js
- [ ] Set root directory: `frontend`

### 3. Set Environment Variables
```env
NEXT_PUBLIC_API_URL=[YOUR_RAILWAY_URL]/api/v1
NEXT_PUBLIC_FRONTEND_URL=[WILL_GET_AFTER_DEPLOY]
NODE_ENV=production
```

### 4. Deploy
- [ ] Click Deploy (~2-3 min)
- [ ] Note your Vercel URL: `https://[project].vercel.app`

### 5. Update Frontend URL
- [ ] Update `NEXT_PUBLIC_FRONTEND_URL` in Vercel with your actual URL
- [ ] Redeploy

### 6. Update Backend CORS
- [ ] Go back to Railway backend variables
- [ ] Update `FRONTEND_URL` and `CORS_ORIGIN` with your Vercel URL
- [ ] Redeploy backend

---

## Post-Deployment Testing

### Test Login
- [ ] Visit your Vercel URL
- [ ] Login as Super Admin: `admin@creatives-saas.com` / [YOUR_PASSWORD]
- [ ] Verify dashboard loads

### Test Gym Owner
- [ ] Logout
- [ ] Login as Owner: `owner@muscle-mania.com` / `MuscleManiaOwner123!`
- [ ] Verify Muscle Mania tenant loads
- [ ] Check Members page shows 12 demo members
- [ ] Check Locations page shows 3 branches
- [ ] Check Membership Plans shows 4 plans

### Test Core Features
- [ ] Create a new member
- [ ] Assign membership plan
- [ ] Upload member photo
- [ ] View subscription stats
- [ ] Filter by expired/expiring members
- [ ] Renew an expired membership

---

## Demo Data Verification

Your seeder creates:
- ✅ Super Admin account
- ✅ Muscle Mania gym tenant
- ✅ Owner account (Juan Cruz)
- ✅ 3 Branches (Main, North, South)
- ✅ 4 Membership Plans (Day Pass, Monthly, Quarterly, Annual)
- ✅ 12 Demo Members with:
  - Various subscription statuses (active, expiring, expired)
  - Emergency contacts
  - Branch assignments
  - Realistic Philippine names and phone numbers

---

## Production URLs

**Frontend**: ___________________________
**Backend**: ___________________________

**Login Credentials for Clients**:
- Super Admin: `admin@creatives-saas.com` / _______________
- Gym Owner: `owner@muscle-mania.com` / `MuscleManiaOwner123!`

---

## Troubleshooting

### Backend won't start
- Check Railway logs: Service → Deployments → Logs
- Verify all environment variables are set
- Check DATABASE_URL is connected

### Frontend can't connect
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS settings in Railway
- Test backend directly: `curl [RAILWAY_URL]/api/v1`

### Seeder fails
- Check Railway logs for specific error
- Ensure SUPER_ADMIN_EMAIL and PASSWORD are set
- Try running seed command again (it skips existing data)

---

## Success Criteria

✅ Backend deployed and running on Railway
✅ Frontend deployed and running on Vercel
✅ Database migrations applied
✅ Seeder created demo data
✅ Login works for both Super Admin and Owner
✅ All core features functional
✅ Ready for client demo

---

**Need help?** See `DEPLOYMENT.md` for detailed instructions.
