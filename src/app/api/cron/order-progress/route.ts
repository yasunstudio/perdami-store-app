// Cron Job API Route for Order Progress Updates
// This should be called by a cron service every hour for pickup reminders

import { NextRequest, NextResponse } from 'next/server'
import { orderProgressService } from '@/lib/services/order-progress.service'

export async function POST(request: NextRequest) {
  try {
    // Simple security check with API key or secret
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      )
    }

    console.log('🔄 Starting order progress cron job...')
    
    const result = await orderProgressService.processOrderProgressUpdates()
    
    console.log('✅ Order progress cron job completed:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Order progress cron job completed',
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in order progress cron job:', error)
    return NextResponse.json(
      { 
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Simple security check with API key or secret
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      )
    }

    const stats = await orderProgressService.getOrderProgressStats()
    
    return NextResponse.json({
      success: true,
      message: 'Order progress cron status',
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error getting order progress cron status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get cron status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
