// API Route for Payment Reminders
// Admin endpoint to manually trigger payment reminders or check stats

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentReminderService } from '@/lib/services/payment-reminder.service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin akses diperlukan' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'send_reminders':
        const reminderResult = await paymentReminderService.sendPaymentReminders()
        return NextResponse.json({
          success: true,
          message: 'Payment reminders processed',
          result: reminderResult
        })

      case 'send_warnings':
        const warningResult = await paymentReminderService.sendPaymentDeadlineWarnings()
        return NextResponse.json({
          success: true,
          message: 'Payment deadline warnings processed',
          result: warningResult
        })

      case 'process_expired':
        const expiredResult = await paymentReminderService.processExpiredPayments()
        return NextResponse.json({
          success: true,
          message: 'Expired payments processed',
          result: expiredResult
        })

      case 'process_all':
        const allResult = await paymentReminderService.processAllPaymentReminders()
        return NextResponse.json({
          success: true,
          message: 'All payment reminders processed',
          result: allResult
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: send_reminders, send_warnings, process_expired, or process_all' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error processing payment reminders:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses payment reminders' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin akses diperlukan' },
        { status: 401 }
      )
    }

    const stats = await paymentReminderService.getPaymentReminderStats()
    
    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error getting payment reminder stats:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil statistik payment reminders' },
      { status: 500 }
    )
  }
}
