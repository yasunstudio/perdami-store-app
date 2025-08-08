import { createPrismaClient } from '@/lib/prisma-serverless'
import { SingleBankService } from '@/lib/single-bank-serverless'
import { NextResponse } from 'next/server'
import { withDatabaseRetry, createErrorResponse } from '@/lib/database-utils'

// GET /api/banks - Get available banks based on single bank mode setting
export async function GET() {
  try {
    const result = await withDatabaseRetry(async () => {
      return await SingleBankService.getAvailableBanks()
    });

    const singleBankMode = await withDatabaseRetry(async () => {
      return await SingleBankService.isSingleBankModeEnabled()
    });

    return NextResponse.json({ 
      banks: result,
      singleBankMode
    })
  } catch (error) {
    return createErrorResponse(error, 'GET /api/banks')
  }
}