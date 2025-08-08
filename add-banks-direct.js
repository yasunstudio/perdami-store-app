// Simple script to add banks to production database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function addBanks() {
  console.log('🏦 Adding Bank Data...')
  
  try {
    // Insert banks using raw SQL to bypass model issues
    await prisma.$executeRaw`
      INSERT INTO "Bank" (id, name, code, "accountNumber", "accountName", "isActive", "createdAt", "updatedAt")
      VALUES 
        ('bank1', 'Bank BRI - Perdami Store', 'BRI', '1234567890123456', 'PT Perdami Store Indonesia', true, NOW(), NOW()),
        ('bank2', 'Bank BCA - Perdami Store', 'BCA', '9876543210987654', 'PT Perdami Store Indonesia', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `
    
    console.log('✅ Bank data added successfully')
    
    // Verify
    const banks = await prisma.$queryRaw`SELECT * FROM "Bank" WHERE "isActive" = true`
    console.log('🏦 Active banks:', banks)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addBanks().catch(console.error)
