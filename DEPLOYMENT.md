# Deployment Guide

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
