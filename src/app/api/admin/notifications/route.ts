import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    // Get all admin user IDs
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })
    const adminUserIds = adminUsers.map(user => user.id)

    // Get real notifications from in_app_notifications table
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.inAppNotification.findMany({
        where: { 
          userId: { in: adminUserIds },
          // Filter for admin-specific notification types
          type: { 
            in: [
              'ORDER_UPDATE', 
              'PAYMENT_REMINDER', 
              'GENERAL'
            ] 
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.inAppNotification.count({ 
        where: { 
          userId: { in: adminUserIds },
          type: { 
            in: [
              'ORDER_UPDATE', 
              'PAYMENT_REMINDER', 
              'GENERAL'
            ] 
          }
        }
      }),
      prisma.inAppNotification.count({ 
        where: { 
          userId: { in: adminUserIds },
          isRead: false,
          type: { 
            in: [
              'ORDER_UPDATE', 
              'PAYMENT_REMINDER', 
              'GENERAL'
            ] 
          }
        }
      })
    ])    // Transform notifications for admin UI
    const formattedNotifications = notifications.map(notification => {
      const data = notification.data as any || {}
      
      return {
        id: notification.id,
        orderNumber: data.orderNumber || '',
        customerName: data.customerName || '',
        type: getNotificationTypeMapping(notification.type),
        message: notification.message,
        orderStatus: data.orderStatus || '',
        paymentStatus: data.paymentStatus || '',
        totalAmount: data.totalAmount || 0,
        createdAt: notification.createdAt.toISOString(),
        isRead: notification.isRead
      }
    })

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      total,
      unreadCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching admin notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Mark admin notification as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      // Mark all admin notifications as read
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      })
      const adminUserIds = adminUsers.map(user => user.id)

      await prisma.inAppNotification.updateMany({
        where: { 
          userId: { in: adminUserIds },
          isRead: false,
          type: { 
            in: [
              'ORDER_UPDATE', 
              'PAYMENT_REMINDER', 
              'GENERAL'
            ] 
          }
        },
        data: { isRead: true, readAt: new Date() }
      })
    } else if (notificationId) {
      // Mark specific notification as read
      await prisma.inAppNotification.updateMany({
        where: { 
          id: notificationId,
          type: { 
            in: [
              'ORDER_UPDATE', 
              'PAYMENT_REMINDER', 
              'GENERAL'
            ] 
          }
        },
        data: { isRead: true, readAt: new Date() }
      })
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating admin notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete admin notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    // Delete specific notification
    const deletedNotification = await prisma.inAppNotification.delete({
      where: { 
        id: notificationId
      }
    })

    if (!deletedNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting admin notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getOrderStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    PENDING: 'Menunggu',
    CONFIRMED: 'Dikonfirmasi',
    READY: 'Siap',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan'
  }
  return statusLabels[status] || status
}

function getNotificationTypeMapping(notificationType: string): 'new_order' | 'payment_received' | 'status_change' | 'stock_alert' | 'system_alert' {
  const typeMapping: Record<string, 'new_order' | 'payment_received' | 'status_change' | 'stock_alert' | 'system_alert'> = {
    'ORDER_UPDATE': 'status_change',
    'PAYMENT_REMINDER': 'payment_received',
    'GENERAL': 'system_alert'
  }
  return typeMapping[notificationType] || 'system_alert'
}