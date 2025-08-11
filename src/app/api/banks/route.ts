import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/banks - Get available banks and app settings
export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('🏦 Banks API: Fetching banks and app settings using Prisma...')
    
    // Get app settings for single bank mode
    const appSettings = await prisma.appSettings.findFirst({
      where: { isActive: true },
      select: {
        singleBankMode: true,
        defaultBankId: true
      }
    })
    
    // Get active banks from database using Prisma
    const banks = await prisma.bank.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        accountNumber: true,
        accountName: true,
        logo: true,
        isActive: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    const singleBankMode = appSettings?.singleBankMode ?? true // Default to true for single bank mode
    const defaultBankId = appSettings?.defaultBankId
    
    // If single bank mode is enabled, ensure we only have one active bank
    let finalBanks = banks
    if (singleBankMode) {
      if (defaultBankId) {
        // Use the default bank if specified
        const defaultBank = banks.find(bank => bank.id === defaultBankId)
        finalBanks = defaultBank ? [defaultBank] : [banks[0]]
      } else {
        // Use the first bank
        finalBanks = [banks[0]]
      }
    }
    
    const duration = Date.now() - startTime
    console.log(`✅ Banks API: Returned ${finalBanks.length} banks (singleBankMode: ${singleBankMode}) in ${duration}ms`)
    console.log(`   Default Bank ID: ${defaultBankId}`)
    if (finalBanks.length > 0) {
      console.log(`   Selected Bank: ${finalBanks[0].name} (${finalBanks[0].code})`)
    }

    return NextResponse.json({ 
      banks: finalBanks,
      singleBankMode,
      defaultBankId,
      metadata: {
        count: finalBanks.length,
        totalBanks: banks.length,
        duration,
        timestamp: new Date().toISOString(),
        source: 'prisma-direct'
      }
    })
    
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('❌ Banks API: Error:', error.message)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch banks',
        message: error.message,
        metadata: {
          duration,
          timestamp: new Date().toISOString(),
          source: 'error'
        }
      },
      { status: 500 }
    )
  }
}