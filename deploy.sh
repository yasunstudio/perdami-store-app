#!/bin/bash

# Perdami Store Deployment Script
# Usage: ./deploy.sh [local|staging|production]

ENVIRONMENT=${1:-local}

echo "🚀 Deploying Perdami Store to $ENVIRONMENT environment..."

case $ENVIRONMENT in
  "local")
    echo "🏠 Setting up local development environment..."
    
    # Check if .env.local exists
    if [ ! -f .env.local ]; then
      echo "📝 Creating .env.local from example..."
      cp .env.local.example .env.local
      echo "⚠️  Please update .env.local with your local configuration"
      exit 1
    fi
    
    # Start local database
    echo "🐳 Starting local PostgreSQL..."
    docker-compose -f docker-compose.dev.yml up -d postgres
    
    # Wait for database
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    
    # Run migrations and seed
    echo "🔄 Running migrations..."
    npx prisma migrate dev --name local-setup
    
    echo "🌱 Seeding database..."
    npm run db:seed
    
    echo "✅ Local environment ready!"
    echo "📋 Run 'npm run dev' to start the development server"
    ;;
    
  "staging")
    echo "🏗️ Preparing for staging deployment..."
    
    # Build and test locally first
    echo "🔧 Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
      echo "✅ Build successful!"
      echo "📋 Ready to deploy to Vercel staging"
      echo "   Run: vercel --prod"
    else
      echo "❌ Build failed. Please fix errors before deploying."
      exit 1
    fi
    ;;
    
  "production")
    echo "🚀 Preparing for production deployment..."
    
    # Run tests and build
    echo "🧪 Running lint checks..."
    npm run lint
    
    if [ $? -ne 0 ]; then
      echo "❌ Lint checks failed. Please fix before deploying."
      exit 1
    fi
    
    echo "🔧 Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
      echo "✅ Build successful!"
      echo "🚀 Deploying to production..."
      
      # Commit and push changes
      git add .
      git commit -m "Production deployment - $(date +'%Y-%m-%d %H:%M:%S')" 2>/dev/null || echo "No changes to commit"
      git push origin main
      
      echo "✅ Deployed to production!"
      echo "🌐 URL: https://dharma-wanita-perdami.vercel.app"
    else
      echo "❌ Build failed. Please fix errors before deploying."
      exit 1
    fi
    ;;
    
  *)
    echo "❌ Invalid environment. Use: local, staging, or production"
    exit 1
    ;;
esac
