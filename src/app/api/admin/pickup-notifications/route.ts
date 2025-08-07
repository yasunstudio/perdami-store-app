// API for manual pickup notification triggers
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pickupScheduler } from '@/lib/pickup-scheduler'
import { notificationService } from '@/lib/notification'

// POST - Manual trigger pickup notifications
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, orderId, targetDate } = body

    console.log('🔔 Manual pickup notification trigger:', { action, orderId, targetDate })

    switch (action) {
      case 'h1_reminders':
        await pickupScheduler.sendH1PickupReminders()
        return NextResponse.json({ 
          success: true, 
          message: 'H-1 pickup reminders sent successfully' 
        })

      case 'today_reminders':
        await pickupScheduler.sendTodayPickupReminders()
        return NextResponse.json({ 
          success: true, 
          message: 'Today pickup reminders sent successfully' 
        })

      case 'pickup_ready':
        if (!orderId) {
          return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }
        await pickupScheduler.sendPickupReadyNotification(orderId)
        return NextResponse.json({ 
          success: true, 
          message: 'Pickup ready notification sent successfully' 
        })

      case 'pickup_completed':
        if (!orderId) {
          return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }
        await pickupScheduler.sendPickupCompletedNotification(orderId)
        return NextResponse.json({ 
          success: true, 
          message: 'Pickup completed notification sent successfully' 
        })

      case 'reminders_for_date':
        if (!targetDate) {
          return NextResponse.json({ error: 'Target date is required' }, { status: 400 })
        }
        await pickupScheduler.sendPickupRemindersForDate(new Date(targetDate))
        return NextResponse.json({ 
          success: true, 
          message: `Pickup reminders sent for ${targetDate}` 
        })

      case 'test_notification':
        if (!orderId) {
          return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }
        // Send test pickup reminder
        await notificationService.notifyPickupReminderToday(orderId)
        return NextResponse.json({ 
          success: true, 
          message: 'Test pickup notification sent successfully' 
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Error in pickup notifications API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get pickup notification statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // Get pickup notification statistics
      const { prisma } = await import('@/lib/prisma')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const endOfTomorrow = new Date(tomorrow)
      endOfTomorrow.setHours(23, 59, 59, 999)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const endOfToday = new Date(today)
      endOfToday.setHours(23, 59, 59, 999)

      const [ordersForTomorrow, ordersForToday, recentNotifications] = await Promise.all([
        prisma.order.count({
          where: {
            pickupDate: {
              gte: tomorrow,
              lte: endOfTomorrow
            },
            orderStatus: {
              in: ['CONFIRMED', 'PROCESSING', 'READY']
            },
            pickupStatus: 'NOT_PICKED_UP'
          }
        }),
        prisma.order.count({
          where: {
            pickupDate: {
              gte: today,
              lte: endOfToday
            },
            orderStatus: {
              in: ['CONFIRMED', 'PROCESSING', 'READY']
            },
            pickupStatus: 'NOT_PICKED_UP'
          }
        }),
        prisma.inAppNotification.count({
          where: {
            type: {
              in: ['PICKUP_REMINDER_H1', 'PICKUP_REMINDER_TODAY', 'PICKUP_READY', 'PICKUP_COMPLETED']
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          ordersForTomorrow,
          ordersForToday,
          recentNotifications,
          lastUpdated: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('❌ Error in pickup notifications stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
