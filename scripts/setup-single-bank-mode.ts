import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupSingleBankMode() {
  try {
    console.log('🔧 Setting up single bank mode...')

    // Check if we have any banks
    const banks = await prisma.bank.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    })

    if (banks.length === 0) {
      console.log('❌ No active banks found. Please add at least one bank first.')
      return
    }

    // Get or create app settings
    let appSettings = await prisma.appSettings.findFirst()

    if (!appSettings) {
      // Create new app settings with single bank mode enabled
      appSettings = await prisma.appSettings.create({
        data: {
          singleBankMode: true,
          defaultBankId: banks[0].id,
          appName: 'Perdami Store',
          appDescription: 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025'
        }
      })
      console.log('✅ Created new app settings with single bank mode enabled')
    } else {
      // Update existing app settings
      appSettings = await prisma.appSettings.update({
        where: { id: appSettings.id },
        data: {
          singleBankMode: true,
          defaultBankId: banks[0].id
        }
      })
      console.log('✅ Updated app settings to enable single bank mode')
    }

    console.log(`📱 Single bank mode configuration:`)
    console.log(`   - Single Bank Mode: ${appSettings.singleBankMode}`)
    console.log(`   - Default Bank: ${banks[0].name} (${banks[0].code})`)
    console.log(`   - Account: ${banks[0].accountName} - ${banks[0].accountNumber}`)

    if (banks.length > 1) {
      console.log(`\n💡 Note: Found ${banks.length} active banks. Only the first one will be used in single bank mode.`)
      console.log('   Other banks:')
      banks.slice(1).forEach((bank, index) => {
        console.log(`   ${index + 2}. ${bank.name} (${bank.code})`)
      })
    }

  } catch (error) {
    console.error('❌ Error setting up single bank mode:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupSingleBankMode()
