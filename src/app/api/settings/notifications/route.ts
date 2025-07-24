import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const notificationSettingsSchema = z.object({
  orderUpdates: z.boolean(),
  paymentConfirmations: z.boolean(),
  securityAlerts: z.boolean(),
  accountUpdates: z.boolean(),
  productAnnouncements: z.boolean(),
  promotionalEmails: z.boolean(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const settings = await prisma.userNotificationSettings.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { id: true, name: true, email: true } } }
    })

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await prisma.userNotificationSettings.create({
        data: {
          userId: session.user.id,
          orderUpdates: true,
          paymentConfirmations: true,
          securityAlerts: true,
          accountUpdates: true,
          productAnnouncements: true,
          promotionalEmails: false,
        },
        include: { user: { select: { id: true, name: true, email: true } } }
      })
      
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = notificationSettingsSchema.parse(body)

    const settings = await prisma.userNotificationSettings.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
        ...validatedData
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    })

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings
    })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}
