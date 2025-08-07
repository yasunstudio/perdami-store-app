#!/bin/bash

# Vercel Postgres Database Setup Script
# This script helps you setup and migrate to Vercel Postgres

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed"
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    print_success "Vercel CLI is available"
}

# Database setup guide
setup_database() {
    print_status "=== Vercel Postgres Database Setup ==="
    echo
    print_status "Follow these steps to setup your Vercel Postgres database:"
    echo
    echo "1. Login to Vercel:"
    echo "   npx vercel login"
    echo
    echo "2. Create a new project (if not exists):"
    echo "   npx vercel"
    echo
    echo "3. Go to Vercel Dashboard > Storage > Create Database"
    echo "   - Choose: Postgres"
    echo "   - Name: perdami-store-production"
    echo "   - Region: Singapore (sin1) or closest to your users"
    echo
    echo "4. Copy the DATABASE_URL from the dashboard"
    echo "   - Go to your database > .env.local tab"
    echo "   - Copy the DATABASE_URL value"
    echo
    print_warning "Make sure to copy the DATABASE_URL before proceeding!"
    echo
    read -p "Press Enter when you have copied the DATABASE_URL..."
}

# Update production environment
update_production_env() {
    print_status "=== Updating Production Environment ==="
    
    if [ ! -f .env.production ]; then
        print_error ".env.production file not found"
        print_status "Please run ./scripts/prepare-production.sh first"
        exit 1
    fi
    
    print_status "Current .env.production file exists"
    echo
    print_warning "Please update the following in .env.production:"
    echo "1. DATABASE_URL - Your Vercel Postgres connection string"
    echo "2. NEXTAUTH_URL - Your production domain"
    echo "3. CLOUDINARY_* - Your Cloudinary credentials"
    echo
    read -p "Press Enter when you have updated .env.production..."
}

# Test database connection
test_database_connection() {
    print_status "=== Testing Database Connection ==="
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        print_status "Please set DATABASE_URL environment variable:"
        echo "export DATABASE_URL=\"your_vercel_postgres_url\""
        exit 1
    fi
    
    print_status "Testing connection to production database..."
    
    # Test connection using Prisma
    if npx prisma db execute --command "SELECT 1;" --url "$DATABASE_URL" > /dev/null 2>&1; then
        print_success "Database connection successful!"
    else
        print_error "Database connection failed"
        print_status "Please check your DATABASE_URL and database status"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_status "=== Running Database Migrations ==="
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        exit 1
    fi
    
    print_status "Applying migrations to production database..."
    
    # Deploy migrations
    npx prisma migrate deploy --url "$DATABASE_URL"
    print_success "Migrations applied successfully!"
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    print_success "Prisma client generated!"
}

# Seed production database
seed_database() {
    print_status "=== Seeding Production Database ==="
    
    print_warning "This will add initial data to your production database"
    read -p "Do you want to proceed with seeding? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Running seed scripts..."
        
        # Run bundle seed
        export DATABASE_URL="$DATABASE_URL"
        npx tsx prisma/seed/bundle-only-seed.ts
        
        # Setup single bank mode
        npx tsx scripts/setup-single-bank-mode.ts
        
        print_success "Database seeded successfully!"
    else
        print_warning "Skipping database seeding"
    fi
}

# Create Vercel environment variables
setup_vercel_env() {
    print_status "=== Setting up Vercel Environment Variables ==="
    
    if [ ! -f .env.production ]; then
        print_error ".env.production file not found"
        exit 1
    fi
    
    print_status "You need to add environment variables to Vercel"
    print_status "Go to: Vercel Dashboard > Your Project > Settings > Environment Variables"
    echo
    print_status "Add these variables from your .env.production:"
    echo
    grep -v '^#' .env.production | grep -v '^$' | while IFS= read -r line; do
        key=$(echo "$line" | cut -d'=' -f1)
        echo "  - $key"
    done
    echo
    print_warning "Make sure to set the environment to 'Production'"
    echo
    read -p "Press Enter when you have added all environment variables to Vercel..."
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "=== Deploying to Vercel ==="
    
    print_status "Building and deploying to production..."
    
    # Deploy to production
    npx vercel --prod
    
    print_success "Deployment completed!"
    print_status "Your app should now be live on Vercel!"
}

# Main execution
main() {
    echo
    print_status "🚀 Vercel Postgres Database Setup & Deployment"
    print_status "=============================================="
    echo
    
    check_vercel_cli
    echo
    
    setup_database
    echo
    
    update_production_env
    echo
    
    print_status "Please set your DATABASE_URL environment variable:"
    echo "export DATABASE_URL=\"your_vercel_postgres_url\""
    echo
    read -p "Press Enter when DATABASE_URL is set..."
    
    test_database_connection
    echo
    
    run_migrations
    echo
    
    seed_database
    echo
    
    setup_vercel_env
    echo
    
    deploy_to_vercel
    echo
    
    print_success "🎉 Production deployment completed!"
    echo
    print_status "Next steps:"
    echo "1. Test your production app"
    echo "2. Configure custom domain (optional)"
    echo "3. Set up monitoring and analytics"
    echo "4. Run post-deployment tests"
    echo
    print_warning "Don't forget to test all functionality in production!"
}

# Handle script arguments
case "${1:-}" in
    "db-only")
        check_vercel_cli
        setup_database
        update_production_env
        test_database_connection
        run_migrations
        seed_database
        ;;
    "deploy-only")
        check_vercel_cli
        setup_vercel_env
        deploy_to_vercel
        ;;
    *)
        main
        ;;
esac
