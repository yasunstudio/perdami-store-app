import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedBanksProduction() {
  console.log('🏦 Seeding Bank Data for Production...')
  
  try {
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
        isActive: false,
      }
    ]

    let createdCount = 0
    let updatedCount = 0

    for (const bankData of banksData) {
      try {
        await prisma.bank.upsert({
          where: { id: bankData.id },
          update: bankData,
          create: bankData
        })
        
        const existingBank = await prisma.bank.findUnique({ where: { id: bankData.id } })
        if (existingBank) {
          updatedCount++
        } else {
          createdCount++
        }
        
        console.log(`✅ Processed bank: ${bankData.name}`)
      } catch (error) {
        console.error(`❌ Error processing bank ${bankData.name}:`, error)
      }
    }

    console.log(`\n📊 Bank Seed Summary:`)
    console.log(`   Created: ${createdCount} banks`)
    console.log(`   Updated: ${updatedCount} banks`)

    // List all banks
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

    // Also seed app settings
    await prisma.appSettings.upsert({
      where: { id: 'default-settings' },
      update: {
        appName: 'Perdami Store',
        appDescription: 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025',
        eventName: 'PIT PERDAMI 2025',
        eventYear: '2025',
        singleBankMode: false,
        defaultBankId: 'bank-bri-perdami',
        isActive: true
      },
      create: {
        id: 'default-settings',
        appName: 'Perdami Store',
        appDescription: 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025',
        eventName: 'PIT PERDAMI 2025',
        eventYear: '2025',
        singleBankMode: false,
        defaultBankId: 'bank-bri-perdami',
        isActive: true
      }
    })

    console.log(`\n✅ App settings configured successfully!`)

  } catch (error) {
    console.error('❌ Error seeding banks:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  seedBanksProduction()
    .then(() => {
      console.log('\n🎉 PRODUCTION SEED COMPLETED SUCCESSFULLY!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error)
      process.exit(1)
    })
}
