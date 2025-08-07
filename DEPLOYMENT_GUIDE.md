# Production Deployment Guide - Vercel

## Phase 1: Database Migration to Vercel Postgres

### Step 1: Create Vercel Postgres Database

1. **Login to Vercel Dashboard**
   ```bash
   npx vercel login
   ```

2. **Create Vercel Postgres Database**
   - Go to Vercel Dashboard > Storage > Create Database
   - Choose "Postgres"
   - Name: `perdami-store-production`
   - Region: Select closest to your users

3. **Get Database Connection String**
   - Copy the `DATABASE_URL` from Vercel dashboard
   - Format: `postgresql://username:password@host:port/database?sslmode=require`

### Step 2: Export Current Data

```bash
# Export current database
pg_dump perdami_store_db_dev > backup_before_migration.sql

# Export data only (without schema for clean migration)
pg_dump --data-only --inserts perdami_store_db_dev > data_backup.sql
```

### Step 3: Configure Production Environment

Create `.env.production` file:
```env
# Database
DATABASE_URL="your_vercel_postgres_url"

# Auth
NEXTAUTH_SECRET="your_production_secret"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Cloudinary (for file storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 4: Run Production Migrations

```bash
# Set production database URL temporarily
export DATABASE_URL="your_vercel_postgres_url"

# Generate and apply migrations
npx prisma migrate deploy

# Generate Prisma client for production
npx prisma generate
```

### Step 5: Seed Production Database

```bash
# Run seed scripts for production
npx tsx prisma/seed/bundle-only-seed.ts
npx tsx scripts/setup-single-bank-mode.ts
```

## Phase 2: File Storage Migration

### Current File Storage Audit:
- `/public/uploads/` - User uploaded files
- `/public/images/` - Static assets
- Cloudinary - Bank logos (already implemented)

### Migration Strategy:
1. **Migrate uploads to Cloudinary**
2. **Update database references**
3. **Update upload endpoints**

## Phase 3: Production Configuration

### Security Checklist:
- [ ] Strong NEXTAUTH_SECRET
- [ ] Secure database credentials
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] Input validation

### Performance Optimizations:
- [ ] Image optimization
- [ ] Database query optimization
- [ ] Caching strategy
- [ ] Bundle analysis

## Phase 4: Deployment

### Vercel Deployment:
```bash
# Deploy to Vercel
npx vercel --prod

# Configure custom domain (optional)
npx vercel domains add your-domain.com
```

### Post-Deployment Testing:
- [ ] User registration/login
- [ ] Product browsing
- [ ] Cart functionality
- [ ] Checkout process
- [ ] Admin panel access
- [ ] Notification system
- [ ] Single bank mode
