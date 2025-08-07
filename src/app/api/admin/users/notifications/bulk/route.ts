import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or staff
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser || !['ADMIN', 'STAFF'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin or Staff access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, userIds, settings, notificationData } = body

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Validate user IDs
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true }
    })

    if (users.length !== userIds.length) {
      return NextResponse.json({ error: 'Some users not found' }, { status: 404 })
    }

    let result = {}

    switch (action) {
      case 'enable_all':
        result = await enableAllNotifications(userIds)
        break
      case 'disable_all':
        result = await disableAllNotifications(userIds)
        break
      case 'enable_promo':
        result = await enablePromoNotifications(userIds)
        break
      case 'disable_promo':
        result = await disablePromoNotifications(userIds)
        break
      case 'custom_update':
        if (!settings) {
          return NextResponse.json({ error: 'Settings required for custom update' }, { status: 400 })
        }
        result = await customUpdateNotifications(userIds, settings)
        break
      case 'send_notification':
        if (!notificationData) {
          return NextResponse.json({ error: 'Notification data required' }, { status: 400 })
        }
        result = await sendBulkNotification(userIds, notificationData)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log the bulk action
    await prisma.userActivityLog.create({
      data: {
        userId: session.user.id || 'admin',
        action: 'BULK_NOTIFICATION_ACTION',
        resource: 'USER_NOTIFICATION_SETTINGS',
        details: `Admin performed bulk action: ${action} on ${userIds.length} users`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Bulk action completed successfully',
      result
    })

  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function enableAllNotifications(userIds: string[]) {
  const enabledSettings = {
    orderUpdates: true,
    paymentConfirmations: true,
    productAnnouncements: true,
    promotionalEmails: true,
    securityAlerts: true,
    accountUpdates: true,
  }

  for (const userId of userIds) {
    await prisma.userNotificationSettings.upsert({
      where: { userId },
      update: enabledSettings,
      create: { userId, ...enabledSettings }
    })
  }

  return { updated: userIds.length, action: 'enable_all' }
}

async function disableAllNotifications(userIds: string[]) {
  const disabledSettings = {
    orderUpdates: false,
    paymentConfirmations: false,
    productAnnouncements: false,
    promotionalEmails: false,
    securityAlerts: false,
    accountUpdates: false,
  }

  for (const userId of userIds) {
    await prisma.userNotificationSettings.upsert({
      where: { userId },
      update: disabledSettings,
      create: { userId, ...disabledSettings }
    })
  }

  return { updated: userIds.length, action: 'disable_all' }
}

async function enablePromoNotifications(userIds: string[]) {
  for (const userId of userIds) {
    await prisma.userNotificationSettings.upsert({
      where: { userId },
      update: { promotionalEmails: true },
      create: { 
        userId, 
        promotionalEmails: true,
        orderUpdates: true,
        paymentConfirmations: true,
        productAnnouncements: true,
        securityAlerts: true,
        accountUpdates: true,
      }
    })
  }

  return { updated: userIds.length, action: 'enable_promo' }
}

async function disablePromoNotifications(userIds: string[]) {
  for (const userId of userIds) {
    await prisma.userNotificationSettings.upsert({
      where: { userId },
      update: { promotionalEmails: false },
      create: { 
        userId, 
        promotionalEmails: false,
        orderUpdates: true,
        paymentConfirmations: true,
        productAnnouncements: true,
        securityAlerts: true,
        accountUpdates: true,
      }
    })
  }

  return { updated: userIds.length, action: 'disable_promo' }
}

async function customUpdateNotifications(userIds: string[], settings: any) {
  const validSettings = {
    orderUpdates: Boolean(settings.orderUpdates),
    paymentConfirmations: Boolean(settings.paymentConfirmations),
    productAnnouncements: Boolean(settings.productAnnouncements),
    promotionalEmails: Boolean(settings.promotionalEmails),
    securityAlerts: Boolean(settings.securityAlerts),
    accountUpdates: Boolean(settings.accountUpdates),
  }

  for (const userId of userIds) {
    await prisma.userNotificationSettings.upsert({
      where: { userId },
      update: validSettings,
      create: { userId, ...validSettings }
    })
  }

  return { updated: userIds.length, action: 'custom_update' }
}

async function sendBulkNotification(userIds: string[], notificationData: any) {
  const { type, message } = notificationData
  
  // In a real application, you would send actual notifications here
  // For now, we'll just log the action
  
  return { 
    sent: userIds.length, 
    action: 'send_notification',
    type,
    message
  }
}
