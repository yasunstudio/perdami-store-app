# 🚀 Vercel Deployment Guide - Perdami Store App

## ✅ Langkah-langkah Setup Deployment Otomatis

### 1. **Persiapan Repository**
✅ Repository sudah terpush ke GitHub: `yasunstudio/perdami-store-app`
✅ Semua perubahan sudah committed (print invoice removal, cleanup, phone field)

### 2. **Setup Vercel Dashboard**

1. **Buka Vercel Dashboard**: https://vercel.com/dashboard
2. **Klik "New Project"**
3. **Import Git Repository**: 
   - Pilih `yasunstudio/perdami-store-app`
   - Vercel akan otomatis detect Next.js framework

### 3. **Environment Variables Setup**

Di Vercel Dashboard > Project Settings > Environment Variables, tambahkan:

```env
# Database Production (Prisma Postgres)
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza190RlhWaGltbkRsRHlOWEdDeU0yc3IiLCJhcGlfa2V5IjoiMDFLMkJXTTE5UDZSWlY2V01DODRKWlRUNlciLCJ0ZW5hbnRfaWQiOiI3MTI0NDM4M2QwOTJiMmI4ZmZhNGQ5ZTFjZmQ4Zjc2NmM1YzJmYjZiZWFmOTE0MzM1OGVhOTE4NWM5YTYzOGQ4IiwiaW50ZXJuYWxfc2VjcmV0IjoiOGEyZGE3NzktMzI4MC00YjFhLTg3MmMtNzAxMzMxNmM3YTU5In0.hIKCzfpmPbDjIhQGr39ugjZhP7mtZFNRaPpdBG-T2v0

# NextAuth Configuration
NEXTAUTH_SECRET=3jOEAH+YMtOCrPjwymhzGyDYpLQ0ykm8TgrfivDQHrk=
NEXTAUTH_URL=https://dharma-wanita-perdami.vercel.app
NEXT_PUBLIC_APP_URL=https://dharma-wanita-perdami.vercel.app

# Email Configuration
EMAIL_FROM=noreply@perdami.com
EMAIL_FROM_NAME=Dharma Wanita Perdami
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yasun.studio@gmail.com
SMTP_PASS=gtek sylq lgim plty

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dvxsw0cjv
CLOUDINARY_API_KEY=992188384998348
CLOUDINARY_API_SECRET=qK05Yj0W-ZkZX2BarfrjBZXtkRg

# Node Environment
NODE_ENV=production
```

### 4. **Build Configuration**

✅ **Build Command**: `prisma generate && next build` (sudah di package.json)
✅ **Start Command**: `next start` (sudah di package.json)
✅ **Node Version**: 18.x (compatible dengan Next.js 15)

### 5. **Database Migration Setup**

Setelah deployment pertama berhasil, jalankan migration:

1. **Buka Terminal di Vercel Dashboard** atau **gunakan Vercel CLI**:
```bash
npx vercel env pull .env.local
npm run prisma:migrate:deploy
npm run prisma:seed
```

ATAU melalui **Vercel Dashboard > Functions tab** → jalankan function untuk seed database.

### 6. **Automatic Deployment Setup**

✅ **Vercel sudah otomatis setup**:
- **Push ke `main` branch** → Auto deploy to production
- **Push ke branch lain** → Auto deploy to preview
- **Pull Request** → Auto deploy to preview

### 7. **Custom Domain (Optional)**

Jika ingin menggunakan domain custom:
1. **Vercel Dashboard > Project Settings > Domains**
2. **Tambahkan domain**: `perdami.com` atau domain Anda
3. **Update Environment Variables** `NEXTAUTH_URL` dan `NEXT_PUBLIC_APP_URL`

## 🔧 Production Database Management

### **Prisma Postgres Dashboard**
- **URL**: https://console.prisma.io
- **Project**: `perdami-store-production`
- **Region**: `us-east-1`

### **Database Operations**
```bash
# View data di browser
npx prisma studio

# Migration production
npx prisma migrate deploy

# Reset database (HATI-HATI!)
npx prisma migrate reset --force
```

## 📊 Monitoring & Logs

### **Vercel Dashboard**
- **Functions tab**: Monitor API performance
- **Analytics tab**: Traffic & performance metrics
- **Deployments tab**: Deployment history & logs

### **Error Monitoring**
- **Build errors**: Vercel Dashboard > Deployments
- **Runtime errors**: Vercel Dashboard > Functions
- **Application logs**: Console di browser

## 🚀 Deployment Flow

```
1. Develop locally → Test → Commit → Push to GitHub
                                        ↓
2. GitHub webhook triggers Vercel → Auto build → Auto deploy
                                        ↓
3. Production app live at: https://dharma-wanita-perdami.vercel.app
```

## ✅ Features Ready for Production

- ✅ **User Registration** dengan phone field required
- ✅ **E-commerce functionality** (bundles, cart, checkout, orders)
- ✅ **Admin panel** untuk management
- ✅ **Payment system** dengan bank transfer
- ✅ **Email notifications**
- ✅ **File upload** (Cloudinary)
- ✅ **Responsive design**
- ✅ **Clean codebase** (40+ unused files removed)

## 🎯 Next Steps

1. **Deploy ke Vercel** menggunakan panduan di atas
2. **Test production environment** setelah deployment
3. **Setup monitoring** untuk error tracking
4. **Optimize performance** jika diperlukan

---

**Production URL**: https://dharma-wanita-perdami.vercel.app
**Repository**: https://github.com/yasunstudio/perdami-store-app
**Database**: Prisma Postgres (hosted)
