import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.email !== 'admin@perdami.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()

    // Validate notification settings
    const validSettings = {
      orderUpdates: Boolean(body.orderUpdates),
      paymentConfirmations: Boolean(body.paymentConfirmations),
      productAnnouncements: Boolean(body.productAnnouncements),
      promotionalEmails: Boolean(body.promotionalEmails),
      securityAlerts: Boolean(body.securityAlerts),
      accountUpdates: Boolean(body.accountUpdates),
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update or create notification settings
    const notificationSettings = await prisma.userNotificationSettings.upsert({
      where: { userId: id },
      update: validSettings,
      create: {
        userId: id,
        ...validSettings
      }
    })

    // Log the activity
    await prisma.userActivityLog.create({
      data: {
        userId: id,
        action: 'NOTIFICATION_SETTINGS_UPDATED',
        resource: 'USER_NOTIFICATION_SETTINGS',
        details: `Admin updated notification settings for user ${user.email}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      settings: notificationSettings
    })

  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.email !== 'admin@perdami.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        notificationSettings: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
