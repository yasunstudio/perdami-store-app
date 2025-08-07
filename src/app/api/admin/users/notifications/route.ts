// Admin API for User Notifications Management
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch users with their notification settings for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or staff
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser || !['ADMIN', 'STAFF'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin or Staff access required' },
        { status: 403 }
      )
    }

    // Fetch all users with their notification settings
    const users = await prisma.user.findMany({
      include: {
        notificationSettings: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform users to match the expected interface
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      notificationSettings: user.notificationSettings ? {
        orderUpdates: user.notificationSettings.orderUpdates,
        paymentConfirmations: user.notificationSettings.paymentConfirmations,
        productAnnouncements: user.notificationSettings.productAnnouncements,
        promotionalEmails: user.notificationSettings.promotionalEmails,
        securityAlerts: user.notificationSettings.securityAlerts,
        accountUpdates: user.notificationSettings.accountUpdates,
      } : undefined
    }))

    // Calculate statistics
    const totalUsers = users.length
    const usersWithSettings = users.filter(user => user.notificationSettings)
    const activeNotifications = usersWithSettings.filter(user => 
      user.notificationSettings && Object.values(user.notificationSettings).some(setting => 
        typeof setting === 'boolean' && setting
      )
    ).length
    
    const optedInPromo = usersWithSettings.filter(user => 
      user.notificationSettings?.promotionalEmails
    ).length

    // Recent activity (users who updated settings in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentActivity = usersWithSettings.filter(user => 
      user.notificationSettings && 
      new Date(user.notificationSettings.updatedAt) > sevenDaysAgo
    ).length

    // Format users data
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      notificationSettings: user.notificationSettings ? {
        orderUpdates: user.notificationSettings.orderUpdates,
        paymentConfirmations: user.notificationSettings.paymentConfirmations,
        productAnnouncements: user.notificationSettings.productAnnouncements,
        promotionalEmails: user.notificationSettings.promotionalEmails,
        securityAlerts: user.notificationSettings.securityAlerts,
        accountUpdates: user.notificationSettings.accountUpdates,
        updatedAt: user.notificationSettings.updatedAt
      } : null
    }))

    const stats = {
      totalUsers,
      activeNotifications,
      optedInPromo,
      recentActivity
    }

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      stats,
      message: 'User notification data retrieved successfully'
    })

  } catch (error) {
    console.error('Error fetching user notifications:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch user notification data',
        users: [],
        stats: {
          totalUsers: 0,
          activeNotifications: 0,
          optedInPromo: 0,
          recentActivity: 0
        }
      },
      { status: 500 }
    )
  }
}

// POST - Send bulk notification (future implementation)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or staff (limited bulk actions for staff)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser || !['ADMIN', 'STAFF'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin or Staff access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userIds, subject, message, type } = body

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User IDs array is required' },
        { status: 400 }
      )
    }

    if (!subject || !message || !type) {
      return NextResponse.json(
        { success: false, message: 'Subject, message, and type are required' },
        { status: 400 }
      )
    }

    // TODO: Implement bulk notification sending
    // This would integrate with email service or push notification service
    
    // For now, create in-app notifications for each user
    const notifications = await Promise.all(
      userIds.map(async (userId) => {
        return await prisma.inAppNotification.create({
          data: {
            userId,
            type: 'ADMIN_MESSAGE',
            title: subject,
            message,
            isRead: false,
          }
        })
      })
    )
    
    // Log the activity
    await prisma.userActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'SEND_BULK_NOTIFICATION',
        resource: 'NOTIFICATION',
        details: `Sent ${type} notification to ${userIds.length} users: "${subject}"`
      }
    })

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${userIds.length} users`,
      sent: userIds.length,
      notifications: notifications.length
    })

  } catch (error) {
    console.error('Error sending bulk notification:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
