# Agent Guidelines for Creatives SaaS

## Project Overview
**Multi-Business SaaS Platform** supporting gyms → coffee shops → e-commerce
- **Current Status**: Phase 1 Complete - Business Units & Performance Optimization ✅
- **Architecture**: Multi-tenant with business units for scalability
- **Business Model**: SaaS subscriptions with paid mode toggle per tenant (₱399/month per business unit)
- **Current Focus**: Gym MVP polish and production deployment
- **Mobile Strategy**: React Native apps (₱1.5M-2.5M setup + ₱150K-200K/month)
- **Pricing**: ₱399/month per business unit, ₱3,999/year (save 2 months)

## ⚠️ Important Agent Rules
- **ALWAYS ASK BEFORE MAKING CHANGES**: Never modify files, run commands, or make schema changes without explicit user approval first
- **CONFIRM UNDERSTANDING**: Ask clarifying questions if the request is ambiguous
- **EXPLAIN CHANGES**: When proposing changes, clearly explain what will be modified and why
- **PRESERVE USER CONTROL**: The user must approve every change to maintain their ability to follow along

## 🚨 Critical Issues & Safeguards Tracker

### ✅ RESOLVED
- [x] **User Schema Refactoring**: User table now business-agnostic
- [x] **RBAC Separation**: Global roles (SUPER_ADMIN, OWNER, MANAGER, STAFF) + Business roles (GYM_MEMBER, etc.)
- [x] **UserBranch Renamed**: GymUserBranch for gym-specific location management
- [x] **Photo Enhancement**: photoUrl (main) + photos (JSON array for multiple images)
- [x] **Orphaned Business Profiles**: Automatic User + Profile creation
- [x] **Role Consistency**: Clear global vs business role separation
- [x] **Automatic User Creation**: Gym members created with User + Profile atomically
- [x] **Database Constraints**: Unique constraints and proper relations
- [x] **CRUD Separation**: Users CRUD vs Gym CRUD operations

### 🔄 IN PROGRESS
- [x] **Orphaned Business Profiles**: Users without corresponding business profiles
- [x] **Role Consistency**: Global vs business role conflicts
- [x] **Automatic User Creation**: Create User + GymMemberProfile together
- [x] **Database Constraints**: Unique constraints and validation checks
- [x] **CRUD Separation**: Users CRUD vs Gym CRUD operations

### ❌ PENDING
- [ ] **Coffee Module**: Business-specific module for coffee customers
- [ ] **Cross-Business User Management**: Super admin dashboard for all users
- [ ] **Business-Specific Location Tables**: Separate tables for different business types
- [ ] **Permission-Based Access Control**: Granular permissions per business profile

### 🛡️ Safeguards Implemented
- [x] **Schema Constraints**: Foreign key relationships and indexes
- [x] **Application Validation**: Business logic validation layers
- [x] **Database Constraints**: Unique constraints and proper relations
- [x] **Transaction Safety**: Atomic operations for user + profile creation
- [x] **Role System**: Option A - Global + Business roles implemented
- [x] **CRUD Separation**: Users vs Business-specific operations
- [x] **Data Integrity**: Prevents orphaned profiles and duplicate entries

## Build/Lint/Test Commands

### Backend (NestJS)
- **Build**: `cd backend && npm run build`
- **Lint**: `cd backend && npm run lint`
- **Format**: `cd backend && npm run format`
- **Test all**: `cd backend && npm test`
- **Test single**: `cd backend && npx jest --testNamePattern="test name"`
- **Test watch**: `cd backend && npm run test:watch`
- **Test coverage**: `cd backend && npm run test:cov`
- **E2E tests**: `cd backend && npm run test:e2e`

### Frontend (Next.js)
- **Build**: `cd frontend && npm run build` (NODE_ENV=production for SSR compatibility)
- **Lint**: `cd frontend && npm run lint`
- **Dev server**: `cd frontend && npm run dev`
- **Production**: Deployed to Vercel (free tier) with Railway backend

## Development Environment

### Quick Start (Host-Based Development)
```bash
# Database in Docker, Frontend/Backend on host
./scripts/dev-start.sh

# Or manual 3-terminal setup
docker compose -f docker-compose.dev.yml up -d postgres
cd backend && npm run start:dev
cd frontend && npm run dev
```

### Port Management
- **Frontend**: Always run on port 3000. Kill any process using it if needed.
- **Backend**: Always run on port 5000. Kill any process using it if needed.

### Production Infrastructure
- **Backend**: Railway.com (₱250/month) - NestJS + PostgreSQL (149+ seeded users)
- **Frontend**: Vercel.com (free) - Next.js with SSR compatibility
- **Database**: Railway PostgreSQL with business units and gym subscriptions
- **File Storage**: Supabase Storage for member photos
- **Total Cost**: ₱250/month (bootstrap-friendly)
- **URLs**: https://happy-respect-production.up.railway.app (backend), Vercel deployment (frontend)

## Code Style Guidelines

### Backend (NestJS/TypeScript)
- **Imports**: NestJS imports first, then relative imports
- **Naming**: PascalCase for classes/services, camelCase for methods/properties
- **Error handling**: Use NestJS exceptions (BadRequestException, NotFoundException, etc.)
- **DTOs**: Use class-validator decorators and class-transformer
- **Types**: Strict TypeScript with some relaxed rules (noImplicitAny: false)
- **Formatting**: Single quotes, trailing commas (Prettier)
- **Database**: Prisma ORM with PostgreSQL, semantic table naming (GymMemberSubscription)

### Frontend (Next.js/React/TypeScript)
- **Components**: Functional components with hooks
- **Imports**: Use path aliases (@/*)
- **Styling**: Tailwind CSS with class-variance-authority
- **State**: Zustand stores for business logic, React Query for server state
- **UI**: Radix UI components
- **Forms**: React Hook Form with Zod validation
- **Types**: Strict TypeScript configuration
- **Performance**: Zustand stores eliminate re-render loops (< 3 renders per operation)
- **SSR Compatibility**: Client components for third-party libraries (react-toastify)
- **API Structure**: Business-specific endpoints (`/api/v1/gym/*`, `/api/v1/business-units/*`)

### General
- **Linting**: ESLint with TypeScript rules (ignore during builds for MVP)
- **Formatting**: Prettier (single quotes, trailing commas)
- **No comments**: Avoid adding comments unless explicitly requested
- **Security**: Never expose secrets, use environment variables
- **API Structure**: Business-specific endpoints (`/api/v1/gym/*`, `/api/v1/business-units/*`)
- **Database**: Multi-tenant with business units (shared schema, tenant isolation)
- **Authentication**: JWT with role-based access control (SUPER_ADMIN, OWNER, MANAGER, STAFF, GYM_MEMBER)

## Key Architecture Patterns

### Authentication & Authorization
- **JWT-based authentication** with comprehensive RBAC
- **Global Roles**: SUPER_ADMIN, OWNER, MANAGER, STAFF (platform-level)
- **Business Roles**: GYM_MEMBER, GYM_TRAINER, etc. (business-specific)
- **Guards**: Route-level protection with automatic redirects
- **Session Management**: Automatic cleanup of expired tokens
- **Branch Access**: Role-based member management per assigned branches
- **Data Integrity**: Prevents orphaned profiles and role conflicts

### State Management
- **Zustand Stores**: Business units, gym subscriptions, API caching, tenant context
- **React Query**: Server state management with optimistic updates
- **Performance**: < 3 re-renders per operation (eliminated 20+ re-render loops)
- **Real-time Updates**: Query invalidation for immediate UI refresh
- **Store Architecture**: Modular stores with error handling and loading states

### Database Design
- **Multi-Tenant Architecture**: Shared database with tenantId isolation
- **Business Units Model**: Flexible LOCATION, CHANNEL, DEPARTMENT, FRANCHISE types
- **Semantic Naming**: GymMemberSubscription, BusinessUnit, SaasSubscription
- **Migration Strategy**: Prisma migrations with comprehensive seeding (149+ users)
- **Schema Changes**: Always use Prisma migrations, never prisma push
- **Data Consistency**: Single source of truth with proper foreign key relationships
- **Paid Mode Toggle**: Subscription enforcement per tenant with trial management
- **Data Integrity**: Unique constraints, transaction safety, orphaned profile prevention

### RBAC Use Cases & Implementation

#### Global Roles (Platform-Level)
- **SUPER_ADMIN**: Full platform access, all tenants, system administration
- **OWNER**: Full tenant access, all branches, user management, billing
- **MANAGER**: Branch-specific management, staff supervision, client management
- **STAFF**: Limited operations, client check-in, basic client administration
- **CLIENT**: End users/customers across all business types (gym members, coffee customers, e-commerce customers, etc.)

#### Business Roles (Business-Specific)
- **GYM_MEMBER**: Gym-specific client with access to gym features
- **GYM_TRAINER**: Member training, workout plans, progress tracking
- **GYM_FRONT_DESK**: Member check-in, basic administration
- **GYM_MAINTENANCE**: Equipment maintenance, facility management

#### Access Patterns
- **Owner Access**: All branches within their tenant ✅
- **Manager Access**: Assigned branches only (via GymUserBranch table) ✅
- **Staff Access**: Assigned branches only (via GymUserBranch table) ✅
- **Client Access**: Their own profile and assigned branches ✅

#### RBAC Implementation Status
- **Global Roles**: SUPER_ADMIN, OWNER, MANAGER, STAFF, CLIENT ✅
- **Business Roles**: GYM_MEMBER, GYM_TRAINER, etc. ✅
- **Branch Assignment**: GymUserBranch table ✅
- **Owner All-Access**: Implemented in RBAC guard ✅
- **Manager Branch Assignment**: Via GymUserBranch ✅
- **Role Conflicts**: Resolved with clean CLIENT role separation ✅

#### User Creation Flow
- **Automatic**: `POST /gym/members` creates User (CLIENT role) + GymMemberProfile
- **Manual**: `POST /users` creates business-agnostic users
- **Role Assignment**: CLIENT global role for all end users, business-specific roles in profiles

## Current System Status

### ✅ Phase 1 Complete - Business Units & Performance Optimization
- **Business Units CRUD**: Complete multi-location management with paid mode toggle
- **Gym Subscriptions API**: Renewal, cancellation, transaction history, statistics
- **Performance Optimization**: < 3 re-renders per operation (eliminated 20+ loops)
- **State Management**: Zustand stores with React Query integration
- **Authentication Security**: JWT with comprehensive RBAC (global + business roles)
- **Production Deployment**: Railway backend + Vercel frontend (₱250/month total)
- **Database**: 149+ seeded users with realistic gym membership scenarios
- **API Architecture**: Business-specific endpoints (`/api/v1/gym/*`, `/api/v1/business-units/*`)
- **Data Integrity**: Automatic User + Profile creation, database constraints

### 🔧 Technical Achievements
- **Business Units Architecture**: Complete multi-tenant business unit management
- **Performance Optimization**: Reduced re-renders from 20+ to < 3 per operation
- **Gym-Specific APIs**: Complete overhaul to business-centric endpoints
- **State Management**: Efficient Zustand stores with React Query integration
- **Database Schema**: Multi-tenant with proper foreign key relationships
- **Production Deployment**: Railway + Vercel with automated CI/CD (₱250/month)
- **Authentication System**: Enterprise-level RBAC with CLIENT global role + business roles
- **SSR Compatibility**: Client components for third-party libraries
- **Data Seeding**: 149+ realistic users with comprehensive test scenarios
- **Data Integrity**: Database constraints, transaction safety, orphaned profile prevention

### 📊 Business Metrics
- **User Base**: 149+ seeded users across multiple gym tenants with realistic scenarios
- **Cost Structure**: ₱250/month total (Railway backend + Vercel frontend)
- **Database**: Railway PostgreSQL with business units and subscription tracking
- **Scalability**: Multi-tenant architecture ready for 100+ gym locations
- **Revenue Model**: SaaS subscriptions with paid mode toggle per tenant (₱399/month)
- **Mobile Strategy**: React Native apps (₱1.5M-2.5M setup + ₱150K-200K/month)

## Development Workflow

### Git Strategy
- **Branching**: Feature branches with descriptive names
- **Commits**: Detailed messages with file changes and impact
- **Code Review**: TypeScript compilation and functionality testing
- **Deployment**: Automated Railway/Vercel deployments on main branch push
- **Change Approval**: Ask user before applying or updating files

### Environment Management
- **Development**: Docker Compose (frontend, backend, PostgreSQL)
- **Production**: Railway backend + Vercel frontend with Railway PostgreSQL
- **Configuration**: Environment variables for all sensitive data
- **Seeding**: Automated database seeding with 149+ realistic users
- **Build Environment**: NODE_ENV=production required for SSR compatibility
- **Database**: Multi-tenant PostgreSQL with business unit isolation

### Performance Optimization
- **Frontend**: Zustand stores and React Query caching
- **Backend**: Efficient Prisma queries with proper indexing
- **Database**: Optimized schema with semantic naming
- **Mobile**: Touch-friendly interfaces with responsive design

## Project Vision & Roadmap

### Phase 1: Foundation & Architecture ✅ COMPLETED
- Business units architecture with multi-tenant support
- Performance optimization (< 3 re-renders per operation)
- Gym-specific API endpoints and data models
- Production deployment on Railway + Vercel
- Authentication system with comprehensive RBAC

### Phase 2: Gym MVP Polish & Launch (Current)
- Member management excellence and subscription workflows
- Mobile-responsive design optimization
- Production testing and user feedback collection
- Free MVP launch to Philippine gym market
- First 10 pilot gyms onboarding

### Phase 3: Traction Building + Mobile Planning
- User acquisition and market validation
- Mobile app architecture design for gyms
- Revenue model validation and pricing optimization
- Customer success and support systems

### Phase 4: Multi-Business Expansion
- Coffee shop module development
- Cross-business analytics and unified dashboard
- Mobile app deployment for multiple business types
- Enterprise features and advanced reporting

## 📚 Documentation References

### Current Project Documentation
- **Overhaul Progress**: `/home/mhackeedev/_apps/creatives-saas-docs/OVERHAUL_PROGRESS.md`
- **MVP Timeline**: `/home/mhackeedev/_apps/creatives-saas-docs/MVP_TIMELINE.md`
- **Development Workflow**: `/home/mhackeedev/_apps/creatives-saas-docs/DEVELOPMENT_WORKFLOW_GUIDE.md`
- **Multi-Business Architecture**: `/home/mhackeedev/_apps/creatives-saas-docs/MULTI_BUSINESS_ARCHITECTURE_PLAN.md`
- **Deployment Strategy**: `/home/mhackeedev/_apps/creatives-saas-docs/MVP_DEPLOYMENT_STRATEGY.md`

### Key Credentials for Testing
- **Owner Login**: `owner@muscle-mania.com` / `MuscleManiaOwner123!`
- **Manager Login**: `manager@muscle-mania.com` / `Manager123!`
- **Super Admin**: `admin@creatives-saas.com` / `SuperAdmin123!`

### Current Architecture
- **Backend**: NestJS with business-specific modules (`/api/v1/gym/*`, `/api/v1/business-units/*`)
- **Frontend**: Next.js with Zustand stores and React Query integration
- **Database**: Multi-tenant PostgreSQL with business unit isolation
- **Deployment**: Railway backend + Vercel frontend ($5/month total)

### Super Admin Features
- **Universal User Dashboard**: Tab/view showing all users across businesses (gym, coffee, e-commerce) agnostically
- **Cross-Business User Management**: View and manage users regardless of their business context
- **Business Profile Aggregation**: Display user information from respective business profiles (GymMemberProfile, CoffeeCustomerProfile, etc.)

This comprehensive AGENTS.md provides complete context for any agent working on the Creatives SaaS platform, ensuring consistent development practices and understanding of the current Phase 1 completion status, Phase 2 roadmap, and multi-business architecture foundation.