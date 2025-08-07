/**
 * Production Database Seeding Script
 * This script will populate the production database with initial data
 */
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🌱 Starting production database setup and seeding...')

    // First, let's run the migration manually
    try {
      // Try to create the migration tracking table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          "id" VARCHAR(36) NOT NULL,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMPTZ,
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMPTZ,
          "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
          
          CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
        );
      `
      console.log('✅ Migration table created')
    } catch (e) {
      console.log('ℹ️  Migration table already exists or error:', (e as Error).message)
    }

    // Check if the main tables exist, if not create them
    try {
      await prisma.store.count()
      console.log('✅ Tables already exist')
    } catch (e) {
      console.log('📋 Creating database schema...')
      
      // Create core tables manually
      await prisma.$executeRaw`
        -- CreateEnum
        CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
        
        -- CreateEnum
        CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED', 'REFUNDED');
        
        -- CreateEnum
        CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER');
        
        -- CreateEnum
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
        
        -- CreateTable
        CREATE TABLE "Account" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "provider" TEXT NOT NULL,
            "providerAccountId" TEXT NOT NULL,
            "refresh_token" TEXT,
            "access_token" TEXT,
            "expires_at" INTEGER,
            "token_type" TEXT,
            "scope" TEXT,
            "id_token" TEXT,
            "session_state" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
        
            CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        -- CreateTable
        CREATE TABLE "Session" (
            "id" TEXT NOT NULL,
            "sessionToken" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "expires" TIMESTAMP(3) NOT NULL,
        
            CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        -- CreateTable
        CREATE TABLE "User" (
            "id" TEXT NOT NULL,
            "name" TEXT,
            "email" TEXT,
            "password" TEXT,
            "emailVerified" TIMESTAMP(3),
            "image" TEXT,
            "role" "Role" NOT NULL DEFAULT 'USER',
            "phone" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
        
            CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        -- CreateTable
        CREATE TABLE "VerificationToken" (
            "identifier" TEXT NOT NULL,
            "token" TEXT NOT NULL,
            "expires" TIMESTAMP(3) NOT NULL
        );
      `
      
      await prisma.$executeRaw`
        -- CreateTable
        CREATE TABLE "Store" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "image" TEXT,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
        
            CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        -- CreateTable
        CREATE TABLE "ProductBundle" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "price" DECIMAL(10,2) NOT NULL,
            "image" TEXT,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "showToCustomer" BOOLEAN NOT NULL DEFAULT true,
            "storeId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
        
            CONSTRAINT "ProductBundle_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        -- CreateTable
        CREATE TABLE "Bank" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "code" TEXT NOT NULL,
            "accountNumber" TEXT NOT NULL,
            "accountName" TEXT NOT NULL,
            "logo" TEXT,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
        
            CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        -- CreateTable
        CREATE TABLE "Order" (
            "id" TEXT NOT NULL,
            "orderNumber" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
            "paymentMethod" "PaymentMethod" NOT NULL,
            "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
            "totalAmount" DECIMAL(10,2) NOT NULL,
            "paymentProof" TEXT,
            "paymentProofId" TEXT,
            "notes" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
        
            CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        -- CreateTable
        CREATE TABLE "OrderItem" (
            "id" TEXT NOT NULL,
            "orderId" TEXT NOT NULL,
            "bundleId" TEXT NOT NULL,
            "quantity" INTEGER NOT NULL,
            "price" DECIMAL(10,2) NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
        
            CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
        );
      `
      
      await prisma.$executeRaw`
        -- CreateIndex
        CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
        
        -- CreateIndex
        CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
        
        -- CreateIndex
        CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
        
        -- CreateIndex
        CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
        
        -- CreateIndex
        CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
        
        -- CreateIndex
        CREATE UNIQUE INDEX "Bank_code_key" ON "Bank"("code");
        
        -- CreateIndex
        CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
        
        -- AddForeignKey
        ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        
        -- AddForeignKey
        ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        
        -- AddForeignKey
        ALTER TABLE "ProductBundle" ADD CONSTRAINT "ProductBundle_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        
        -- AddForeignKey
        ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        
        -- AddForeignKey
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        
        -- AddForeignKey
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ProductBundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `
      
      console.log('✅ Database schema created')
    }

    // Check if database is already seeded
    const existingStores = await prisma.store.count()
    if (existingStores > 0) {
      return NextResponse.json({ 
        message: 'Database already seeded', 
        stores: existingStores 
      })
    }

    console.log('🌱 Seeding database with initial data...')

    // Seed Banks
    const banks = await prisma.bank.createMany({
      data: [
        {
          name: 'Bank Central Asia (BCA)',
          code: 'BCA',
          accountNumber: '1234567890',
          accountName: 'Dharma Wanita Perdami',
          logo: '/images/banks/bca-logo.png',
        },
        {
          name: 'Bank Mandiri',
          code: 'MANDIRI',
          accountNumber: '9876543210',
          accountName: 'Dharma Wanita Perdami',
          logo: '/images/banks/mandiri-logo.png',
        },
        {
          name: 'Bank Negara Indonesia (BNI)',
          code: 'BNI',
          accountNumber: '1122334455',
          accountName: 'Dharma Wanita Perdami',
          logo: '/images/banks/bni-logo.png',
        },
      ],
      skipDuplicates: true,
    })

    // Seed Stores
    const stores = await prisma.store.createMany({
      data: [
        {
          name: 'Toko Oleh-oleh Perdami',
          description: 'Toko resmi produk oleh-oleh Dharma Wanita Perdami untuk PIT PERDAMI 2025',
          image: '/images/stores/perdami-store.jpg',
          isActive: true,
        }
      ],
      skipDuplicates: true,
    })

    // Get the created store
    const store = await prisma.store.findFirst()
    if (!store) {
      throw new Error('Failed to create store')
    }

    // Seed Product Bundles
    const bundles = await prisma.productBundle.createMany({
      data: [
        {
          name: 'Paket Oleh-oleh Spesial',
          description: 'Paket lengkap oleh-oleh khas untuk PIT PERDAMI 2025',
          price: 150000,
          image: '/images/bundles/paket-spesial.jpg',
          isActive: true,
          showToCustomer: true,
          storeId: store.id,
        },
        {
          name: 'Paket Oleh-oleh Keluarga',
          description: 'Paket oleh-oleh untuk keluarga tercinta',
          price: 250000,
          image: '/images/bundles/paket-keluarga.jpg',
          isActive: true,
          showToCustomer: true,
          storeId: store.id,
        },
        {
          name: 'Paket Oleh-oleh Premium',
          description: 'Paket premium dengan produk terpilih',
          price: 350000,
          image: '/images/bundles/paket-premium.jpg',
          isActive: true,
          showToCustomer: true,
          storeId: store.id,
        },
      ],
      skipDuplicates: true,
    })

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@perdami.com',
        name: 'Admin Perdami',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        phone: '081234567890',
      }
    })

    // Get counts for response
    const finalCounts = {
      banks: await prisma.bank.count(),
      stores: await prisma.store.count(),
      bundles: await prisma.productBundle.count(),
      users: await prisma.user.count(),
    }

    console.log('✅ Production database seeded successfully!')
    console.log('📊 Seeded data:', finalCounts)

    return NextResponse.json({
      message: 'Production database setup and seeded successfully!',
      data: finalCounts,
      adminUser: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        loginInfo: {
          email: 'admin@perdami.com',
          password: 'admin123'
        }
      }
    })

  } catch (error) {
    console.error('❌ Setup/Seeding failed:', error)
    return NextResponse.json({ 
      message: 'Setup/Seeding failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
