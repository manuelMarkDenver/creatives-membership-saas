# Development Workflow Guide

## Database Strategy 🗄️

We maintain **separate databases** for safety:

- **Production DB** (`creatives_saas_prod`): Real customer data - NEVER touch in dev
- **Development DB** (`creatives_saas_dev`): Safe testing environment

### Why Separate Databases?
✅ **Safe development** - No risk of corrupting customer data  
✅ **Independent testing** - Test destructive operations safely  
✅ **Migration safety** - Test schema changes before production  
✅ **Data privacy** - Keep customer data secure  

## Environment Setup 🔧

### Development Environment
```bash
# 1. Switch to dev environment
cp .env.dev .env

# 2. Start development services (separate DB on port 5433)
docker compose -f docker-compose.dev.yml up -d

# 3. Initialize dev database (first time only)
docker compose -f docker-compose.dev.yml exec backend npx prisma db push

# 4. Sync base users to dev database
node scripts/sync-base-data.js
```

### Production Environment 
```bash
# 1. Switch to production environment  
cp .env.prod .env

# 2. Start production services (DB on port 5432)
docker compose up -d

# 3. Access production data (READ-ONLY for development)
```

## Database Ports 🚢

- **Production**: `localhost:5432` → `creatives_saas_prod`
- **Development**: `localhost:5433` → `creatives_saas_dev` 

## User Sync Strategy 👥

### Base Users (Synced between environments)
These are **system users**, not customer data:

- **Super Admin**: `admin@creatives-saas.com` / `SuperAdmin123!`
- **Owner**: `owner@muscle-mania.com` / `MuscleManiaOwner123!`

### Customer Data (Environment Specific)
- **Production**: Real customer gyms, members, subscriptions
- **Development**: Test data, fake gyms for testing

## Workflow Commands 🚀

### Daily Development
```bash
# Start development
cp .env.dev .env
docker compose -f docker-compose.dev.yml up -d

# Work on features...
# Test with development database

# When done
docker compose -f docker-compose.dev.yml down
```

### Production Deployment
```bash  
# Deploy to production
cp .env.prod .env
docker compose up -d --build

# Or deploy to Railway/Vercel (separate process)
```

### Database Sync
```bash
# Sync base users between environments (safe)
node scripts/sync-base-data.js

# NEVER sync customer data from dev to prod
# NEVER sync customer data from prod to dev (privacy)
```

## Safety Rules ⚠️

### ✅ Safe Operations
- Develop new features in dev environment
- Test with dev database (`creatives_saas_dev`)
- Add test gyms/members in dev
- Run destructive operations in dev
- Sync base system users between environments

### ❌ Dangerous Operations
- Never write to production database during development
- Never sync customer data from prod to dev  
- Never test destructive operations on production
- Never expose production credentials in dev

## File Structure 📁

```
├── .env                    # Current environment (dev/prod)
├── .env.dev               # Development configuration
├── .env.prod              # Production configuration  
├── docker-compose.yml     # Production services
├── docker-compose.dev.yml # Development services
└── scripts/
    └── sync-base-data.js  # Safe user sync script
```

## Login Credentials 🔑

Both environments have these **system users**:

| Role | Email | Password |
|------|--------|----------|
| Super Admin | `admin@creatives-saas.com` | `SuperAdmin123!` |
| Owner | `owner@muscle-mania.com` | `MuscleManiaOwner123!` |

## Database Access 💾

### Development Database
```bash
# Connect to dev database
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d creatives_saas_dev

# Or from host (if needed)
psql -h localhost -p 5433 -U postgres -d creatives_saas_dev
```

### Production Database (Read-Only)
```bash
# Connect to production database (BE CAREFUL!)
docker compose exec postgres psql -U postgres -d creatives_saas_prod

# Or from host
psql -h localhost -p 5432 -U postgres -d creatives_saas_prod
```

## Environment URLs 🌐

### Local Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **Dev Database**: localhost:5433

### Production (Railway/Vercel)
- **Frontend**: https://your-vercel-app.vercel.app
- **Backend API**: https://your-railway-app.railway.app/api/v1
- **Production Database**: Railway PostgreSQL

## Troubleshooting 🔧

### Common Issues

**"Port 5432 already in use"**
- Use different ports for dev (5433) and prod (5432)
- Or stop one environment before starting the other

**"User not found" errors**  
- Run sync script: `node scripts/sync-base-data.js`
- Check which environment you're in (`cat .env`)

**"Database connection failed"**
- Verify correct database port in `.env` file
- Check if containers are running: `docker compose ps`

### Quick Fixes
```bash
# Reset development environment
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
node scripts/sync-base-data.js

# Switch environments
cp .env.dev .env    # Development
cp .env.prod .env   # Production
```

This approach gives you the **safety of separate databases** with the **convenience of synchronized base users**! 🎉
