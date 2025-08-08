// Check what tables exist in database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkTables() {
  console.log('📋 Checking Database Tables...')
  
  try {
    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
    
    console.log('📊 Available tables:')
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables().catch(console.error)
