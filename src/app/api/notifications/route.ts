// API for user notifications
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { notificationService } from '@/lib/notification'
import { auditLog } from '@/lib/audit'

// GET - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // const result = await notificationService.getUserNotifications(session.user.id, page, limit)
    const result = {
      notifications: [],
      total: 0,
      hasMore: false
    }

    return NextResponse.json({
      success: true,
      ...result
    })
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

    const body = await request.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      // await notificationService.markAllAsRead(session.user.id)
      console.log('Mark all as read not implemented yet')
      await auditLog.notificationRead(session.user.id, 'all', { action: 'mark_all_read' })
    } else if (notificationId) {
      // await notificationService.markAsRead(notificationId, session.user.id)
      console.log('Mark as read not implemented yet')
      await auditLog.notificationRead(session.user.id, notificationId, { action: 'mark_single_read' })
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
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
