// API for user notifications
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-serverless'
import { notificationService } from '@/lib/notification'
import { auditLog } from '@/lib/audit'

// GET - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create fresh prisma client for serverless environment to avoid prepared statement conflicts
    const prisma = createPrismaClient()
    
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      // Fetch user notifications from database
      const [notifications, total] = await Promise.all([
        prisma.inAppNotification.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.inAppNotification.count({
          where: { userId: session.user.id }
        })
      ])

      const unreadCount = await prisma.inAppNotification.count({
        where: { 
          userId: session.user.id,
          isRead: false 
        }
      })

      const result = {
        notifications,
        total,
        unreadCount,
        hasMore: total > page * limit
      }

      return NextResponse.json({
        success: true,
        ...result
      })
    } finally {
      // Clean up prisma client
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create fresh prisma client for serverless environment to avoid prepared statement conflicts
    const prisma = createPrismaClient()
    
    try {
      const body = await request.json()
      const { notificationId, markAllRead } = body

      if (markAllRead) {
        // Mark all notifications as read for the user
        await prisma.inAppNotification.updateMany({
          where: { 
            userId: session.user.id,
            isRead: false
          },
          data: { 
            isRead: true,
            readAt: new Date()
          }
        })
        await auditLog.notificationRead(session.user.id, 'all', { action: 'mark_all_read' })
      } else if (notificationId) {
        // Mark specific notification as read
        await prisma.inAppNotification.updateMany({
          where: { 
            id: notificationId,
            userId: session.user.id // Ensure user can only mark their own notifications
          },
          data: { 
            isRead: true,
            readAt: new Date()
          }
        })
        await auditLog.notificationRead(session.user.id, notificationId, { action: 'mark_single_read' })
      } else {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    } finally {
      // Clean up prisma client
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    // await notificationService.deleteNotification(notificationId, session.user.id)
    console.log('Delete notification not implemented yet')
    await auditLog.notificationRead(session.user.id, notificationId, { action: 'delete' })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
