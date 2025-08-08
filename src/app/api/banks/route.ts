import { DirectBankService } from '@/lib/direct-bank-service'
import { NextResponse } from 'next/server'

// GET /api/banks - Get available banks using direct PostgreSQL connection
export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('🏦 Banks API: Fetching banks using DirectBankService...')
    
    // Get active banks from database (with static fallback)
    const banks = await DirectBankService.getActiveBanks()
    
    // For now, assume single bank mode is disabled
    // You can enhance this later by adding an AppSettings table
    const singleBankMode = false
    
    const duration = Date.now() - startTime
    console.log(`✅ Banks API: Returned ${banks.length} banks in ${duration}ms`)

    return NextResponse.json({ 
      banks,
      singleBankMode,
      metadata: {
        count: banks.length,
        duration,
        timestamp: new Date().toISOString(),
        source: 'direct-postgresql'
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