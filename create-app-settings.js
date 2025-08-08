// Create AppSettings if missing
const { PrismaClient } = require('@prisma/client')

const createPrismaClient = () => {
  const connectionUrl = process.env.DATABASE_URL + `&app_name=create_settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl
      }
    }
  })
}

async function createAppSettings() {
  console.log('⚙️  Creating AppSettings...')
  
  const prisma = createPrismaClient()
  
  try {
    // Try to find or create AppSettings
    const settings = await prisma.appSettings.upsert({
      where: { id: 'main' },
      update: {},
      create: {
        id: 'main',
        appName: 'Perdami Store',
        appDescription: 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025',
        singleBankMode: false, // Enable multiple banks
        isActive: true
      }
    })
    
    console.log('✅ AppSettings created:', settings.id)
    
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log('🏗️  AppSettings table does not exist - this is normal')
    } else {
      console.error('❌ Error:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAppSettings().catch(console.error)
