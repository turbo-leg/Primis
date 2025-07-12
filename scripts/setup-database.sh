#!/bin/bash

# Database setup script for production
echo "🔄 Setting up database..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Deploy migrations
echo "🚀 Deploying migrations..."
npx prisma migrate deploy

# Seed the database (optional - comment out if not needed)
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Database setup complete!"
