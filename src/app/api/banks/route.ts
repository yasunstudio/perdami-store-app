import { prisma } from '@/lib/prisma'
import { SingleBankService } from '@/lib/single-bank'
import { NextResponse } from 'next/server'

// GET /api/banks - Get available banks based on single bank mode setting
export async function GET() {
  try {
    const banks = await SingleBankService.getAvailableBanks()

    return NextResponse.json({ 
      banks,
      singleBankMode: await SingleBankService.isSingleBankModeEnabled()
    })
  } catch (error) {
    console.error('Error fetching banks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banks' },
      { status: 500 }
    )
  }
}