import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get all admin user IDs for notifications
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })
    const adminUserIds = adminUsers.map(user => user.id)

    // Fetch all stats in parallel
    const [
      pendingOrders,
      unreadNotifications,
      activeStores,
      todayOrders
    ] = await Promise.all([
      // Pending orders count
      prisma.order.count({
        where: { orderStatus: 'PENDING' }
      }),
      
      // Unread notifications count for admin users
      prisma.inAppNotification.count({
        where: { 
          userId: { in: adminUserIds },
          isRead: false
        }
      }),
      
      // Active stores count (all stores are considered active for now)
      prisma.store.count(),
      
      // Today's orders for revenue calculation
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          },
          paymentStatus: 'PAID'
        },
        select: { totalAmount: true }
      })
    ])

    // Calculate today's revenue
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0)

    const quickStats = {
      pendingOrders,
      unreadNotifications,
      activeStores,
      todayRevenue,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(quickStats)

  } catch (error) {
    console.error('Error fetching quick stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
