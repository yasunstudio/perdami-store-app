import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notification-service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[STATUS UPDATE] Starting request for order:', params.id)
    
    const session = await auth()
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      console.log('[STATUS UPDATE] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = params.id
    const body = await request.json()
    console.log('[STATUS UPDATE] Request body:', body)
    
    const { status } = body

    if (!status) {
      console.log('[STATUS UPDATE] Missing status parameter')
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      console.log('[STATUS UPDATE] Invalid status:', status)
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get current order to compare status
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderStatus: true }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        orderStatus: status,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        },
        orderItems: {
          include: {
            bundle: {
              select: { name: true }
            }
          }
        }
      }
    })

    // Create notification for status change
    try {
      await NotificationService.notifyOrderStatusChange(
        orderId, 
        status, 
        currentOrder.orderStatus
      )
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError)
      // Don't fail the main operation if notification fails
    }

    // Log the status change activity
    try {
      await prisma.userActivityLog.create({
        data: {
          userId: session.user.id!,
          action: 'ORDER_STATUS_UPDATE',
          resource: 'ORDER',
          resourceId: orderId,
          details: `Updated order ${updatedOrder.orderNumber} status from ${currentOrder.orderStatus} to ${status}`
        }
      })
    } catch (logError) {
      console.error('Failed to log activity:', logError)
      // Don't fail the main operation if logging fails
    }

    return NextResponse.json(updatedOrder)

  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
