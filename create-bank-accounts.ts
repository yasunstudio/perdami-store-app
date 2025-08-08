import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleBankAccounts() {
  console.log('🏦 Creating Sample Bank Accounts...')
  
  try {
    // Create sample bank accounts
    const banks = await prisma.bank.createMany({
      data: [
        {
          name: 'Bank BRI - Perdami Store',
          code: 'BRI',
          accountNumber: '1234567890123456',
          accountName: 'PT Perdami Store Indonesia',
          isActive: true,
        },
        {
          name: 'Bank BCA - Perdami Store',
          code: 'BCA',
          accountNumber: '9876543210987654',
          accountName: 'PT Perdami Store Indonesia',
          isActive: true,
        },
        {
          name: 'Bank Mandiri - Perdami Store',
          code: 'MANDIRI',
          accountNumber: '5555666677778888',
          accountName: 'PT Perdami Store Indonesia',
          isActive: false,
        }
      ],
      skipDuplicates: true
    })
    
    console.log(`✅ Created ${banks.count} bank accounts`)
    
    // Set single bank mode to false (multiple banks enabled)
    await prisma.appSettings.upsert({
      where: { id: 'main' },
      update: { singleBankMode: false },
      create: {
        id: 'main',
        singleBankMode: false
      }
    })
    
    console.log('✅ Bank mode set to multiple banks')
    
    // Verify banks created
    const allBanks = await prisma.bank.findMany({
      where: { isActive: true }
    })
    
    console.log('\n🏦 Active Bank Accounts:')
    allBanks.forEach((bank, index) => {
      console.log(`${index + 1}. ${bank.name} (${bank.accountNumber})`)
    })
    
  } catch (error) {
    console.error('❌ Error creating bank accounts:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleBankAccounts().catch(console.error);
