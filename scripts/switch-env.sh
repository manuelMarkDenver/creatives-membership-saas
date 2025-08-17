#!/bin/bash

# Environment Switcher Script
# Usage: ./scripts/switch-env.sh [local|prod]

ENV=${1:-"local"}

if [ "$ENV" = "local" ]; then
    echo "🔄 Switching to LOCAL development environment..."
    cp .env.local .env
    echo "✅ Copied .env.local to .env"
    echo "📋 To start development:"
    echo "   # 1. Start PostgreSQL in Docker:"
    echo "   docker compose -f docker-compose.dev.yml up -d postgres"
    echo "   # 2. Start Backend (in new terminal):"
    echo "   cd backend && npm run start:dev"
    echo "   # 3. Start Frontend (in another terminal):"
    echo "   cd frontend && npm run dev"
    echo "📋 To run seeds:"
    echo "   ./scripts/seed-local.sh"
    echo "📋 Ports:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend: http://localhost:5000/api/v1"
    echo "   PostgreSQL: localhost:5432"
elif [ "$ENV" = "prod" ]; then
    echo "🔄 Switching to PRODUCTION environment..."
    cp .env.prod .env
    echo "✅ Copied .env.prod to .env"
    echo "📋 To start production:"
    echo "   docker compose up -d"
    echo "📋 To run seeds (with prod DB):"
    echo "   DATABASE_URL=\"postgresql://postgres:secure_prod_password_123@localhost:5432/creatives_saas_prod\" npm run --prefix backend seed"
else
    echo "❌ Invalid environment. Use 'local' or 'prod'"
    echo "Usage: ./scripts/switch-env.sh [local|prod]"
    exit 1
fi

echo ""
echo "🔍 Current .env file contents:"
head -10 .env
