#!/bin/bash

# Complete Vercel Production Deployment Pipeline
# This script orchestrates the entire production deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN} $1 ${NC}"
    echo -e "${CYAN}========================================${NC}"
}

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

# Phase 1: Pre-deployment preparation
phase_1_preparation() {
    print_header "PHASE 1: PRE-DEPLOYMENT PREPARATION"
    
    print_status "Running preparation script..."
    ./scripts/prepare-production.sh
    
    print_success "Preparation completed!"
    echo
    
    print_warning "Please review and update the following files:"
    echo "1. .env.production - Update with your actual production values"
    echo "2. vercel.json - Verify configuration"
    echo "3. DEPLOYMENT_CHECKLIST.md - Use as reference"
    echo
    
    read -p "Press Enter when you have reviewed and updated the files..."
}

# Phase 2: Database setup
phase_2_database() {
    print_header "PHASE 2: DATABASE SETUP"
    
    print_status "Starting database setup process..."
    ./scripts/setup-vercel-production.sh db-only
    
    print_success "Database setup completed!"
}

# Phase 3: File migration
phase_3_files() {
    print_header "PHASE 3: FILE STORAGE MIGRATION"
    
    print_status "Checking for files to migrate..."
    
    if [ -d "public/uploads" ] && [ "$(ls -A public/uploads)" ]; then
        print_warning "Found files in public/uploads directory"
        echo
        print_status "Files to migrate:"
        find public/uploads -type f | head -10
        echo
        
        read -p "Do you want to migrate these files to Cloudinary? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Starting file migration..."
            npx tsx scripts/migrate-uploads-to-cloudinary.ts
            print_success "File migration completed!"
        else
            print_warning "Skipping file migration"
            print_warning "Remember to handle file uploads manually"
        fi
    else
        print_success "No files to migrate"
    fi
}

# Phase 4: Final deployment
phase_4_deployment() {
    print_header "PHASE 4: VERCEL DEPLOYMENT"
    
    print_status "Starting final deployment process..."
    ./scripts/setup-vercel-production.sh deploy-only
    
    print_success "Deployment completed!"
}

# Phase 5: Post-deployment testing
phase_5_testing() {
    print_header "PHASE 5: POST-DEPLOYMENT TESTING"
    
    print_status "Your app should now be deployed!"
    echo
    print_status "Please test the following functionality:"
    echo
    echo "✓ User registration and login"
    echo "✓ Product browsing"
    echo "✓ Cart functionality"
    echo "✓ Checkout process"
    echo "✓ Admin panel access"
    echo "✓ Notification system"
    echo "✓ Single bank mode"
    echo "✓ File uploads (if applicable)"
    echo
    
    read -p "Press Enter when you have completed testing..."
    
    print_success "Production deployment pipeline completed!"
    echo
    print_status "🎉 Congratulations! Your Perdami Store is now live on Vercel!"
    echo
    print_status "Next steps:"
    echo "1. Configure custom domain (optional)"
    echo "2. Set up monitoring and analytics"
    echo "3. Schedule regular backups"
    echo "4. Monitor performance and errors"
    echo "5. Update documentation for production environment"
}

# Handle dry run
dry_run() {
    print_header "DRY RUN: DEPLOYMENT PIPELINE OVERVIEW"
    
    echo "This pipeline will execute the following phases:"
    echo
    echo "Phase 1: Pre-deployment Preparation"
    echo "  - Run preparation script"
    echo "  - Create .env.production template"
    echo "  - Generate vercel.json"
    echo "  - Create deployment checklist"
    echo
    echo "Phase 2: Database Setup"
    echo "  - Guide through Vercel Postgres creation"
    echo "  - Test database connection"
    echo "  - Run migrations"
    echo "  - Seed production database"
    echo
    echo "Phase 3: File Storage Migration"
    echo "  - Check for existing uploads"
    echo "  - Migrate files to Cloudinary (if needed)"
    echo "  - Update database references"
    echo
    echo "Phase 4: Vercel Deployment"
    echo "  - Configure environment variables"
    echo "  - Deploy to production"
    echo "  - Verify deployment"
    echo
    echo "Phase 5: Post-deployment Testing"
    echo "  - Guide through functionality testing"
    echo "  - Provide next steps"
    echo
    
    read -p "Do you want to proceed with the actual deployment? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        print_status "Dry run completed. Exiting..."
        exit 0
    fi
}

# Error handling
handle_error() {
    print_error "An error occurred during deployment!"
    print_status "Please check the error message above and:"
    echo "1. Fix the issue"
    echo "2. Review the deployment checklist"
    echo "3. Run the script again"
    echo
    print_warning "You can also run individual phases:"
    echo "./scripts/deploy-complete.sh --phase-1"
    echo "./scripts/deploy-complete.sh --phase-2"
    echo "./scripts/deploy-complete.sh --phase-3"
    echo "./scripts/deploy-complete.sh --phase-4"
    echo "./scripts/deploy-complete.sh --phase-5"
    exit 1
}

# Trap errors
trap 'handle_error' ERR

# Main execution
main() {
    print_header "🚀 PERDAMI STORE - COMPLETE PRODUCTION DEPLOYMENT"
    echo
    print_status "This script will guide you through the complete deployment process"
    print_status "to Vercel with Postgres database and Cloudinary file storage."
    echo
    
    # Show dry run first
    dry_run
    
    echo
    print_status "Starting complete deployment pipeline..."
    echo
    
    phase_1_preparation
    phase_2_database
    phase_3_files
    phase_4_deployment
    phase_5_testing
}

# Handle script arguments
case "${1:-}" in
    "--dry-run")
        dry_run
        ;;
    "--phase-1")
        phase_1_preparation
        ;;
    "--phase-2")
        phase_2_database
        ;;
    "--phase-3")
        phase_3_files
        ;;
    "--phase-4")
        phase_4_deployment
        ;;
    "--phase-5")
        phase_5_testing
        ;;
    "--help")
        echo "Usage: $0 [option]"
        echo
        echo "Options:"
        echo "  --dry-run    Show what will be done without executing"
        echo "  --phase-1    Run only preparation phase"
        echo "  --phase-2    Run only database setup phase"
        echo "  --phase-3    Run only file migration phase"
        echo "  --phase-4    Run only deployment phase"
        echo "  --phase-5    Run only testing phase"
        echo "  --help       Show this help message"
        echo
        exit 0
        ;;
    *)
        main
        ;;
esac
