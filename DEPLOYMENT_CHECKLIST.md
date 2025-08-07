# Deployment Checklist for Perdami Store

## Pre-Deployment
- [ ] Database backup completed
- [ ] .env.production configured with actual values
- [ ] Vercel Postgres database created
- [ ] Cloudinary account configured
- [ ] Domain purchased (if using custom domain)

## Database Migration
- [ ] Export DATABASE_URL="your_vercel_postgres_url"
- [ ] Run: npx prisma migrate deploy
- [ ] Run: npx prisma generate
- [ ] Run: npx tsx prisma/seed/bundle-only-seed.ts
- [ ] Run: npx tsx scripts/setup-single-bank-mode.ts

## File Storage Migration
- [ ] Upload existing files to Cloudinary
- [ ] Update database references
- [ ] Test file upload functionality

## Vercel Deployment
- [ ] Login: npx vercel login
- [ ] Deploy: npx vercel --prod
- [ ] Configure environment variables in Vercel dashboard
- [ ] Test deployment

## Post-Deployment Testing
- [ ] User registration/login works
- [ ] Product browsing works
- [ ] Cart functionality works
- [ ] Checkout process works
- [ ] Admin panel accessible
- [ ] Notifications working
- [ ] Single bank mode working
- [ ] File uploads working

## Production Monitoring
- [ ] Setup error monitoring
- [ ] Configure analytics
- [ ] Monitor performance
- [ ] Setup backup strategy
