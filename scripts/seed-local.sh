#!/bin/bash

# Script to run database seeding for local development
# This uses the HOST_DATABASE_URL for connecting from the host machine

echo "🌱 Running database seeding for local development..."
echo "📡 Using local PostgreSQL on port 5432"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec creatives-saas-postgres-dev pg_isready -U postgres -d creatives_saas_dev; do
  echo "🔄 Waiting for database..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Export the host database URL temporarily
export DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5432/creatives_saas_dev"
export DIRECT_URL="postgresql://postgres:dev_password_123@localhost:5432/creatives_saas_dev"

# Run the seed script
cd backend && npx ts-node prisma/seed.ts

echo "🎉 Seeding completed!"
