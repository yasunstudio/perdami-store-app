# 🚀 Perdami Store - Production Deployment Guide

## Overview
Complete guide for deploying Perdami Store to Vercel with production-ready setup including Vercel Postgres and Cloudinary file storage.

## 📋 Prerequisites

### Required Accounts
- [x] **Vercel Account** - For hosting and database
- [x] **Cloudinary Account** - For file storage  
- [x] **Domain** (optional) - For custom domain

### Required Tools
- [x] **Node.js** (v18+)
- [x] **npm** or **yarn**
- [x] **Git**
- [x] **Vercel CLI** (will be installed automatically)

## 🎯 Deployment Strategy: Option B (Production-Ready)

We're implementing the **Production-Ready** approach which includes:

### ✅ **Database Migration**
- **From**: Local PostgreSQL
- **To**: Vercel Postgres (managed, scalable)
- **Migration**: Automated with Prisma

### ✅ **File Storage Migration**  
- **From**: Local `/public/uploads`
- **To**: Cloudinary (CDN, optimized)
- **Migration**: Automated script

### ✅ **Environment Setup**
- **Security**: Strong secrets, HTTPS
- **Performance**: Optimized configuration
- **Monitoring**: Error tracking ready

## 🚀 Quick Start (Automated)

### Option 1: Complete Automated Deployment
```bash
# Run the complete deployment pipeline
./scripts/deploy-complete.sh
```

### Option 2: Step-by-Step Manual Deployment
```bash
# Step 1: Preparation
./scripts/prepare-production.sh

# Step 2: Database setup  
./scripts/setup-vercel-production.sh db-only

# Step 3: File migration (if needed)
npx tsx scripts/migrate-uploads-to-cloudinary.ts

# Step 4: Deploy
./scripts/setup-vercel-production.sh deploy-only
```

### Option 3: Individual Phases
```bash
# Run specific phases only
./scripts/deploy-complete.sh --phase-1  # Preparation
./scripts/deploy-complete.sh --phase-2  # Database
./scripts/deploy-complete.sh --phase-3  # Files
./scripts/deploy-complete.sh --phase-4  # Deployment
./scripts/deploy-complete.sh --phase-5  # Testing
```

## 📝 Manual Steps Required

### 1. Vercel Postgres Setup
1. Login to [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to **Storage** → **Create Database**
3. Choose **Postgres**
4. Name: `perdami-store-production`
5. Region: `Singapore (sin1)` or closest to users
6. Copy **DATABASE_URL** from dashboard

### 2. Environment Configuration
Update `.env.production` with your values:
```env
# Database (from Vercel Dashboard)
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Auth (use generated secret)
NEXTAUTH_SECRET="your_generated_secret"
NEXTAUTH_URL="https://your-app.vercel.app"

# Cloudinary (from your account)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"  
CLOUDINARY_API_SECRET="your_api_secret"
```

### 3. Vercel Environment Variables
In Vercel Dashboard → Project → Settings → Environment Variables:
- Add all variables from `.env.production`
- Set environment to **Production**

## 🔧 Technical Implementation

### Database Migration Process
```bash
# 1. Export from local
pg_dump perdami_store_db_dev > backup.sql

# 2. Apply to Vercel Postgres  
npx prisma migrate deploy --url "$DATABASE_URL"

# 3. Seed production data
npx tsx prisma/seed/bundle-only-seed.ts
npx tsx scripts/setup-single-bank-mode.ts
```

### File Storage Migration
```bash
# Migrate uploads to Cloudinary
npx tsx scripts/migrate-uploads-to-cloudinary.ts

# Updates database references automatically:
# - User profile images
# - Bundle images  
# - Order payment proofs
# - App settings logos
```

### Deployment Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "framework": "nextjs", 
  "regions": ["sin1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## ✅ Post-Deployment Testing Checklist

### Core Functionality
- [ ] **Homepage** loads correctly
- [ ] **User registration** works
- [ ] **Login/logout** works
- [ ] **Product browsing** works
- [ ] **Cart functionality** works
- [ ] **Checkout process** works with single bank mode

### Admin Panel
- [ ] **Admin login** works
- [ ] **Orders management** works
- [ ] **User management** works
- [ ] **Bank settings** works
- [ ] **Single bank mode** toggle works
- [ ] **Notifications** work
- [ ] **Settings** save correctly

### File Uploads
- [ ] **Profile images** upload works
- [ ] **Payment proofs** upload works
- [ ] **Images** display correctly from Cloudinary

### Performance
- [ ] **Page load times** acceptable (<3s)
- [ ] **API responses** fast (<1s)
- [ ] **Images** load quickly from CDN

## 🔍 Monitoring & Maintenance

### Error Monitoring
- **Vercel Analytics** - Built-in performance monitoring
- **Sentry** (optional) - Error tracking
- **LogRocket** (optional) - Session replay

### Database Monitoring
- **Vercel Postgres** dashboard - Query performance
- **Prisma insights** - Database health

### Backup Strategy
```bash
# Weekly database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Store in secure location (AWS S3, Google Cloud, etc.)
```

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build locally first
npm run build

# Check TypeScript errors
npm run type-check
```

#### Database Connection Issues
```bash
# Test connection
npx prisma db execute --command "SELECT 1;" --url "$DATABASE_URL"

# Check environment variables in Vercel dashboard
```

#### File Upload Issues
```bash
# Test Cloudinary configuration
npx tsx -e "console.log(process.env.CLOUDINARY_CLOUD_NAME)"

# Check file migration report
cat file-migration-report.json
```

### Support Resources
- **Vercel Documentation**: https://vercel.com/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Cloudinary Documentation**: https://cloudinary.com/documentation
- **Next.js Documentation**: https://nextjs.org/docs

## 🎉 Success Metrics

### Deployment Complete When:
- [x] Application builds successfully
- [x] Database migrations applied
- [x] All tests pass
- [x] File uploads work
- [x] Single bank mode functions
- [x] Admin panel accessible
- [x] Performance meets targets

### Ready for PIT PERDAMI 2025:
- [x] **Single bank mode** enabled for event
- [x] **Payment processing** works smoothly  
- [x] **Pickup notifications** configured
- [x] **Admin management** ready
- [x] **Performance** optimized for traffic

---

## 📞 Need Help?

If you encounter any issues during deployment:

1. **Check the logs** in Vercel dashboard
2. **Review this guide** step by step
3. **Run diagnostics**:
   ```bash
   ./scripts/deploy-complete.sh --dry-run
   ```
4. **Test individual components**:
   ```bash
   # Test database
   npx prisma db execute --command "SELECT 1;"
   
   # Test build
   npm run build
   
   # Test file migration
   npx tsx scripts/migrate-uploads-to-cloudinary.ts --dry-run
   ```

**Good luck with your production deployment! 🚀**
