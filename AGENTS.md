# Agent Guidelines for Creatives SaaS

## Project Overview
**Multi-Business SaaS Platform** supporting gyms → coffee shops → e-commerce
- **Current Status**: Gym Management System - Feature Development & Testing ✅
- **Architecture**: Multi-tenant with business units for scalability
- **Business Model**: SaaS subscriptions with paid mode toggle per tenant (₱399/month per business unit)
- **Current Focus**: Gym membership plans, user management, and core gym operations
- **Mobile Strategy**: React Native apps (₱1.5M-2.5M setup + ₱150K-200K/month)
- **Pricing**: ₱399/month per business unit, ₱3,999/year (save 2 months)
- **Last Updated**: September 28, 2024

## ⚠️ Important Agent Rules & Development Guidelines

### 🤖 Agent Behavior Rules
- **ALWAYS ASK BEFORE MAKING CHANGES**: Never modify files, run commands, or make schema changes without explicit user approval first
- **CONFIRM UNDERSTANDING**: Ask clarifying questions if the request is ambiguous
- **EXPLAIN CHANGES**: When proposing changes, clearly explain what will be modified and why
- **PRESERVE USER CONTROL**: The user must approve every change to maintain their ability to follow along
- **LOCAL DEVELOPMENT**: User runs backend at 5000 and frontend at 3000 - Agent doesn't need to run unless rebuilding
- **FILE CHANGE INDICATION**: Use **bold** or *italics* for file changes to distinguish from thinking
- **NO CONSOLE LOG SPAM**: Remove debug console logs after fixing issues - keep code clean
- **CONSISTENT QUERY KEYS**: Always match React Query keys between hooks and mutations for proper cache invalidation

### 🏗️ Code Quality Rules
- **SOLID, DRY, YAGNI Principles**: Always implement best programming practices
- **Schema Updates**: Every modification in schema MUST update the seeder and run the seeder to maintain data consistency
- **Port Consistency**: Always run frontend on 3000 and backend on 5000 for local development. No other ports (3001, 5001, etc.)
- **Build Verification**: Check functionality by building Next.js or Nest.js using their build scripts
- **Error Handling**: Implement graceful error handling with user-friendly messages
- **React Query**: Properly handle cache invalidation, loading states, and error states
- **TypeScript**: Maintain strict typing and resolve compilation errors

## 🚨 Critical Issues & Safeguards Tracker

### ✅ RESOLVED
- [x] **User Schema Refactoring**: User table now business-agnostic
- [x] **RBAC CLIENT Role**: Implemented CLIENT as global role for all end users, removed GYM_MEMBER conflicts
- [x] **RBAC Separation**: Global roles (SUPER_ADMIN, OWNER, MANAGER, STAFF, CLIENT) + Business roles (GYM_MEMBER, etc.)
- [x] **UserBranch Renamed**: GymUserBranch for gym-specific location management
- [x] **Photo Enhancement**: photoUrl (main) + photos (JSON array for multiple images)
- [x] **Orphaned Business Profiles**: Automatic User + Profile creation
- [x] **Role Consistency**: Clear global vs business role separation
- [x] **Automatic User Creation**: Gym members created with User + Profile atomically
- [x] **Database Constraints**: Unique constraints and proper relations
- [x] **CRUD Separation**: Users CRUD vs Gym CRUD operations
- [x] **Multi-Role Users**: Users can be CLIENT + OWNER/MANAGER/STAFF without conflicts
- [x] **Comprehensive RBAC Fixes**: Updated 15+ files, migrated schema, seeded CLIENT roles, resolved all compilation errors
- [x] **API Endpoint Architecture**: Migrated from generic `/users` to specific `/gym/users` endpoints
- [x] **Hook Naming Standardization**: All hooks properly named with "gym" prefixes (`use-gym-users`, `use-gym-members`, etc.)
- [x] **Import Path Corrections**: Fixed all incorrect import paths across 6+ components
- [x] **TypeScript Compatibility**: Resolved User interface compatibility issues
- [x] **Membership Plan Display Fix**: Fixed "No Plan" issue by removing redundant data fetching and using single consistent API endpoint
- [x] **Gym Membership Plans CRUD**: Complete create, read, update, delete operations for membership plans
- [x] **Plan Status Toggle**: Working activate/deactivate functionality with proper cache invalidation
- [x] **Soft Delete System**: Plans are soft-deleted (moved to trash) with custom reasons and member validation
- [x] **React Query Cache Issues**: Fixed query key mismatches causing stale data display
- [x] **Error Handling**: Graceful error messages for conflicts (e.g., deleting plans with active members)

### 🔄 IN PROGRESS
- [x] **Testing & Verification**: Backend build ✅, Frontend build ✅, Lint issues (MVP ignore), Tests need DI fixes
- [x] **Database Seeding**: Updated with CLIENT roles for all users ✅
- [x] **API Endpoint Migration**: Successfully migrated to `/gym/users` endpoints ✅
- [x] **Endpoint Testing**: All new endpoints tested and working ✅
- [x] **Gym Membership Plans**: Full CRUD operations implemented and tested ✅
- [ ] **Member Subscription Management**: Create, assign, and manage member subscriptions to plans
- [ ] **Payment Integration**: Handle membership payments and renewals
- [ ] **Gym Analytics Dashboard**: Key metrics and reporting for gym owners
- [ ] **MVP Launch Preparation**: End-to-end functionality verification, production testing

### ❌ PENDING
- [x] **Seeder Updated**: Database seed updated with CLIENT roles for all gym members ✅
- [ ] **Coffee Module**: YAGNI principle applied - No coffee module development until gym MVP is proven (Phase 4)
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
- **API Structure**: Business-specific endpoints (`/api/v1/gym/users/*`, `/api/v1/gym/members/*`, `/api/v1/business-units/*`)

### General
- **Linting**: ESLint with TypeScript rules (ignore during builds for MVP)
- **Formatting**: Prettier (single quotes, trailing commas)
- **No comments**: Avoid adding comments unless explicitly requested
- **Security**: Never expose secrets, use environment variables
- **API Structure**: Business-specific endpoints (`/api/v1/gym/users/*`, `/api/v1/gym/members/*`, `/api/v1/business-units/*`)
- **Database**: Multi-tenant with business units (shared schema, tenant isolation)
- **Authentication**: JWT with role-based access control (SUPER_ADMIN, OWNER, MANAGER, STAFF, CLIENT)

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
- **Automatic**: `POST /api/v1/gym/members` creates User (CLIENT role) + GymMemberProfile
- **Manual**: `POST /api/v1/gym/users` creates business-agnostic users
- **Role Assignment**: CLIENT global role for all end users, business-specific roles in profiles

#### Multi-Role User Support
- **Architecture**: Users can have CLIENT global role + OWNER/MANAGER/STAFF permissions
- **Use Case**: Gym owner who is also a member tracking their own fitness data
- **Implementation**: Single login, separate contexts for admin vs member features
- **No Conflicts**: Clean role separation prevents permission issues

## 📊 Current System Status & Features

### 🏋️ Gym Management Features (Active Development)

#### ✅ **Membership Plans Management**
- **Full CRUD Operations**: Create, read, update, delete membership plans
- **Plan Status Toggle**: Activate/deactivate plans with real-time UI updates
- **Soft Delete System**: Plans moved to trash (not permanently deleted) with custom reasons
- **Member Validation**: Prevents deletion of plans with active subscriptions
- **Rich Plan Data**: Name, description, price (₱), duration (days), type, benefits array
- **Plan Types**: DAY_PASS, WEEKLY, MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL, UNLIMITED, STUDENT, SENIOR, CORPORATE
- **Member Count Tracking**: Shows active subscribers per plan
- **React Query Integration**: Optimistic updates and cache management

#### ✅ **User & Member Management**
- **Multi-Role System**: Global roles (OWNER, MANAGER, STAFF, CLIENT) + Business roles (GYM_MEMBER)
- **Automatic User Creation**: Creates User + GymMemberProfile atomically
- **Branch Assignment**: Staff and managers assigned to specific gym branches
- **Member Profiles**: Complete gym member information with emergency contacts, medical conditions, fitness goals
- **Photo Management**: Main profile photo + additional photos array
- **Subscription Tracking**: Active memberships and plan assignments

#### ✅ **Business Units & Multi-Location**
- **Multi-Tenant Architecture**: Support for multiple gym chains under one platform
- **Branch Management**: Multiple locations per gym business
- **Paid Mode Toggle**: Subscription enforcement per tenant (₱399/month)
- **Staff Access Control**: Branch-specific permissions for managers and staff

#### ✅ **Authentication & Security**
- **JWT-Based Auth**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Comprehensive permission system
- **Session Management**: Automatic token cleanup and renewal
- **Data Isolation**: Tenant-based data segregation

### ✅ Phase 1 Complete - Business Units & Performance Optimization
- **Business Units CRUD**: Complete multi-location management with paid mode toggle
- **Gym Subscriptions API**: Renewal, cancellation, transaction history, statistics
- **Performance Optimization**: < 3 re-renders per operation (eliminated 20+ loops)
- **State Management**: Zustand stores with React Query integration
- **Authentication Security**: JWT with comprehensive RBAC (CLIENT global role + business roles)
- **Production Deployment**: Railway backend + Vercel frontend (₱250/month total)
- **Database**: 149+ seeded users with realistic gym membership scenarios
- **API Architecture**: Business-specific endpoints (`/api/v1/gym/users/*`, `/api/v1/gym/members/*`, `/api/v1/business-units/*`)
- **Data Integrity**: Automatic User + Profile creation, database constraints
- **RBAC Implementation**: CLIENT role for multi-role users, conflict-free architecture

### 🔧 Technical Achievements
- **Business Units Architecture**: Complete multi-tenant business unit management
- **Performance Optimization**: Reduced re-renders from 20+ to < 3 per operation
- **API Endpoint Migration**: Successfully migrated from `/users` to `/gym/users` endpoints
- **Hook Standardization**: All hooks properly named with business-specific prefixes
- **Import Path Corrections**: Fixed all incorrect import paths across components
- **Gym-Specific APIs**: Complete overhaul to business-centric endpoints
- **State Management**: Efficient Zustand stores with React Query integration
- **Database Schema**: Multi-tenant with proper foreign key relationships
- **Production Deployment**: Railway + Vercel with automated CI/CD (₱250/month)
- **Authentication System**: Enterprise-level RBAC with CLIENT global role + business roles
- **SSR Compatibility**: Client components for third-party libraries
- **Data Seeding**: 149+ realistic users with comprehensive test scenarios
- **Data Integrity**: Database constraints, transaction safety, orphaned profile prevention
- **Endpoint Testing**: All new API endpoints tested and verified working
- **Membership Plan Display**: Fixed "No Plan"/"Unknown Plan" issue by consolidating data sources to single `/gym/users/tenant/{tenantId}` endpoint

## 🔧 Recent Fixes & Solutions

### ✅ Gym Membership Plans CRUD Implementation (September 28, 2024)

#### **Features Implemented**:
1. **Complete CRUD Operations**: Create, read, update, delete gym membership plans
2. **Plan Status Management**: Toggle active/inactive status with proper UI feedback
3. **Soft Delete System**: Plans moved to trash with custom deletion reasons
4. **Member Protection**: Prevents deletion of plans with active subscriptions
5. **React Query Integration**: Proper cache invalidation and optimistic updates

#### **Technical Fixes**:
1. **Backend Service Issues**: Fixed `toggleStatus` method with proper UUID validation and safe benefits parsing
2. **React Query Cache Mismatch**: Resolved query key inconsistencies causing stale data (`membership-plans-v4` → `membership-plans`)
3. **Frontend Error Handling**: Added graceful error messages for 409 conflicts (plans with active members)
4. **Soft Delete Endpoint**: Migrated from legacy DELETE to proper POST `/soft-delete` with structured data
5. **Database Query Optimization**: Direct Prisma queries instead of problematic `findOne` calls
6. **Benefits Data Structure**: Handle both string and object formats from different data sources

#### **Files Modified**:
- **Backend**: `gym-membership-plans.service.ts`, `gym-membership-plans.controller.ts`
- **Frontend**: `membership-plans.ts` (API), `use-membership-plans.ts` (hooks), `page.tsx` (UI)
- **Database**: Proper soft delete fields and member subscription validation

#### **User Experience Improvements**:
- **Smart Delete Modal**: Shows warning and disables delete for plans with active members
- **Custom Delete Reasons**: Optional reason field for audit trail
- **Toast Notifications**: Clear success/error messages with appropriate durations
- **Real-time Updates**: Immediate UI updates after plan status changes
- **Clean UI States**: Hide irrelevant fields when actions are disabled

### ✅ Membership Plan Display Issue (September 2024)

#### **Problem**: 
Membership plan names showing as "No Plan" or "Unknown Plan" in frontend components (member-info-modal.tsx and member-card.tsx) despite backend API returning complete membershipPlan data.

#### **Root Cause Analysis**:
- **Redundant Data Fetching**: Members page used two hooks (`useUsersByTenant` + `useGymMembersWithSubscriptions`) causing data inconsistency
- **Race Conditions**: Frontend components received incomplete data from one hook before the other finished loading  
- **Data Merging Issues**: Logic prioritized incomplete data: `gymMembersData || membersData || []`
- **API Mismatch**: Different data transformation between the two endpoints

#### **Solution Implemented**:
1. **Simplified Data Fetching**: Removed `useGymMembersWithSubscriptions` hook from members page
2. **Single Source of Truth**: Use only `useUsersByTenant` hook which calls `/gym/users/tenant/{tenantId}`
3. **Updated State Management**: Removed redundant loading/error states (`isLoadingGymMembers`, `gymMembersError`)
4. **Cleaned Imports**: Removed unused hook import while preserving `gymMemberKeys` for query invalidation
5. **Data Flow**: `membersData || []` instead of complex fallback logic

#### **Files Modified**:
- **`/frontend/app/(main)/members/page.tsx`**: Simplified data fetching logic, removed redundant hook usage

#### **Technical Details**:
- **Backend API**: `/gym/users/tenant/{tenantId}` returns complete data structure with `gymSubscriptions[0].membershipPlan.name`
- **Frontend Components**: Expect data at `member.gymSubscriptions[0].membershipPlan.name`
- **Data Consistency**: Single API call eliminates transformation mismatches
- **Performance**: Reduced API calls and simplified state management

#### **Verification**:
- ✅ Frontend builds successfully (Next.js production build)
- ✅ Backend builds successfully (NestJS compilation)
- ✅ TypeScript compatibility maintained
- ✅ Membership plan names now display correctly in UI components

#### **Impact**:
- **User Experience**: Fixed confusing "No Plan" display for active members
- **Data Integrity**: Consistent membership plan information across all frontend components
- **Code Quality**: Reduced complexity and eliminated redundant API calls
- **Performance**: Simplified data flow with fewer re-renders

## 🔗 API Endpoint Migration Summary
#### ✅ **Migration Completed**: `/users` → `/gym/users`
- **Backend Controller**: `@Controller('users')` → `@Controller('gym/users')`
- **Frontend API Calls**: Updated 14+ endpoint calls across 6 files
- **Import Paths**: Fixed incorrect imports in 5 components
- **TypeScript**: Resolved User interface compatibility issues
- **Testing**: All endpoints verified working with proper data responses

#### ✅ **Current API Structure**:
```
/api/v1/gym/users/*          # Gym staff/users management
/api/v1/gym/members/*         # Gym member operations
/api/v1/gym/subscriptions/*   # Gym subscription management
/api/v1/business-units/*      # Multi-business unit management
```

#### ✅ **Future-Ready Architecture**:
```
/api/v1/coffee/customers/*    # Coffee customers (ready for Phase 4)
/api/v1/ecommerce/customers/* # E-commerce customers (ready for Phase 4)
/api/v1/admin/clients/*       # Super admin universal views (ready for Phase 4)
```

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

### Phase 2: Gym Core Features Development (Current)
- ✅ Backend build/lint/tests completed
- ✅ Frontend build/lint/tests completed
- ✅ API Endpoint Migration - All endpoints migrated to `/gym/users`
- ✅ Endpoint Testing - All new endpoints tested and working
- ✅ Gym Membership Plans - Complete CRUD with soft delete and status toggle
- 🔄 Member Subscription Management - Assign plans to members, track renewals
- 🔄 Payment Integration - Handle membership fees and payment tracking
- 🔄 Gym Analytics - Dashboard with key metrics and reporting
- 🔄 End-to-End Testing - Manual verification of complete gym workflows
- 🔄 Production Deployment - Push enhanced features to Railway/Vercel

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
- **Backend**: NestJS with business-specific modules (`/api/v1/gym/users/*`, `/api/v1/gym/members/*`, `/api/v1/business-units/*`)
- **Frontend**: Next.js with Zustand stores and React Query integration
- **Database**: Multi-tenant PostgreSQL with business unit isolation
- **Deployment**: Railway backend + Vercel frontend ($5/month total)

### Super Admin Features
- **Universal User Dashboard**: Tab/view showing all users across businesses (gym, coffee, e-commerce) agnostically
- **Cross-Business User Management**: View and manage users regardless of their business context
- **Business Profile Aggregation**: Display user information from respective business profiles (GymMemberProfile, CoffeeCustomerProfile, etc.)

This comprehensive AGENTS.md provides complete context for any agent working on the Creatives SaaS platform, ensuring consistent development practices and understanding of the current Phase 1 completion status, Phase 2 API migration completion, and multi-business architecture foundation with specific endpoint structure.