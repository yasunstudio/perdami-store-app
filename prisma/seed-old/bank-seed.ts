import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedBanks() {
  console.log('🏦 Seeding Bank Data...')
  
  try {
    // First, let's check if Bank table exists by trying to find any bank
    await prisma.bank.findFirst()
    console.log('✅ Bank table exists, proceeding with seed...')
  } catch (error: any) {
    if (error.message.includes('does not exist')) {
      console.log('❌ Bank table does not exist. Please run migrations first:')
      console.log('   npx prisma migrate dev')
      return
    }
    throw error
  }

  // Sample bank data for Perdami Store
  const banksData = [
    {
      id: 'bank-bri-perdami',
      name: 'Bank BRI - Perdami Store',
      code: 'BRI',
      accountNumber: '123456789012345',
      accountName: 'Dharma Wanita Perdami',
      logo: '/images/banks/bri-logo.png',
      isActive: true,
    },
    {
      id: 'bank-bca-perdami',
      name: 'Bank BCA - Perdami Store',
      code: 'BCA', 
      accountNumber: '987654321098765',
      accountName: 'Dharma Wanita Perdami',
      logo: '/images/banks/bca-logo.png',
      isActive: true,
    },
    {
      id: 'bank-mandiri-perdami',
      name: 'Bank Mandiri - Perdami Store',
      code: 'MANDIRI',
      accountNumber: '555666777888999',
      accountName: 'Dharma Wanita Perdami',
      logo: '/images/banks/mandiri-logo.png', 
      isActive: true,
    },
    {
      id: 'bank-bni-perdami',
      name: 'Bank BNI - Perdami Store',
      code: 'BNI',
      accountNumber: '111222333444555',
      accountName: 'Dharma Wanita Perdami',
      logo: '/images/banks/bni-logo.png',
      isActive: false, // Inactive for demo
    }
  ]

  // Create banks one by one to handle duplicates gracefully
  let createdCount = 0
  let updatedCount = 0

  for (const bankData of banksData) {
    try {
      const existingBank = await prisma.bank.findUnique({
        where: { id: bankData.id }
      })

      if (existingBank) {
        // Update existing bank
        await prisma.bank.update({
          where: { id: bankData.id },
          data: bankData
        })
        console.log(`🔄 Updated bank: ${bankData.name}`)
        updatedCount++
      } else {
        // Create new bank
        await prisma.bank.create({
          data: bankData
        })
        console.log(`✅ Created bank: ${bankData.name}`)
        createdCount++
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Bank ${bankData.name} already exists (duplicate constraint)`)
      } else {
        console.error(`❌ Error with bank ${bankData.name}:`, error.message)
      }
    }
  }

  console.log(`\n📊 Bank Seed Summary:`)
  console.log(`   Created: ${createdCount} banks`)
  console.log(`   Updated: ${updatedCount} banks`)

  // Verify final state
  const allBanks = await prisma.bank.findMany({
    orderBy: { name: 'asc' }
  })

  console.log(`\n🏦 All Banks in Database (${allBanks.length} total):`)
  allBanks.forEach((bank, index) => {
    const status = bank.isActive ? '🟢 Active' : '🔴 Inactive'
    console.log(`   ${index + 1}. ${bank.name} (${bank.code}) - ${status}`)
    console.log(`      Account: ${bank.accountNumber} | ${bank.accountName}`)
  })

  const activeBanks = allBanks.filter(bank => bank.isActive)
  console.log(`\n✨ ${activeBanks.length} active banks ready for use!`)
}

export async function seedAppSettings() {
  console.log('\n⚙️  Seeding App Settings...')
  
  try {
    // Check if AppSettings table exists
    await prisma.appSettings.findFirst()
    console.log('✅ AppSettings table exists, proceeding...')
  } catch (error: any) {
    if (error.message.includes('does not exist')) {
      console.log('❌ AppSettings table does not exist. Skipping app settings seed.')
      return
    }
    throw error
  }

  try {
    // First, get the first bank ID to use as default
    const firstBank = await prisma.bank.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    })

    const appSettings = await prisma.appSettings.upsert({
      where: { id: 'main-settings' },
      update: {
        singleBankMode: true, // Enable single bank mode
        defaultBankId: firstBank?.id,
        updatedAt: new Date()
      },
      create: {
        id: 'main-settings',
        appName: 'Perdami Store',
        appDescription: 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025. Nikmati kemudahan berbelanja online dan ambil langsung di venue event.',
        appLogo: '/images/logo.png',
        businessAddress: 'Venue PIT PERDAMI 2025, Bandung, Jawa Barat',
        pickupLocation: 'Venue PIT PERDAMI 2025',
        pickupCity: 'Bandung, Jawa Barat',
        eventName: 'PIT PERDAMI 2025',
        eventYear: '2025',
        copyrightText: '© 2025 Perdami Store. Dibuat khusus untuk PIT PERDAMI 2025.',
        copyrightSubtext: 'Semua hak cipta dilindungi.',
        isMaintenanceMode: false,
        singleBankMode: true, // Single bank enabled
        defaultBankId: firstBank?.id,
        isActive: true
      }
    })

    console.log('✅ App settings configured:')
    console.log(`   App Name: ${appSettings.appName}`)
    console.log(`   Single Bank Mode: ${appSettings.singleBankMode ? 'Enabled' : 'Disabled'}`)
    console.log(`   Default Bank ID: ${appSettings.defaultBankId || 'None'}`)
    console.log(`   Event: ${appSettings.eventName}`)

  } catch (error: any) {
    console.error('❌ Error seeding app settings:', error.message)
  }
}

// Main seed function
async function main() {
  console.log('🌱 Starting Bank & Settings Seed...')
  console.log('=====================================')
  
  try {
    await seedBanks()
    await seedAppSettings()
    
    console.log('\n🎉 SEED COMPLETED SUCCESSFULLY!')
    console.log('=====================================')
    console.log('✅ Bank data is ready')
    console.log('✅ App settings configured')
    console.log('\n💡 You can now test the banks API at: /api/banks')
    
  } catch (error: any) {
    console.error('\n❌ SEED FAILED!')
    console.error('=====================================')
    console.error('Error:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('1. Make sure database is connected')
    console.error('2. Run migrations: npx prisma migrate dev')
    console.error('3. Check DATABASE_URL in .env')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
