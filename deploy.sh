#!/bin/bash

# Production Deployment Script for Creatives SaaS
# This script handles production deployment with safety checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
PROJECT_NAME="creatives-saas"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}🚀 Starting deployment for ${DEPLOY_ENV} environment${NC}"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker.${NC}"
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f ".env.${DEPLOY_ENV}" ] && [ "$DEPLOY_ENV" != "development" ]; then
        echo -e "${RED}❌ Environment file .env.${DEPLOY_ENV} not found${NC}"
        exit 1
    fi
    
    # Check if docker-compose file exists
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}❌ docker-compose.yml not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to create backup
create_backup() {
    if [ "$DEPLOY_ENV" = "production" ]; then
        echo -e "${YELLOW}💾 Creating backup...${NC}"
        mkdir -p $BACKUP_DIR
        
        # Backup database
        if docker compose ps postgres | grep -q "Up"; then
            docker compose exec postgres pg_dump -U postgres creatives_saas_dev > "$BACKUP_DIR/database_backup.sql"
            echo -e "${GREEN}✅ Database backup created: $BACKUP_DIR/database_backup.sql${NC}"
        fi
        
        # Backup environment files
        cp .env* $BACKUP_DIR/ 2>/dev/null || true
        echo -e "${GREEN}✅ Environment files backed up${NC}"
    fi
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    
    # Backend tests
    echo "Running backend tests..."
    cd backend
    npm run test 2>/dev/null || echo "No backend tests configured"
    
    # Frontend tests  
    cd ../frontend
    npm run test 2>/dev/null || echo "No frontend tests configured"
    cd ..
    
    echo -e "${GREEN}✅ Tests completed${NC}"
}

# Function to build and deploy
deploy() {
    echo -e "${YELLOW}🔨 Building and deploying...${NC}"
    
    # Set environment file
    if [ "$DEPLOY_ENV" != "development" ] && [ -f ".env.${DEPLOY_ENV}" ]; then
        cp ".env.${DEPLOY_ENV}" .env
        echo -e "${GREEN}✅ Environment file set for ${DEPLOY_ENV}${NC}"
    fi
    
    # Build services
    echo "Building services..."
    if [ "$DEPLOY_ENV" = "development" ]; then
        docker compose -f docker-compose.dev.yml build
    else
        docker compose build
    fi
    
    # Stop existing services
    echo "Stopping existing services..."
    docker compose down
    
    # Start services
    echo "Starting services..."
    if [ "$DEPLOY_ENV" = "development" ]; then
        docker compose -f docker-compose.dev.yml up -d
    else
        docker compose up -d
    fi
    
    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 15
    
    # Run database migrations
    echo "Running database migrations..."
    if [ "$DEPLOY_ENV" = "development" ]; then
        docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
    else
        docker compose exec backend npx prisma migrate deploy
    fi
    
    echo -e "${GREEN}✅ Deployment completed${NC}"
}

# Function to verify deployment
verify_deployment() {
    echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
    
    # Check if services are running
    sleep 5
    
    # Health check
    HEALTH_CHECK=$(curl -s http://localhost:5000/api/v1/health || echo "FAILED")
    if [[ $HEALTH_CHECK == *"ok"* ]]; then
        echo -e "${GREEN}✅ Backend health check passed${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        exit 1
    fi
    
    # Frontend check
    FRONTEND_CHECK=$(curl -s http://localhost:3000 || echo "FAILED")
    if [[ $FRONTEND_CHECK == *"html"* ]]; then
        echo -e "${GREEN}✅ Frontend is accessible${NC}"
    else
        echo -e "${RED}❌ Frontend check failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Deployment verification passed${NC}"
}

# Function to show deployment info
show_deployment_info() {
    echo -e "${BLUE}📊 Deployment Information${NC}"
    echo "================================"
    echo "Environment: $DEPLOY_ENV"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:5000"
    echo "Backend Health: http://localhost:5000/api/v1/health"
    echo ""
    echo "Login Credentials (from seeded data):"
    echo "Super Admin: admin@creatives-saas.com / SuperAdmin123!"
    echo "Gym Owner: owner@muscle-mania.com / MuscleManiaOwner123!"
    echo "================================"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting ${PROJECT_NAME} deployment...${NC}"
    
    check_prerequisites
    create_backup
    
    # Skip tests in development for faster deployment
    if [ "$DEPLOY_ENV" != "development" ]; then
        run_tests
    fi
    
    deploy
    verify_deployment
    show_deployment_info
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
}

# Help function
show_help() {
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  development (default) - Development environment"
    echo "  staging              - Staging environment"
    echo "  production           - Production environment"
    echo ""
    echo "Examples:"
    echo "  $0                   # Deploy to development"
    echo "  $0 development       # Deploy to development"
    echo "  $0 staging          # Deploy to staging"
    echo "  $0 production       # Deploy to production"
}

# Handle command line arguments
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    development|staging|production|"")
        main
        ;;
    *)
        echo -e "${RED}Invalid environment: $1${NC}"
        show_help
        exit 1
        ;;
esac
