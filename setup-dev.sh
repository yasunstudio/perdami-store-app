#!/bin/bash

# Perdami Store Development Setup Script
echo "🚀 Setting up Perdami Store Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.local.example .env.local
    echo "✅ .env.local created. Please update the values if needed."
else
    echo "✅ .env.local already exists."
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U perdami_user -d perdami_store_db_dev > /dev/null 2>&1; do
    sleep 2
    echo "   Still waiting for PostgreSQL..."
done

echo "✅ PostgreSQL is ready!"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed."
fi

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database if empty
echo "🌱 Seeding database..."
npx prisma db seed

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the development server:"
echo "      npm run dev"
echo ""
echo "   2. Open your browser:"
echo "      http://localhost:3000"
echo ""
echo "   3. Access admin panel:"
echo "      http://localhost:3000/admin/login"
echo "      Email: admin@perdami.com"
echo "      Password: perdami123"
echo ""
echo "   4. View database:"
echo "      npx prisma studio"
echo ""
echo "🛠  Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.dev.yml down"
echo "   - Reset database: npm run db:reset"
echo ""
