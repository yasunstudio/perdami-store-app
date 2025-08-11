import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all admin user IDs
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })
    const adminUserIds = adminUsers.map(user => user.id)

    // Mark all notifications as read for admin users
    const result = await prisma.inAppNotification.updateMany({
      where: { 
        userId: { in: adminUserIds },
        isRead: false
      },
      data: { isRead: true }
    })

    return NextResponse.json({ 
      success: true, 
      updatedCount: result.count 
    })

  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
