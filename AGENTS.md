# Agent Guidelines for Creatives SaaS

## Project Overview
**Multi-Business SaaS Platform** supporting gyms → coffee shops → e-commerce
- **Current Status**: Phase 1 Complete - Business Units & Performance Optimization ✅
- **Architecture**: Multi-tenant with business units for scalability
- **Business Model**: SaaS subscriptions with paid mode toggle per tenant
- **Current Focus**: Gym MVP polish and production deployment
- **Mobile Strategy**: React Native apps ($15K-25K setup + $1.5K-2K/month)

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

### Production Infrastructure
- **Backend**: Railway.com ($5/month) - NestJS + PostgreSQL (149+ seeded users)
- **Frontend**: Vercel.com (free) - Next.js with SSR compatibility
- **Database**: Railway PostgreSQL with business units and gym subscriptions
- **File Storage**: Supabase Storage for member photos
- **Total Cost**: $5/month (bootstrap-friendly)
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
- **Roles**: Super Admin → Owner → Manager → Staff
- **Guards**: Route-level protection with automatic redirects
- **Session Management**: Automatic cleanup of expired tokens
- **Branch Access**: Role-based member management per assigned branches

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
- **Data Consistency**: Single source of truth with proper foreign key relationships
- **Paid Mode Toggle**: Subscription enforcement per tenant with trial management

## Current System Status

### ✅ Phase 1 Complete - Business Units & Performance Optimization
- **Business Units CRUD**: Complete multi-location management with paid mode toggle
- **Gym Subscriptions API**: Renewal, cancellation, transaction history, statistics
- **Performance Optimization**: < 3 re-renders per operation (eliminated 20+ loops)
- **State Management**: Zustand stores with React Query integration
- **Authentication Security**: JWT with comprehensive RBAC (5 user roles)
- **Production Deployment**: Railway backend + Vercel frontend ($5/month total)
- **Database**: 149+ seeded users with realistic gym membership scenarios
- **API Architecture**: Business-specific endpoints (`/api/v1/gym/*`, `/api/v1/business-units/*`)

### 🔧 Technical Achievements
- **Business Units Architecture**: Complete multi-tenant business unit management
- **Performance Optimization**: Reduced re-renders from 20+ to < 3 per operation
- **Gym-Specific APIs**: Complete overhaul to business-centric endpoints
- **State Management**: Efficient Zustand stores with React Query integration
- **Database Schema**: Multi-tenant with proper foreign key relationships
- **Production Deployment**: Railway + Vercel with automated CI/CD
- **Authentication System**: Enterprise-level RBAC with 5 user roles
- **SSR Compatibility**: Client components for third-party libraries
- **Data Seeding**: 149+ realistic users with comprehensive test scenarios

### 📊 Business Metrics
- **User Base**: 149+ seeded users across multiple gym tenants with realistic scenarios
- **Cost Structure**: $5/month total (Railway backend + Vercel frontend)
- **Database**: Railway PostgreSQL with business units and subscription tracking
- **Scalability**: Multi-tenant architecture ready for 100+ gym locations
- **Revenue Model**: SaaS subscriptions with paid mode toggle per tenant
- **Mobile Strategy**: React Native apps ($15K-25K setup + $1.5K-2K/month)

## Development Workflow

### Git Strategy
- **Branching**: Feature branches with descriptive names
- **Commits**: Detailed messages with file changes and impact
- **Code Review**: TypeScript compilation and functionality testing
- **Deployment**: Automated Railway/Vercel deployments on main branch push

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

This comprehensive AGENTS.md provides complete context for any agent working on the Creatives SaaS platform, ensuring consistent development practices and understanding of the current Phase 1 completion status, Phase 2 roadmap, and multi-business architecture foundation.