#!/bin/bash

# Production Database Setup Script
# Run this after Vercel deployment to setup database

echo "🚀 Setting up Production Database..."

# Pull environment variables from Vercel
echo "📥 Pulling environment variables..."
npx vercel env pull .env.local

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Deploy migrations to production database
echo "📊 Deploying database migrations..."
npx prisma migrate deploy

# Seed the database with initial data
echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo "✅ Production database setup complete!"
echo "🔗 You can view your data at: https://console.prisma.io"
echo "🌐 Your app is live at: https://dharma-wanita-perdami.vercel.app"
