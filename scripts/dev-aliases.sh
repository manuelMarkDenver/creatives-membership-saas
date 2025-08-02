#!/bin/bash

# Quick development aliases for Creatives SaaS
# Source this file in your shell profile or run: source ./scripts/dev-aliases.sh

# Change to the project directory
PROJECT_ROOT="/home/mhackeedev/_apps/creatives-saas"

# Docker commands
alias csaas-start="$PROJECT_ROOT/scripts/docker-dev.sh start"
alias csaas-dev="$PROJECT_ROOT/scripts/docker-dev.sh dev"
alias csaas-stop="$PROJECT_ROOT/scripts/docker-dev.sh stop"
alias csaas-logs="$PROJECT_ROOT/scripts/docker-dev.sh logs"
alias csaas-status="$PROJECT_ROOT/scripts/docker-dev.sh status"

# Project navigation
alias csaas="cd $PROJECT_ROOT"
alias csaas-backend="cd $PROJECT_ROOT/backend"
alias csaas-frontend="cd $PROJECT_ROOT/frontend"

# Quick commands
alias csaas-shell="$PROJECT_ROOT/scripts/docker-dev.sh shell"
alias csaas-migrate="$PROJECT_ROOT/scripts/docker-dev.sh migrate"

echo "🚀 Creatives SaaS aliases loaded!"
echo ""
echo "Quick commands:"
echo "  csaas-start   - Start development environment (fast)"
echo "  csaas-dev     - Start with rebuild (first time)" 
echo "  csaas-stop    - Stop all containers"
echo "  csaas-logs    - View logs"
echo "  csaas-status  - Check container status"
echo ""
echo "Navigation:"
echo "  csaas         - Go to project root"
echo "  csaas-backend - Go to backend directory"
echo "  csaas-frontend- Go to frontend directory"
