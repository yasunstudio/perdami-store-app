#!/bin/bash

# Production Migration Helper Script
# This script helps prepare the application for Vercel deployment

set -e

echo "🚀 Perdami Store - Production Migration Helper"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        print_error "npx is not available"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Phase 1: Database Backup
backup_database() {
    print_status "Phase 1: Creating database backup..."
    
    # Create backups directory
    mkdir -p backups
    
    # Get current date for backup filename
    BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
    
    # Full backup
    if command -v pg_dump &> /dev/null; then
        print_status "Creating full database backup..."
        pg_dump perdami_store_db_dev > "backups/full_backup_${BACKUP_DATE}.sql"
        print_success "Full backup created: backups/full_backup_${BACKUP_DATE}.sql"
        
        # Data-only backup for migration
        print_status "Creating data-only backup..."
        pg_dump --data-only --inserts perdami_store_db_dev > "backups/data_backup_${BACKUP_DATE}.sql"
        print_success "Data backup created: backups/data_backup_${BACKUP_DATE}.sql"
    else
        print_warning "pg_dump not found. Please backup your database manually"
    fi
}

# Phase 2: Environment Setup
setup_environment() {
    print_status "Phase 2: Setting up production environment..."
    
    # Create .env.production template if it doesn't exist
    if [ ! -f .env.production ]; then
        print_status "Creating .env.production template..."
        cat > .env.production << EOF
# Production Environment Configuration
# Copy this file and update with your production values

# Database (Vercel Postgres)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Authentication
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://your-app.vercel.app"

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Optional: Analytics, Monitoring, etc.
VERCEL_URL=""
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
EOF
        print_success "Created .env.production template"
        print_warning "Please update .env.production with your actual production values"
    else
        print_warning ".env.production already exists"
    fi
}

# Phase 3: Dependencies and Build Check
check_dependencies() {
    print_status "Phase 3: Checking dependencies and build..."
    
    print_status "Installing dependencies..."
    npm install
    
    print_status "Running build test..."
    npm run build
    print_success "Build test passed"
    
    print_status "Running type check..."
    npm run type-check 2>/dev/null || npx tsc --noEmit
    print_success "Type check passed"
}

# Phase 4: File Upload Audit
audit_uploads() {
    print_status "Phase 4: Auditing file uploads..."
    
    # Check public/uploads directory
    if [ -d "public/uploads" ]; then
        UPLOAD_COUNT=$(find public/uploads -type f | wc -l)
        UPLOAD_SIZE=$(du -sh public/uploads | cut -f1)
        print_status "Found ${UPLOAD_COUNT} files in public/uploads (${UPLOAD_SIZE})"
        
        # List file types
        print_status "File types in uploads:"
        find public/uploads -name "*.*" | sed 's/.*\.//' | sort | uniq -c | sort -nr
    else
        print_success "No uploads directory found - good for Vercel deployment"
    fi
    
    # Check for hardcoded file paths in code
    print_status "Checking for hardcoded file paths..."
    grep -r "public/uploads" src/ || print_success "No hardcoded upload paths found"
}

# Phase 5: Vercel Configuration
setup_vercel_config() {
    print_status "Phase 5: Setting up Vercel configuration..."
    
    # Create vercel.json if it doesn't exist
    if [ ! -f vercel.json ]; then
        print_status "Creating vercel.json..."
        cat > vercel.json << EOF
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "installCommand": "npm install",
  "regions": ["sin1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_APP_URL": "@next_public_app_url"
  }
}
EOF
        print_success "Created vercel.json"
    else
        print_warning "vercel.json already exists"
    fi
}

# Phase 6: Create deployment checklist
create_deployment_checklist() {
    print_status "Phase 6: Creating deployment checklist..."
    
    cat > DEPLOYMENT_CHECKLIST.md << EOF
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
EOF

    print_success "Created DEPLOYMENT_CHECKLIST.md"
}

# Main execution
main() {
    echo
    print_status "Starting production migration preparation..."
    echo
    
    check_prerequisites
    echo
    
    backup_database
    echo
    
    setup_environment
    echo
    
    check_dependencies
    echo
    
    audit_uploads
    echo
    
    setup_vercel_config
    echo
    
    create_deployment_checklist
    echo
    
    print_success "Production migration preparation completed!"
    echo
    print_status "Next steps:"
    echo "1. Update .env.production with your actual production values"
    echo "2. Create Vercel Postgres database"
    echo "3. Follow DEPLOYMENT_CHECKLIST.md"
    echo "4. Run database migration"
    echo "5. Deploy to Vercel"
    echo
    print_warning "Don't forget to backup your data before proceeding!"
}

# Run main function
main "$@"
