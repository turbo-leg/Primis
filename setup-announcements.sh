#!/bin/bash

echo "Setting up announcements database..."

# Generate Prisma client with new schema
echo "Generating Prisma client..."
npx prisma generate

# Apply database migrations
echo "Applying database migrations..."
npx prisma migrate deploy

# Run seed script to populate with sample data
echo "Running database seed..."
npm run seed

echo "Database setup complete!"
echo "Announcements are now fully database-driven."