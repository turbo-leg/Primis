#!/bin/bash

echo "🚀 Setting up database-driven schedule system..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Apply database migrations
echo "🗄️ Applying database migrations..."
npx prisma migrate dev --name "enhanced_schedule"

# Seed the database with sample data
echo "🌱 Seeding database with sample data..."
npm run seed

echo "✅ Schedule system setup complete!"
echo ""
echo "📅 Features added:"
echo "   • Database-driven class schedules"
echo "   • Assignment due dates on calendar"
echo "   • Color-coded events (blue for classes, red for assignments)"
echo "   • Comprehensive course and assignment data"
echo ""
echo "🌐 Visit http://localhost:3000/schedule to view the calendar"