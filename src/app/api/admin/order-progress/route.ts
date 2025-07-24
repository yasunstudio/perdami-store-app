// Admin API for Order Progress Management
// Handles order preparation, delays, and pickup notifications

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { orderProgressService } from '@/lib/services/order-progress.service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Staff access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, orderId, ...data } = body

    if (!action || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, orderId' },
        { status: 400 }
      )
    }

    console.log(`🔄 Processing order progress action: ${action} for order: ${orderId}`)

    let result

    switch (action) {
      case 'start_preparation':
        result = await orderProgressService.markPreparationStarted({
          orderId,
          estimatedTime: data.estimatedTime,
          notes: data.notes
        })
        break

      case 'complete_preparation':
        result = await orderProgressService.markPreparationComplete({
          orderId,
          pickupTime: data.pickupTime,
          notes: data.notes
        })
        break

      case 'mark_delayed':
        if (!data.reason) {
          return NextResponse.json(
            { error: 'Reason is required for delay notification' },
            { status: 400 }
          )
        }
        result = await orderProgressService.markOrderDelayed({
          orderId,
          reason: data.reason,
          newEstimatedTime: data.newEstimatedTime,
          notes: data.notes
        })
        break

      case 'ready_for_pickup':
        if (!data.pickupLocation || !data.pickupHours) {
          return NextResponse.json(
            { error: 'Pickup location and hours are required' },
            { status: 400 }
          )
        }
        result = await orderProgressService.markReadyForPickup({
          orderId,
          pickupLocation: data.pickupLocation,
          pickupHours: data.pickupHours,
          notes: data.notes
        })
        break

      case 'send_pickup_reminders':
        result = await orderProgressService.sendPickupReminders()
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      action,
      orderId: action === 'send_pickup_reminders' ? undefined : orderId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in order progress API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Staff access required' },
        { status: 401 }
      )
    }

    const stats = await orderProgressService.getOrderProgressStats()

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error getting order progress stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get order progress statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
