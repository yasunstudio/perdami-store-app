import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🏦 Starting Production Bank Seed...')
    
    // Bank data to seed
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
    const processedBanks = []

    for (const bankData of banksData) {
      try {
        const existingBank = await prisma.bank.findUnique({ 
          where: { id: bankData.id } 
        })

        const result = await prisma.bank.upsert({
          where: { id: bankData.id },
          update: bankData,
          create: bankData
        })

        if (existingBank) {
          updatedCount++
        } else {
          createdCount++
        }

        processedBanks.push(result)
        console.log(`✅ Processed bank: ${bankData.name}`)
      } catch (error) {
        console.error(`❌ Error processing bank ${bankData.name}:`, error)
      }
    }

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

    // Get all banks for response
    const allBanks = await prisma.bank.findMany({
      orderBy: { name: 'asc' }
    })

    const activeBanks = allBanks.filter(bank => bank.isActive)

    console.log(`\n🎉 Production seed completed successfully!`)
    console.log(`   Created: ${createdCount} banks`)
    console.log(`   Updated: ${updatedCount} banks`)
    console.log(`   Active banks: ${activeBanks.length}`)

    return NextResponse.json({
      success: true,
      message: 'Bank data seeded successfully',
      summary: {
        created: createdCount,
        updated: updatedCount,
        totalBanks: allBanks.length,
        activeBanks: activeBanks.length
      },
      banks: allBanks
    })

  } catch (error) {
    console.error('❌ Error seeding production banks:', error)
    return NextResponse.json({
      error: 'Failed to seed bank data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
