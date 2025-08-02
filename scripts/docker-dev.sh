#!/bin/bash

# Docker Development Scripts for Creatives SaaS (Including Frontend)

set -e

# Change to project root directory
cd "$(dirname "$0")/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Development mode (with hot reload and rebuild)
dev() {
    echo_info "Starting development environment with hot reload and rebuild..."
    check_docker
    
    # Stop any existing containers
    docker compose -f docker-compose.yml -f docker-compose.dev.yml down
    
    # Start development services with rebuild
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
    
    echo_success "Development environment started!"
    echo_info "Frontend: http://localhost:3000"
    echo_info "Backend: http://localhost:5000"
    echo_info "Redis: localhost:6380"
    echo_info "View logs: ./scripts/docker-dev.sh logs"
}

# Start development mode (hot reload without rebuild)
start() {
    echo_info "Starting development environment (hot reload, no rebuild)..."
    check_docker
    
    # Start development services without rebuild
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    
    echo_success "Development environment started!"
    echo_info "Frontend: http://localhost:3000"
    echo_info "Backend: http://localhost:5000"
    echo_info "Redis: localhost:6380"
    echo_info "View logs: ./scripts/docker-dev.sh logs"
    echo_info "💡 Use 'dev' command if you need to rebuild containers"
}

# Production mode
prod() {
    echo_info "Starting production environment..."
    check_docker
    
    # Stop any existing containers
    docker compose down
    
    # Start production services
    docker compose up --build -d
    
    echo_success "Production environment started!"
    echo_info "Frontend: http://localhost:3000"
    echo_info "Backend: http://localhost:5000"
    echo_info "Redis: localhost:6380"
    echo_info "Note: For nginx proxy, use: docker compose --profile production up"
}

# Frontend only (useful for frontend development)
frontend_only() {
    echo_info "Starting frontend service only..."
    check_docker
    
    docker compose up frontend --build -d
    
    echo_success "Frontend service started!"
    echo_info "Frontend: http://localhost:3000"
}

# Backend only (useful for frontend development)
backend_only() {
    echo_info "Starting backend service only..."
    check_docker
    
    docker compose up backend --build -d
    
    echo_success "Backend service started!"
    echo_info "Backend: http://localhost:5000"
}

# View logs
logs() {
    if [ -z "$2" ]; then
        echo_info "Showing logs for all services..."
        docker compose logs -f
    else
        echo_info "Showing logs for $2..."
        docker compose logs -f "$2"
    fi
}

# Stop all services
stop() {
    echo_info "Stopping all services..."
    docker compose down
    docker compose --profile production down
    echo_success "All services stopped!"
}

# Clean up (remove containers, networks, volumes)
clean() {
    echo_warn "This will remove all containers, networks, and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo_info "Cleaning up..."
        docker compose down -v --remove-orphans
        docker compose --profile production down -v --remove-orphans
        docker system prune -f
        echo_success "Cleanup complete!"
    else
        echo_info "Cleanup cancelled."
    fi
}

# Run database migrations
migrate() {
    echo_info "Running database migrations..."
    docker compose exec backend npx prisma migrate deploy
    docker compose exec backend npx prisma generate
    echo_success "Migrations complete!"
}

# Run API tests
test() {
    echo_info "Running API tests..."
    docker compose exec backend npm run test:api
}

# Shell into backend container
shell() {
    echo_info "Opening shell in backend container..."
    docker compose exec backend sh
}

# Show container status
status() {
    echo_info "Container status:"
    docker compose ps
}

# Show help
help() {
    echo_info "Docker Development Scripts for Creatives SaaS"
    echo ""
    echo "Usage: ./scripts/docker-dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start         🚀 Start development environment (hot reload, no rebuild)"
    echo "  dev           🔨 Start development environment (hot reload + rebuild)"
    echo "  prod          🌟 Start production environment (with nginx)"
    echo "  frontend-only Start frontend service only"
    echo "  backend-only  Start backend service only"
    echo "  logs [service] Show logs (all services or specific service)"
    echo "  stop          Stop all services"
    echo "  clean         Remove all containers, networks, and volumes"
    echo "  migrate       Run database migrations"
    echo "  test          Run API tests"
    echo "  shell         Open shell in backend container"
    echo "  status        Show container status"
    echo "  help          Show this help message"
    echo ""
    echo "💡 Quick Start:"
    echo "  First time:     ./scripts/docker-dev.sh dev     (builds containers)"
    echo "  Regular use:    ./scripts/docker-dev.sh start   (fast startup)"
    echo ""
    echo "Examples:"
    echo "  ./scripts/docker-dev.sh start        # Quick start without rebuild"
    echo "  ./scripts/docker-dev.sh dev          # Full rebuild + start"
    echo "  ./scripts/docker-dev.sh logs backend # View backend logs"
    echo "  ./scripts/docker-dev.sh status       # Check running containers"
}

# Main command dispatcher
case "${1:-help}" in
    start)
        start
        ;;
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    frontend-only)
        frontend_only
        ;;
    backend-only)
        backend_only
        ;;
    logs)
        logs "$@"
        ;;
    stop)
        stop
        ;;
    clean)
        clean
        ;;
    migrate)
        migrate
        ;;
    test)
        test
        ;;
    shell)
        shell
        ;;
    status)
        status
        ;;
    help|*)
        help
        ;;
esac
