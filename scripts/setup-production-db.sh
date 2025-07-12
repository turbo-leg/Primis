#!/bin/bash

# Production database migration script
# Run this after setting up your PostgreSQL database

echo "🔄 Applying database migrations..."
npx prisma migrate deploy

echo "📊 Generating Prisma client..."
npx prisma generate

echo "🌱 Seeding database with sample data..."
npm run db:seed

echo "✅ Database setup complete!"
