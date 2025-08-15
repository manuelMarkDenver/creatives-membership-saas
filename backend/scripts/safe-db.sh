#!/bin/bash

# Safe Database Management Script for Prisma
# This script enforces safe database practices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "prisma/schema.prisma" ]; then
        echo -e "${RED}Error: prisma/schema.prisma not found. Please run this script from the backend directory.${NC}"
        exit 1
    fi
}

# Function to check migration status
check_migration_status() {
    echo -e "${YELLOW}Checking migration status...${NC}"
    
    if ! npx prisma migrate status --schema=prisma/schema.prisma 2>/dev/null; then
        echo -e "${RED}Warning: Migration status check failed. Database might not be accessible.${NC}"
        return 1
    fi
    
    return 0
}

# Function to show help
show_help() {
    echo "Safe Database Management Script"
    echo ""
    echo "Usage: ./safe-db.sh [command]"
    echo ""
    echo "Commands:"
    echo "  status          - Check migration status"
    echo "  migrate         - Create and apply a new migration (SAFE)"
    echo "  deploy          - Deploy pending migrations (PRODUCTION)"
    echo "  reset           - Reset database (DEVELOPMENT ONLY)"
    echo "  seed            - Seed the database"
    echo "  studio          - Open Prisma Studio"
    echo "  generate        - Generate Prisma client"
    echo "  format          - Format schema file"
    echo "  validate        - Validate schema"
    echo "  push            - DANGEROUS: Direct schema push (will ask for confirmation)"
    echo ""
    echo "Safety Rules:"
    echo "  - Always use 'migrate' instead of 'push' for schema changes"
    echo "  - Check 'status' before any database operation"
    echo "  - Use 'deploy' for production migrations"
    echo "  - 'reset' only works in development environment"
}

# Function for safe migration
safe_migrate() {
    echo -e "${YELLOW}Creating a new migration...${NC}"
    
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Migration name is required${NC}"
        echo "Usage: ./safe-db.sh migrate \"migration_name\""
        exit 1
    fi
    
    echo -e "${GREEN}Creating migration: $1${NC}"
    npx prisma migrate dev --name "$1" --schema=prisma/schema.prisma
}

# Function for deployment
safe_deploy() {
    echo -e "${YELLOW}Deploying migrations...${NC}"
    
    # Check if we're in production environment
    if [ "$NODE_ENV" = "production" ]; then
        echo -e "${YELLOW}Production environment detected. Proceeding with caution...${NC}"
    fi
    
    npx prisma migrate deploy --schema=prisma/schema.prisma
    echo -e "${GREEN}Migrations deployed successfully!${NC}"
}

# Function for dangerous db push (with warnings)
dangerous_push() {
    echo -e "${RED}⚠️  WARNING: You are about to use 'prisma db push'${NC}"
    echo -e "${RED}This operation:${NC}"
    echo -e "${RED}  - Bypasses migration history${NC}"
    echo -e "${RED}  - Can cause data loss${NC}"
    echo -e "${RED}  - Cannot be easily rolled back${NC}"
    echo -e "${RED}  - Should NOT be used in production${NC}"
    echo ""
    echo -e "${YELLOW}Recommended: Use './safe-db.sh migrate \"migration_name\"' instead${NC}"
    echo ""
    
    # Check if there are pending migrations
    if check_migration_status; then
        echo -e "${RED}⚠️  WARNING: You have pending migrations!${NC}"
        echo -e "${RED}You should run './safe-db.sh deploy' instead${NC}"
        echo ""
    fi
    
    read -p "Are you absolutely sure you want to proceed with db push? (type 'YES' to confirm): " confirm
    
    if [ "$confirm" != "YES" ]; then
        echo -e "${GREEN}Operation cancelled. Good choice!${NC}"
        exit 0
    fi
    
    echo -e "${RED}Proceeding with db push...${NC}"
    npx prisma db push --schema=prisma/schema.prisma
}

# Function for development reset
dev_reset() {
    if [ "$NODE_ENV" = "production" ]; then
        echo -e "${RED}Error: Database reset is not allowed in production environment${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  This will delete all data and reset the database${NC}"
    read -p "Are you sure? (y/N): " confirm
    
    if [ "$confirm" != "y" ]; then
        echo -e "${GREEN}Operation cancelled${NC}"
        exit 0
    fi
    
    npx prisma migrate reset --schema=prisma/schema.prisma
}

# Main script logic
check_directory

case "$1" in
    "status")
        check_migration_status
        ;;
    "migrate")
        safe_migrate "$2"
        ;;
    "deploy")
        safe_deploy
        ;;
    "reset")
        dev_reset
        ;;
    "seed")
        npx prisma db seed --schema=prisma/schema.prisma
        ;;
    "studio")
        npx prisma studio --schema=prisma/schema.prisma
        ;;
    "generate")
        npx prisma generate --schema=prisma/schema.prisma
        ;;
    "format")
        npx prisma format --schema=prisma/schema.prisma
        ;;
    "validate")
        npx prisma validate --schema=prisma/schema.prisma
        ;;
    "push")
        dangerous_push
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
