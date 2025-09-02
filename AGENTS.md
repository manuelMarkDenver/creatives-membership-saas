# Agent Guidelines for Creatives SaaS

## Project Overview
**Multi-Business SaaS Platform** supporting gyms → coffee shops → e-commerce
- **Current Focus**: Gym membership management MVP
- **Architecture**: Business units model for multi-location scalability
- **Business Model**: Per-branch billing with free trial (1 branch for 4 weeks)
- **Mobile Strategy**: Premium React Native apps ($20K setup + $2K/month)

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
- **Build**: `cd frontend && npm run build` (uses NODE_ENV=production for SSR compatibility)
- **Lint**: `cd frontend && npm run lint`
- **Dev server**: `cd frontend && npm run dev`

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
- **Backend**: Railway.com ($5/month) - NestJS + PostgreSQL
- **Frontend**: Vercel.com (free) - Next.js with production optimizations
- **Database**: Railway PostgreSQL with 149+ seeded users
- **File Storage**: Supabase Storage for member photos
- **Total Cost**: $5/month (bootstrap-friendly)

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
- **State**: Zustand for global state, React Query for server state
- **UI**: Radix UI components
- **Forms**: React Hook Form with Zod validation
- **Types**: Strict TypeScript configuration
- **Performance**: Zustand stores to eliminate re-render loops
- **SSR Compatibility**: Client components for third-party libraries (react-toastify)

### General
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier (single quotes, trailing commas)
- **No comments**: Avoid adding comments unless explicitly requested
- **Security**: Never expose secrets, use environment variables
- **API Structure**: Business-specific endpoints (`/api/v1/gym/*`, `/api/v1/business-units/*`)

## Key Architecture Patterns

### Authentication & Authorization
- **JWT-based authentication** with comprehensive RBAC
- **Roles**: Super Admin → Owner → Manager → Staff
- **Guards**: Route-level protection with automatic redirects
- **Session Management**: Automatic cleanup of expired tokens
- **Branch Access**: Role-based member management per assigned branches

### State Management
- **Zustand Stores**: Business units, gym subscriptions, API caching
- **React Query**: Server state management with optimistic updates
- **Performance**: Eliminated re-render loops through efficient caching
- **Real-time Updates**: Query invalidation for immediate UI refresh

### Database Design
- **Business Units Model**: Scalable multi-location architecture
- **Semantic Naming**: GymMemberSubscription (not generic CustomerSubscription)
- **Migration Strategy**: Clean schema with comprehensive seeding
- **Data Consistency**: Single source of truth eliminating count discrepancies

## Current System Status

### ✅ MVP Launch Ready Features
- **Members CRUD**: Create, read, update, delete, restore with photo upload
- **Subscription Management**: Renew, cancel, track with status updates
- **Search & Filtering**: Full-text search with status-based filtering
- **Mobile Optimization**: Responsive design across all devices
- **Authentication Security**: Enterprise-level with role-based access
- **Production Deployment**: Railway + Vercel with monitoring
- **Build System**: Clean production builds with SSR compatibility

### 🔧 Technical Achievements
- **API Migration**: Complete overhaul from generic to gym-specific endpoints
- **Performance Optimization**: Zustand stores eliminating re-render loops
- **Database Migration**: Supabase → Railway PostgreSQL for reliability
- **Responsive Design**: Fixed horizontal scrolling and mobile optimization
- **Authentication Guards**: Comprehensive middleware and route protection
- **Build System**: Production-ready builds with NODE_ENV=production for SSR compatibility
- **SSR Compatibility**: Client components for third-party libraries (react-toastify)

### 📊 Business Metrics
- **User Base**: 149+ seeded users with realistic gym scenarios
- **Cost Structure**: $5/month total infrastructure (Railway + Vercel)
- **Mobile Strategy**: Premium React Native apps for additional revenue
- **Scalability**: Business units model ready for multi-location expansion

## Development Workflow

### Git Strategy
- **Branching**: Feature branches with descriptive names
- **Commits**: Detailed messages explaining changes and impact
- **Code Review**: TypeScript strict checking and ESLint validation
- **Deployment**: Automated Railway/Vercel deployments on push

### Environment Management
- **Development**: Host-based with Docker PostgreSQL
- **Production**: Railway PostgreSQL with internal connectivity
- **Configuration**: Environment variables for all sensitive data
- **Seeding**: Automated database seeding with realistic test data
- **Build Environment**: NODE_ENV=production required for SSR compatibility

### Performance Optimization
- **Frontend**: Zustand stores and React Query caching
- **Backend**: Efficient Prisma queries with proper indexing
- **Database**: Optimized schema with semantic naming
- **Mobile**: Touch-friendly interfaces with responsive design

## Project Vision & Roadmap

### Phase 1: Foundation (Current) ✅
- Database connection and API stability
- Performance optimization and state management
- Production deployment and monitoring
- Build system stability with SSR compatibility

### Phase 2: Multi-Business Foundation
- Coffee shop module development
- Cross-business analytics and reporting
- Unified dashboard and business switching

### Phase 3: Platform Expansion
- E-commerce module integration
- Advanced mobile app features
- AWS migration for enterprise scalability

### Phase 4: Enterprise Features
- Advanced RBAC with granular permissions
- Multi-tenant analytics and insights
- Advanced reporting and business intelligence

This comprehensive AGENTS.md provides complete context for any agent working on the Creatives SaaS platform, ensuring consistent development practices and understanding of the system's architecture, business model, and current status.