#!/bin/bash

# Development Start Script
# This script starts the development environment

echo "🚀 Starting CreativeCore Development Environment"
echo ""

# Make sure we're in local development mode
./scripts/switch-env.sh local

echo ""
echo "🐘 Starting PostgreSQL database..."
docker compose -f docker-compose.dev.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3
until docker exec creatives-saas-postgres-dev pg_isready -U postgres -d creatives_saas_dev > /dev/null 2>&1; do
  echo "🔄 Waiting for database..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

echo ""
echo "🎯 Development environment is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Open a new terminal and run: cd backend && npm run start:dev"
echo "2. Open another terminal and run: cd frontend && npm run dev"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000/api/v1"
echo "   Database: postgresql://postgres:dev_password_123@localhost:5432/creatives_saas_dev"
echo ""
echo "🎮 Login Credentials:"
echo "   Super Admin: admin@creatives-saas.com / SuperAdmin123!"
echo "   Owner (Muscle Mania): owner@muscle-mania.com / MuscleManiaOwner123!"
echo ""
