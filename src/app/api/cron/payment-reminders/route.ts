// Cron Job API Route for Payment Reminders
// This should be called by a cron service every 30 minutes

import { NextRequest, NextResponse } from 'next/server'
import { paymentReminderService } from '@/lib/services/payment-reminder.service'

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

    console.log('🔄 Starting payment reminder cron job...')
    
    const result = await paymentReminderService.processAllPaymentReminders()
    
    console.log('✅ Payment reminder cron job completed:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Payment reminder cron job completed',
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in payment reminder cron job:', error)
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

    const stats = await paymentReminderService.getPaymentReminderStats()
    
    return NextResponse.json({
      success: true,
      message: 'Payment reminder cron status',
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error getting cron status:', error)
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
