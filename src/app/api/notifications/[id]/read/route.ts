import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if notification exists and belongs to user
    const notification = await prisma.inAppNotification.findUnique({
      where: { id }
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mark as read
    const updatedNotification = await prisma.inAppNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    // Audit logging
    try {
      await auditLog.notificationRead(session.user.id, id)
    } catch (error) {
      console.error('Failed to log notification read:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notification: updatedNotification
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
