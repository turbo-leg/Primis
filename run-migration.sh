echo "🔄 Regenerating Prisma client and fixing database..."

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database
npx prisma db seed

echo "✅ Database migration completed successfully!"