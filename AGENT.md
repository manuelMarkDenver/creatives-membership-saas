# Creatives SaaS - Agent Documentation

## 📋 Project Overview
**Multi-Business SaaS Platform** supporting gyms → coffee shops → e-commerce
- **Current Status**: Gym Management System - Feature Development & Testing ✅
- **Architecture**: Multi-tenant SaaS platform for gym businesses with business units for scalability
- **Business Model**: SaaS subscriptions with paid mode toggle per tenant (₱399/month per business unit)
- **Current Focus**: Gym membership plans, user management, and core gym operations
- **Mobile Strategy**: React Native apps (₱1.5M-2.5M setup + ₱150K-200K/month)
- **Pricing**: ₱399/month per business unit, ₱3,999/year (save 2 months)
- **Frontend**: Next.js 15.4.5 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS with Prisma ORM, PostgreSQL
- **Localization**: Philippine Peso (₱) currency formatting

---

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
- **Seeder Maintenance**: When adding new schema fields or changing existing structures, always update `/backend/prisma/seed.js` to include the new fields with appropriate default values
- **Port Consistency**: Always run frontend on 3000 and backend on 5000 for local development. No other ports (3001, 5001, etc.)
- **Build Verification**: Check functionality by building Next.js or Nest.js using their build scripts
- **Error Handling**: Implement graceful error handling with user-friendly messages
- **React Query**: Properly handle cache invalidation, loading states, and error states
- **TypeScript**: Maintain strict typing and resolve compilation errors

### 🚫 DATABASE MIGRATION RULES

**CRITICAL: NO MIGRATIONS DURING DEVELOPMENT**
- ✅ **Use `prisma db push` ONLY** for all schema changes during development
- ❌ **DO NOT use migrations** until MVP production launch
- **Reason**: We're rapidly iterating on schema and features
- **Production**: Will create proper migrations once MVP is finalized

```bash
# ✅ CORRECT - Use for development
npx prisma db push

# ❌ WRONG - Don't use until production
npx prisma migrate dev
npx prisma migrate deploy
```

**Schema Change Workflow:**
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Update seeders if schema changes affect seeding
4. Run seeders to maintain updated data
5. Test changes thoroughly
6. Commit to git

---

## 🚨 Critical Issues & Safeguards Tracker

### ✅ **RESOLVED**
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
- [x] **🔐 MAJOR: Comprehensive Authentication System**: Production-ready auth with automatic logout, tenant validation, and multi-role support
- [x] **🔐 AuthGuard TenantId Fix**: Fixed backend tenant context extraction for OWNER users
- [x] **🔐 Role Field Consistency**: Fixed gym member creation setting both `role` and `globalRole` fields
- [x] **🔐 Branch Assignment System**: Multi-branch selection during member creation with validation
- [x] **🔐 Membership Plans Cache**: Fixed immediate refresh after plan creation
- [x] **🔐 Frontend Environment Variables**: Added proper `.env.local` with `NEXT_PUBLIC_API_URL`
- [x] **🔐 Cross-Tab Logout Security**: Logout in one tab affects all browser tabs
- [x] **🔐 Invalid Tenant Auto-Logout**: Automatic logout when user's organization no longer exists

### 🔄 **IN PROGRESS**
- [x] **Testing & Verification**: Backend build ✅, Frontend build ✅, Authentication system ✅, Multi-role support ✅
- [x] **Database Seeding**: Updated with CLIENT roles for all users ✅
- [x] **API Endpoint Migration**: Successfully migrated to `/gym/users` endpoints ✅
- [x] **Endpoint Testing**: All new endpoints tested and working ✅
- [x] **Gym Membership Plans**: Full CRUD operations implemented and tested ✅
- [x] **Comprehensive Authentication**: Production-ready auth system with automatic logout ✅
- [x] **Multi-Role Support**: OWNER, MANAGER, STAFF, CLIENT roles all working ✅
- [x] **Member Creation**: Fixed role field consistency, branch assignment working ✅
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

---

## 🚀 Recent Updates & Fixes

### **Version: September 29, 2025**

#### ✅ **Member Management UX & Onboarding System - COMPLETED** 
**Critical UX improvements and first-time setup tracking**

**🔧 Major UX & Onboarding Features Applied:**

1. **Membership Plans Requirement Enforcement** ✅
   - ✅ **Add Member Button Logic**: Disabled when no membership plans exist
   - ✅ **Visual Feedback**: Button changes to amber/orange gradient with "Create Plans First" text
   - ✅ **Informative Modal**: `MembershipPlansRequiredModal` guides users to create plans first
   - ✅ **UX Rule Enforcement**: Members cannot be added without membership plans existing

2. **First-Time Tenant Onboarding Tracking** ✅
   - ✅ **Database Schema**: Added `onboardingCompletedAt` and `ownerPasswordChanged` fields to Tenant table
   - ✅ **Backend API**: Three new endpoints for onboarding management:
     - `GET /tenants/:id/onboarding-status` - Get comprehensive setup status
     - `POST /tenants/:id/complete-onboarding` - Mark onboarding complete
     - `POST /tenants/:id/mark-password-changed` - Track password changes
   - ✅ **Onboarding Logic**: Tracks password changes, membership plans creation, and member additions
   - ✅ **Next Steps Suggestions**: API returns actionable next steps for incomplete onboarding

3. **Code Quality & Production Readiness** ✅
   - ✅ **Console Log Cleanup**: Removed unnecessary debug logs from production code
   - ✅ **API Client Optimization**: Cleaned up configuration logging while preserving error handling
   - ✅ **Build Optimization**: Faster, cleaner builds without debug noise
   - ✅ **Migration Strategy**: Using `prisma db push` for development, proper migrations for production

4. **Enhanced Membership Plans Hook** ✅
   - ✅ **Empty State Handling**: Properly returns empty arrays instead of mock data
   - ✅ **Type Safety**: Fixed TypeScript issues and removed deprecated options
   - ✅ **API Error Handling**: Graceful fallbacks for new tenants without plans

#### ✅ **Super Admin Tenant Management - COMPLETED**
**Critical system authentication fix**

**🔧 Major Authentication Fixes Applied:**

1. **Field Mismatch Resolution** ✅
   - ✅ **Database Schema**: Fixed inconsistency between `role` and `globalRole` fields
   - ✅ **Seeder Update**: Updated to use `role` field consistently across all user types
   - ✅ **Auth Guard Fix**: Modified to use correct `role` field instead of deprecated `globalRole`
   - ✅ **RBAC Guard Fix**: Updated role checking to use proper field mapping

2. **Tenant Owner Password Reset** ✅
   - ✅ **Backend API**: Reset password endpoint working correctly
   - ✅ **Password Generation**: Secure 12-character temporary passwords
   - ✅ **Frontend Integration**: Toast notifications with copy-to-clipboard functionality
   - ✅ **Multi-layer Notifications**: Toast + alert popup for password communication

3. **Database Consistency** ✅
   - ✅ **Role Standardization**: All users now use `role` field (SUPER_ADMIN, OWNER, MANAGER, CLIENT)
   - ✅ **Seeder Rebuild**: Complete database reset and reseed with correct schema
   - ✅ **API Authentication**: Bypass auth mechanism working for development/testing

4. **Member Access Resolution** ✅
   - ✅ **API Endpoint**: Members accessible via `/gym/users?tenantId={id}` for tenant owners
   - ✅ **Data Verification**: 14 users successfully created (12 gym members, 1 manager, 1 owner)
   - ✅ **Tenant Context**: Proper member filtering by tenant ID

#### ✅ **Membership Plans Module - COMPLETED**
**Location**: `/app/(main)/membership-plans/`

**🔧 Major Fixes Applied:**

1. **CRUD Operations - FULLY FUNCTIONAL** ✅
   - ✅ **Create**: Full validation, proper error handling, gym-specific API
   - ✅ **Read**: Enhanced with member counts, shows all plans (active + inactive)
   - ✅ **Update**: Complete edit dialog with pre-populated form data
   - ✅ **Delete**: Conflict detection for plans with active subscriptions
   - ✅ **Toggle Status**: Activate/deactivate functionality

2. **Backend Service Enhanced** ✅
   - ✅ Fixed TypeScript compilation issues
   - ✅ Added member count calculation from both modern subscriptions and legacy data
   - ✅ Enhanced error handling with proper HTTP status codes
   - ✅ Gym-specific API endpoints under `/gym/membership-plans`

3. **Philippine Peso Formatting** 🇵🇭 ✅
   - ✅ **Currency Utilities**: Enhanced `/lib/utils/currency.ts`
   - ✅ **formatPHPCompact()**: Clean formatting (₱1,200 not ₱1200.00)
   - ✅ **Individual Plans**: All prices show proper ₱ formatting
   - ✅ **Form Inputs**: Added ₱ symbol prefix in price fields
   - ✅ **Removed Problematic Average Price**: Eliminated long decimal display issue

4. **UI/UX Improvements** ✅
   - ✅ **Fixed Edit Modal**: Working edit button and pre-populated forms
   - ✅ **Enhanced Form Validation**: Better user feedback and error messages
   - ✅ **Status Indicators**: Clear active/inactive badges and member counts
   - ✅ **Mobile-First Stats**: Clean overview without problematic average price

5. **Plan Creation Fix** ✅ (Sep 28, 2025)
   - ✅ **Fixed DTO Validation**: Separated request DTO from internal DTO
   - ✅ **TenantId Handling**: Proper multi-tenant security with user context
   - ✅ **API Validation**: Resolved "tenantId should not exist" error
   - ✅ **Controller Updates**: Both gym and regular membership plan controllers fixed

6. **Toast System Migration** ✅ (Sep 29, 2025)
   - ✅ **Sonner Removal**: Completely removed sonner package and migrated to react-toastify
   - ✅ **Copy Functionality**: Enhanced tenant password reset with modern modal and copy buttons
   - ✅ **Build Fixes**: Resolved all TypeScript compilation errors related to toast API
   - ✅ **UX Improvements**: Professional password reset modal with dark/light mode support
   - ✅ **Security**: Fixed clipboard access issues and removed console.log security risks

---

## 📊 Current Module Status

### ✅ **COMPLETED & FUNCTIONAL**
- **Membership Plans** - Full CRUD with Philippine peso formatting
- **Member Management UX** - Proper membership plans requirement enforcement with informative modals
- **Onboarding Tracking** - Complete first-time setup tracking for new tenants
- **Dashboard** - System overview with proper currency display
- **Authentication** - Login/logout functionality + **FIXED role field issues**
- **Tenant Owner Management** - Password reset and owner access working
- **Multi-tenant Architecture** - Tenant isolation and role-based access
- **Member Access** - Owners can view their tenant's gym members

### 🔨 **IN PROGRESS / TO BE REVIEWED**
- **Members Management** - Existing functionality needs review
- **Subscriptions** - May need currency formatting updates
- **Staff Management** - Basic functionality exists
- **Reports & Analytics** - Needs enhancement

### ❌ **NEEDS ATTENTION**
- **Build Process** - Some linting warnings to address
- **Member Subscriptions Page** - Page collection issue during build
- **Type Safety** - Multiple `any` types need proper typing

---

## 🛠 Technical Architecture

### **Backend Structure**
```
/backend/src/
├── modules/
│   ├── gym/membership-plans/     # Gym-specific membership plans
│   ├── membership-plans/         # Generic membership plans (legacy)
│   ├── auth/                     # Authentication
│   └── users/                    # User management
├── core/
│   ├── prisma/                   # Database layer
│   └── auth/                     # Auth guards and decorators
```

### **Frontend Structure**
```
/frontend/
├── app/(main)/
│   ├── membership-plans/         # ✅ FULLY FUNCTIONAL
│   ├── dashboard/               # ✅ Updated with currency
│   ├── members/                 # Needs review
│   └── member-subscriptions/    # Build issue
├── lib/
│   ├── utils/currency.ts        # ✅ Enhanced Philippine peso
│   ├── hooks/                   # React Query hooks
│   └── api/                     # API layer
```

### **Authentication & Authorization**
- **JWT-based authentication** with comprehensive RBAC
- **Global Roles**: SUPER_ADMIN, OWNER, MANAGER, STAFF, CLIENT (platform-level)
- **Business Roles**: GYM_MEMBER, GYM_TRAINER, etc. (business-specific)
- **Guards**: Route-level protection with automatic redirects
- **Session Management**: Automatic cleanup of expired tokens
- **Branch Access**: Role-based member management per assigned branches
- **Data Integrity**: Prevents orphaned profiles and role conflicts

### **🔐 Advanced Authentication System (Oct 2025)**
- **Comprehensive Validation**: Role-aware authentication with tenant validation
- **Automatic Logout**: Invalid tokens, expired sessions, deleted tenants trigger immediate logout
- **Cross-Tab Security**: Logout synchronization across all browser tabs
- **Error Categorization**: Context-aware messages (token expired, access denied, tenant missing)
- **Multi-Role Support**: Different validation logic for SUPER_ADMIN, OWNER, MANAGER, STAFF, CLIENT
- **Production Ready**: Complete auth data cleanup, graceful error handling, network resilience

### **State Management**
- **Zustand Stores**: Business units, gym subscriptions, API caching, tenant context
- **React Query**: Server state management with optimistic updates
- **Performance**: < 3 re-renders per operation (eliminated 20+ re-render loops)
- **Real-time Updates**: Query invalidation for immediate UI refresh
- **Store Architecture**: Modular stores with error handling and loading states

### **Database Design**
- **Multi-Tenant Architecture**: Shared database with tenantId isolation
- **Business Units Model**: Flexible LOCATION, CHANNEL, DEPARTMENT, FRANCHISE types
- **Semantic Naming**: GymMemberSubscription, BusinessUnit, SaasSubscription
- **Migration Strategy**: Prisma migrations with comprehensive seeding (149+ users)
- **Schema Changes**: Always use Prisma migrations, never prisma push
- **Data Consistency**: Single source of truth with proper foreign key relationships
- **Paid Mode Toggle**: Subscription enforcement per tenant with trial management
- **Data Integrity**: Unique constraints, transaction safety, orphaned profile prevention

---

## 🔧 RBAC Use Cases & Implementation

### Global Roles (Platform-Level)
- **SUPER_ADMIN**: Full platform access, all tenants, system administration
- **OWNER**: Full tenant access, all branches, user management, billing
- **MANAGER**: Branch-specific management, staff supervision, client management
- **STAFF**: Limited operations, client check-in, basic client administration
- **CLIENT**: End users/customers across all business types (gym members, coffee customers, e-commerce customers, etc.)

### Business Roles (Business-Specific)
- **GYM_MEMBER**: Gym-specific client with access to gym features
- **GYM_TRAINER**: Member training, workout plans, progress tracking
- **GYM_FRONT_DESK**: Member check-in, basic administration
- **GYM_MAINTENANCE**: Equipment maintenance, facility management

### Access Patterns
- **Owner Access**: All branches within their tenant ✅
- **Manager Access**: Assigned branches only (via GymUserBranch table) ✅
- **Staff Access**: Assigned branches only (via GymUserBranch table) ✅
- **Client Access**: Their own profile and assigned branches ✅

### RBAC Implementation Status
- **Global Roles**: SUPER_ADMIN, OWNER, MANAGER, STAFF, CLIENT ✅
- **Business Roles**: GYM_MEMBER, GYM_TRAINER, etc. ✅
- **Branch Assignment**: GymUserBranch table ✅
- **Owner All-Access**: Implemented in RBAC guard ✅
- **Manager Branch Assignment**: Via GymUserBranch ✅
- **Role Conflicts**: Resolved with clean CLIENT role separation ✅

### User Creation Flow
- **Automatic**: `POST /api/v1/gym/members` creates User (CLIENT role) + GymMemberProfile
- **Manual**: `POST /api/v1/gym/users` creates business-agnostic users
- **Role Assignment**: CLIENT global role for all end users, business-specific roles in profiles

### Multi-Role User Support
- **Architecture**: Users can have CLIENT global role + OWNER/MANAGER/STAFF permissions
- **Use Case**: Gym owner who is also a member tracking their own fitness data
- **Implementation**: Single login, separate contexts for admin vs member features
- **No Conflicts**: Clean role separation prevents permission issues

---

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

---

## 🎯 Key Implementation Details

### **Philippine Peso Formatting**
```typescript
// Enhanced currency utilities
formatPHPCompact(1200)    // → ₱1,200
formatPHP(2500.99)        // → ₱2,500.99
formatPHPWithUnits(1500000) // → ₱1.5M
```

### **Membership Plans CRUD**
- **API Endpoints**: `/gym/membership-plans/*`
- **Member Count**: Calculated from `gymMemberSubscription` table + legacy data
- **Validation**: Proper DTO validation with TypeScript types
- **Error Handling**: User-friendly messages with conflict detection

### **Database Schema**
- **Multi-tenant**: All entities scoped by `tenantId`
- **Membership Plans**: JSON benefits storage, proper indexing
- **Subscriptions**: Modern approach with `gymMemberSubscription` table
- **Onboarding Tracking**: `onboardingCompletedAt` and `ownerPasswordChanged` fields on Tenant table
- **Legacy Support**: Backwards compatibility with user `businessData`
- **Migration Strategy**: Using `prisma db push` for development, proper migrations for production MVP

---

## 🚨 Known Issues & Workarounds

### **Build Warnings**
- Multiple ESLint warnings for `any` types (non-critical)
- Unused import warnings (cleanup needed)
- React unescaped entities warnings (minor)

### **Resolved Issues** ✅
- ~~Average price display showing long decimals~~ → **REMOVED**
- ~~Member count showing 0 for all plans~~ → **FIXED**
- ~~Edit modal not opening~~ → **FIXED**
- ~~Currency formatting inconsistencies~~ → **FIXED**
- ~~Backend TypeScript compilation errors~~ → **FIXED**
- ~~Plan creation validation error~~ → **FIXED** (Sep 28, 2025)
- ~~Tenant owner password reset not working~~ → **FIXED** (Sep 28, 2025)
- ~~Role field mismatch in authentication~~ → **FIXED** (Sep 28, 2025)
- ~~Can't see gym members as tenant owner~~ → **FIXED** (Sep 28, 2025)

---

## 🎯 Next Recommended Actions

### **High Priority**
1. **Frontend Onboarding Integration**: Create hooks and UI components for the new onboarding endpoints
2. **Guided Setup Flow**: Implement step-by-step onboarding sequence for new tenant owners
3. **Password Change Tracking**: Hook into auth system to automatically mark `ownerPasswordChanged`

### **Medium Priority**
1. **Fix Build Issues**: Address member-subscriptions page collection error
2. **Review Members Module**: Update with Philippine peso formatting
3. **Type Safety**: Replace `any` types with proper TypeScript interfaces

### **Low Priority**
1. **Code Cleanup**: Remove unused imports and fix ESLint warnings
2. **Testing**: Add unit tests for currency utilities and CRUD operations
3. **Performance**: Optimize member count calculations

### **Planned Features - First-Time Setup**
1. **Setup Modal**: Welcome modal with progress tracking and step-by-step guidance
2. **Route Guards**: Prevent navigation until critical setup steps are completed
3. **Setup Reminders**: 
   - Change temporary password (security critical)
   - Create membership plans (functional requirement)
   - Add first members (optional)
4. **Smart Notifications**: Context-aware messages about missing prerequisites
5. **Setup Progress**: Visual indicators and completion tracking

---

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

---

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

---

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

---

## 📋 Key Credentials for Testing
- **Super Admin**: `admin@creatives-saas.com` / `SuperAdmin123!`
- **Gym Owner (Muscle Mania)**: `owner@muscle-mania.com` / `MuscleManiaOwner123!`
- **Gym Owner (TEST TENANT)**: `quxifyjisi@mailinator.com` / `82lL#9!9xW1*`
- **Gym Manager**: `manager@muscle-mania.com` / `Manager123!`
- **Valid Tenant IDs**:
  - Muscle Mania: `a6e7a7ee-66ee-44c8-8756-181534506ef7`
  - TEST TENANT: `b4c93a9a-3a22-4680-b7c0-7fb20e2a1409`

---

## 📊 Business Metrics
- **User Base**: 149+ seeded users across multiple gym tenants with realistic scenarios
- **Cost Structure**: ₱250/month total (Railway backend + Vercel frontend)
- **Database**: Railway PostgreSQL with business units and subscription tracking
- **Scalability**: Multi-tenant architecture ready for 100+ gym locations
- **Revenue Model**: SaaS subscriptions with paid mode toggle per tenant (₱399/month)
- **Mobile Strategy**: React Native apps (₱1.5M-2.5M setup + ₱150K-200K/month)

---

## 🔄 Development Workflow

### **Current Setup**
- **Frontend**: Runs on port 3000 (User manages `npm run dev`)
- **Backend**: Runs on port 5000 (User manages `npm run start:dev`)
- **Database**: PostgreSQL with Prisma
- **Environment**: Linux (Pop!_OS) development environment
- **Agent Role**: Agent handles builds/testing only, user manages servers

### **🚫 DATABASE MIGRATION RULES**

**CRITICAL: NO MIGRATIONS DURING DEVELOPMENT**
- ✅ **Use `prisma db push` ONLY** for all schema changes during development
- ❌ **DO NOT use migrations** until MVP production launch
- **Reason**: We're rapidly iterating on schema and features
- **Production**: Will create proper migrations once MVP is finalized

```bash
# ✅ CORRECT - Use for development
npx prisma db push

# ❌ WRONG - Don't use until production
npx prisma migrate dev
npx prisma migrate deploy
```

**Schema Change Workflow:**
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Update seeders if schema changes affect seeding
4. Run seeders to maintain updated data
5. Test changes thoroughly
6. Commit to git

### **Port Standards**
- **Frontend**: Always port 3000 (never 3001, 3002, etc.)
- **Backend**: Always port 5000 (never 5001, 5002, etc.)
- **Consistency**: No alternative ports to avoid confusion

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

---

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

### **Testing Checklist**
- ✅ Create new membership plans
- ✅ Edit existing plans with pre-populated data
- ✅ Toggle plan status (activate/deactivate)
- ✅ Delete plans (with conflict detection)
- ✅ Philippine peso display throughout UI
- ✅ Member count accuracy

---

## 📝 Code Standards Applied

- **SOLID Principles**: Applied in service layer design
- **DRY**: Currency utilities reused across components
- **YAGNI**: Removed unnecessary average price feature
- **TypeScript**: Strong typing with proper error handling
- **Philippine Localization**: Consistent ₱ currency formatting

### **Development Standards**
- **Clean Code**: Remove debug console logs from production
- **Error Handling**: Keep proper error logging, remove debugging noise
- **Type Safety**: Avoid `any` types, use proper interfaces
- **React Query**: Proper error handling and loading states
- **Build Quality**: Always ensure frontend and backend build successfully
  - Next.js: `npm run build` for production readiness
  - NestJS: `npm run build` for TypeScript compilation

---

*Last Updated: October 19, 2025 - 14:18 UTC*
*Status: Member-Branch Relationship System Implementation - ✅ BACKEND COMPLETE, 🔄 TESTING PENDING*
*Current Focus: Branch access levels, filtering, transfer functionality, and comprehensive member-branch management*

### **Current Session Progress (Oct 19, 2025) - MAJOR AUTHENTICATION OVERHAUL**

#### ✅ **Comprehensive Authentication & Tenant Validation System - COMPLETED**
**Production-ready authentication with automatic logout and multi-role support**

1. **Enhanced API Client Security** ✅
   - Added comprehensive error handling for 401, 403, 404, and network errors
   - Automatic logout on authentication failures with user-friendly messages
   - Tenant-specific 404 detection (non-existent organizations trigger logout)
   - Cross-tab logout synchronization via localStorage events

2. **Role-Aware Authentication Validation** ✅
   - **SUPER_ADMIN**: Token-only validation (no tenant required)
   - **OWNER**: Token + tenant management access validation
   - **MANAGER/STAFF/CLIENT**: Token + tenant gym access validation
   - Role-specific endpoint validation for comprehensive security

3. **Authentication Manager & Utilities** ✅
   - Centralized `AuthManager` class with comprehensive validation methods
   - Smart error categorization (expired tokens, missing tenants, network issues)
   - Complete auth data cleanup (localStorage, sessionStorage, cookies)
   - Cross-browser tab logout detection and synchronization

4. **React Hooks for Auth Management** ✅
   - `useAuthValidation()` - Comprehensive auth + tenant validation
   - `useTenantValidation()` - Page-level tenant access validation 
   - `useAuthState()` - Auth state monitoring with periodic checks
   - Real-time validation with graceful error handling

5. **Backend Authentication Fixes** ✅
   - **AuthGuard TenantId Fix**: Now properly extracts `tenantId` from User table for OWNER users
   - **Role Field Consistency**: Gym member creation now sets both `role` and `globalRole` fields
   - **Multi-Role Support**: Fixed tenant context issues for all user roles (OWNER, MANAGER, STAFF, CLIENT)

6. **Frontend Cache & UX Improvements** ✅
   - **Membership Plans Cache Fix**: Enhanced cache invalidation with immediate refresh
   - **Branch Assignment System**: Completed multi-branch selection during member creation
   - **Environment Variables Fix**: Added frontend `.env.local` with correct `NEXT_PUBLIC_API_URL`
   - **Login Debugging**: Added comprehensive logging for authentication troubleshooting

#### ✅ **Backend Infrastructure Fixes - COMPLETED**

7. **Database Role Consistency** ✅
   - Fixed existing members with `role: null` by setting proper `role: 'CLIENT'` values
   - Updated gym member creation service to set both role fields consistently
   - Resolved tenant context issues preventing membership plan access

8. **API Endpoint Reliability** ✅
   - Fixed gym membership plans service receiving `null` tenantId
   - Resolved Prisma validation errors for tenant lookups
   - Enhanced error logging and debugging capabilities

#### ✅ **Security & Production Readiness - COMPLETED**

9. **Authentication Flow Security** ✅
   - Disabled bypass authentication for production security
   - Implemented proper JWT token validation
   - Role-based access control with tenant isolation
   - Automatic session cleanup on security violations

10. **Error Handling & User Experience** ✅
    - Context-aware error messages based on failure type
    - Graceful degradation for network issues
    - User-friendly notifications for authentication problems
    - Seamless redirect flow with preserved user context

### **🎯 Previous Session Completed Successfully:**
1. ✅ **Backend Restarted**: CORS and auth fixes applied successfully
2. ✅ **Super Admin Login**: `admin@creatives-saas.com` can now access tenant management
3. ✅ **Tenant Display**: Both "Muscle Mania" and "Fleur Chen" tenants are visible
4. ✅ **Authentication System**: Proper user identification working without bypass

### **🔄 LATEST SESSION PROGRESS (Oct 19, 2025) - Member-Branch Relationship System**

#### ✅ **Backend Schema Implementation - COMPLETED**
1. **BranchAccessLevel Enum** ✅
   - Added `SINGLE_BRANCH`, `MULTI_BRANCH`, `ALL_BRANCHES` access levels
   - Integrated into Prisma schema with proper defaults
   
2. **GymMemberProfile Enhancements** ✅
   - Added `primaryBranchId` field to track member's primary branch assignment
   - Added `accessLevel` field with `ALL_BRANCHES` as default
   - Proper foreign key relationship to Branch table
   
3. **GymMembershipPlan Schema Updates** ✅
   - Added `accessLevel` field to membership plans (defaults to `ALL_BRANCHES`)
   - Updated seeder with proper branch assignments for all members
   - All existing members now have primary branch and access level data

4. **Backend API Updates** ✅
   - Enhanced `UpdateUserDto` to support `primaryBranchId` and `accessLevel` fields
   - Updated user service to handle gym member profile branch updates
   - Fixed tenantId handling in gym member profile creation
   - Branch transfer API functionality ready via `/gym/users/:id` PATCH endpoint

#### ✅ **Frontend UI Implementation - COMPLETED**

5. **Membership Plan Forms** ✅
   - Added BranchAccessLevel field to plan creation/edit modal
   - Disabled field with "View Only" badge as requested
   - Clear messaging about future configurability
   - All three access level options with descriptions
   
6. **Member Cards Enhancement** ✅
   - Added branch display with building icon
   - Shows primary branch name and access level
   - Integrated into existing subscription information section
   - Clean, professional visual design
   
7. **Members Directory Filtering** ✅
   - Added branch filter dropdown with all branches
   - "All Branches" and "No Branch Assigned" options
   - Filter status indicators with branch names
   - Responsive design compatible with existing filters
   
8. **Member Info Modal Enhancement** ✅
   - Added comprehensive Branch Access section
   - Shows primary branch name and access level badge
   - Visual confirmation for "All Branches" access
   - Professional layout with clear information hierarchy
   
9. **Branch Transfer Functionality** ✅
   - Created dedicated `BranchTransferModal` component
   - Visual current → new branch transfer interface
   - Branch selection with names and addresses
   - Complete error handling and loading states
   - Integration with member info modal
   - API integration ready for testing

#### 🔄 **TESTING PENDING**
- **Backend Server**: Port 5000 already in use - needs restart to test new functionality
- **Branch Transfer API**: Backend changes ready but not tested yet
- **Modal Visibility**: BranchAccessLevel field in membership plans may need scroll verification
- **End-to-End Flow**: Complete member-branch relationship workflow testing needed

#### 🎯 **Next Immediate Tasks:**
1. **Restart Backend Server**: Kill process on port 5000 and restart to test branch transfer functionality
2. **Verify BranchAccessLevel Visibility**: Ensure the field appears in membership plan modal (may be scrolled out of view)
3. **Test Branch Transfer**: Complete end-to-end testing of member branch transfers
4. **UI Polish**: Minor adjustments based on testing feedback
5. **Documentation**: Update with final implementation status

#### 📋 **Implementation Summary**
- **Backend**: ✅ Complete schema, API endpoints, validation
- **Frontend**: ✅ Complete UI components, modals, filters, displays
- **Integration**: 🔄 Ready for testing - backend restart required
- **Features**: Branch filtering, transfer functionality, access level display, primary branch tracking

### **🔧 Technical Changes Made This Session:**
- **Backend Auth Guard** (`/src/core/auth/auth.guard.ts`): Added `x-user-email` header lookup
- **Frontend API Client** (`/lib/api/client.ts`): Added user email header to requests
- **Backend CORS** (`/src/main.ts`): Added `x-user-email` to allowed headers
- **Membership Plans Hook** (`/lib/hooks/use-membership-plans.ts`): Fixed double-wrapped response parsing
- **Members Page** (`/app/(main)/members/page.tsx`): Removed problematic role filtering
- **Profile Hook** (`/lib/hooks/use-gym-users.ts`): Updated with correct tenant IDs

### **Previous Achievements (Sep 29, 2025)**
- ✅ **Member UX Enforcement**: Add Member button properly disabled without membership plans
- ✅ **Onboarding Tracking System**: Complete backend API for first-time setup tracking
- ✅ **Database Schema Enhancement**: Added onboarding fields with `prisma db push`
- ✅ **Production Code Cleanup**: Removed debug logs, optimized builds
- ✅ **Toast System Fully Migrated**: Sonner → React-toastify with no crashes
- ✅ **Enhanced Tenant Creation**: Modern modal with copy buttons for credentials
- ✅ **Security Improvements**: Removed console.log exposure, fixed clipboard access
- ✅ **Build Stability**: All TypeScript compilation errors resolved
