#!/usr/bin/env bash

echo "🚀 Setting up production database..."

# Set production environment variables
export DATABASE_URL="postgres://postgres.xrpuqxzcliorzlekpfro:DbJyhMZDrRYuHRWP@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
export NODE_ENV="production"

echo "📊 Generating Prisma client..."
npx prisma generate

echo "🏗️ Pushing schema to production database..."
npx prisma db push --force-reset --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ Schema pushed successfully"
    
    echo "🌱 Running seed script..."
    npx tsx prisma/seed/seed.ts
    
    if [ $? -eq 0 ]; then
        echo "🎉 Production database setup completed successfully!"
        echo "📧 Admin login: admin@perdami.com"
        echo "🔑 Admin password: admin123"
        echo "🌐 Access admin at: https://dharma-wanita-perdami.vercel.app/admin"
    else
        echo "❌ Seed failed"
        exit 1
    fi
else
    echo "❌ Schema push failed"
    exit 1
fi
