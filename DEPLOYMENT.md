# Deployment Guide

## Quick Fix for "Table does not exist" Error

If you're getting the error `The table 'public.User' does not exist`, follow these steps:

1. **Run this command locally with your production database URL:**
   ```bash
   export DATABASE_URL="postgres://b42488a47caa0312027854de6855e887a1fb5f004dcf758f128a4ac6e41c40a6:sk_JX-J3bCnDFJYAtzVzCpk9@db.prisma.io:5432/?sslmode=require"
   npx prisma migrate deploy
   npm run db:seed
   ```

2. **Or use the setup script:**
   ```bash
   chmod +x scripts/setup-production-db.sh
   ./scripts/setup-production-db.sh "postgres://b42488a47caa0312027854de6855e887a1fb5f004dcf758f128a4ac6e41c40a6:sk_JX-J3bCnDFJYAtzVzCpk9@db.prisma.io:5432/?sslmode=require"
   ```

---

## Setting up Database for Vercel Deployment

Since Vercel uses serverless functions with read-only file systems, SQLite databases don't work in production. You need to use a cloud database.

### Option 1: Vercel Postgres (Recommended)

1. **Add Vercel Postgres to your project:**
   - Go to your Vercel project dashboard
   - Navigate to the "Storage" tab
   - Click "Create" and select "Postgres"
   - Follow the setup instructions

2. **Vercel will automatically add these environment variables:**
   ```
   POSTGRES_URL
   POSTGRES_PRISMA_URL  # This is what you should use for DATABASE_URL
   POSTGRES_URL_NON_POOLING
   ```

3. **Update your Vercel environment variables:**
   - Set `DATABASE_URL` to the value of `POSTGRES_PRISMA_URL`
   - Make sure `NEXTAUTH_SECRET` is set to a secure random string
   - Set `NEXTAUTH_URL` to your production domain (e.g., `https://yourapp.vercel.app`)

### Option 2: External PostgreSQL (Alternative)

You can also use services like:
- **Supabase** (free tier available)
- **Railway** (free tier available)
- **PlanetScale** (MySQL, requires schema changes)
- **Neon** (PostgreSQL, free tier available)

## Migration Steps

1. **Reset the database (if needed):**
   ```bash
   npx prisma migrate reset
   ```

2. **Create and apply migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Seed the database:**
   ```bash
   npm run db:seed
   ```

## Local Development

For local development, you can continue using SQLite by creating a `.env.local` file:

```bash
# For local development with SQLite
DATABASE_URL="file:./dev.db"

# Other environment variables...
NEXTAUTH_SECRET="your-local-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Environment Variables Checklist

Make sure these are set in your Vercel project:

- ✅ `DATABASE_URL` - Your PostgreSQL connection string
- ✅ `NEXTAUTH_SECRET` - Random secret key for NextAuth
- ✅ `NEXTAUTH_URL` - Your production domain
- ⚪ `CLOUDINARY_CLOUD_NAME` - (Optional) For file uploads
- ⚪ `CLOUDINARY_API_KEY` - (Optional) For file uploads  
- ⚪ `CLOUDINARY_API_SECRET` - (Optional) For file uploads

## Fixing Vercel Environment Variables

If Vercel created environment variables with `Db_` prefix (like `Db_DATABASE_URL`), you need to create new variables with the correct names:

### Steps to Fix Environment Variables:

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add these new environment variables:**

   ```
   DATABASE_URL = [copy the value from Db_PRISMA_DATABASE_URL]
   NEXTAUTH_SECRET = [generate a secure random string]
   NEXTAUTH_URL = [your production domain, e.g., https://yourapp.vercel.app]
   ```

4. **Generate a secure NEXTAUTH_SECRET:**
   You can generate one using this command locally:
   ```bash
   openssl rand -base64 32
   ```
   Or use an online generator like: https://generate-secret.vercel.app/32

5. **Delete the old variables with `Db_` prefix (optional but recommended for cleanliness)**

### Example Environment Variables Setup:
```
DATABASE_URL = postgresql://username:password@host:5432/database?sslmode=require
NEXTAUTH_SECRET = HO9OHqy9MXLoRyxblEVNZkC3lwixbEysbeai8qMT23hX2nrHHtB0QXvjZoY=
NEXTAUTH_URL = https://yourapp.vercel.app
```

### After Setting Environment Variables:

1. **Redeploy your application** (Vercel will automatically redeploy when you change environment variables)
2. **Run database migrations** by adding a script or running them manually

## Troubleshooting

### Database Tables Don't Exist Error
If you get an error like "The table `public.User` does not exist", you need to run database migrations:

**Option 1: Run migrations locally (Recommended)**
```bash
# Set your production DATABASE_URL temporarily
export DATABASE_URL="postgres://your-database-url-here"

# Deploy migrations to create tables
npx prisma migrate deploy

# Seed the database with sample data
npm run db:seed
```

**Option 2: Use the setup script**
```bash
# Make the script executable
chmod +x scripts/setup-production-db.sh

# Run the setup script with your database URL
./scripts/setup-production-db.sh "postgres://your-database-url-here"
```

**Option 3: Use Prisma Studio (Visual Editor)**
```bash
# Set your production database URL
export DATABASE_URL="postgres://b42488a47caa0312027854de6855e887a1fb5f004dcf758f128a4ac6e41c40a6:sk_JX-J3bCnDFJYAtzVzCpk9@db.prisma.io:5432/?sslmode=require"

# Open Prisma Studio to manage your database visually
npx prisma studio
```
This will open a web interface where you can:
- View your database schema
- Create tables manually
- Add sample data through the UI
- Browse and edit existing data

**Option 4: Prisma DB Push (Quick Setup)**
```bash
# Set your production database URL
export DATABASE_URL="postgres://b42488a47caa0312027854de6855e887a1fb5f004dcf758f128a4ac6e41c40a6:sk_JX-J3bCnDFJYAtzVzCpk9@db.prisma.io:5432/?sslmode=require"

# Push your schema directly to the database (creates tables)
npx prisma db push

# Seed the database with sample data
npm run db:seed
```

**Option 5: Reset and Recreate Everything**
```bash
# Set your production database URL
export DATABASE_URL="postgres://b42488a47caa0312027854de6855e887a1fb5f004dcf758f128a4ac6e41c40a6:sk_JX-J3bCnDFJYAtzVzCpk9@db.prisma.io:5432/?sslmode=require"

# Reset the database and apply schema
npx prisma migrate reset --force

# This will recreate all tables and run the seed automatically
```

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly set in Vercel environment variables
- Check that the database server is accessible from Vercel's region
- Verify the connection string format

### Migration Issues
- Run migrations manually if they don't auto-apply:
  ```bash
  npx prisma migrate deploy
  ```

### Build Issues
- Ensure `prisma generate` runs during build (already configured in package.json)
- Check Vercel build logs for specific error messages
