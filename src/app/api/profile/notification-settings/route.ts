import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Enhanced validation schema
const notificationSettingsSchema = z.object({
  orderUpdates: z.boolean(),
  paymentConfirmations: z.boolean(),
  productAnnouncements: z.boolean(),
  promotionalEmails: z.boolean(),
  securityAlerts: z.boolean(),
  accountUpdates: z.boolean()
})

// Partial update schema for PATCH requests
const partialNotificationSettingsSchema = z.object({
  orderUpdates: z.boolean().optional(),
  paymentConfirmations: z.boolean().optional(),
  productAnnouncements: z.boolean().optional(),
  promotionalEmails: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  accountUpdates: z.boolean().optional()
})

// Default settings
const DEFAULT_SETTINGS = {
  orderUpdates: true,
  paymentConfirmations: true,
  productAnnouncements: true,
  promotionalEmails: false,
  securityAlerts: true,
  accountUpdates: true
}

// GET - Retrieve notification settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Unauthorized',
          settings: DEFAULT_SETTINGS // Return defaults for unauthenticated users
        },
        { status: 401 }
      )
    }

    // First check if the user exists in the database
    const userExists = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true
      }
    })

    if (!userExists) {
      console.warn(`User ${session.user.id} not found in database for notification settings`)
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS
      })
    }

    // Check if user has notification settings
    let settings = await prisma.userNotificationSettings.findUnique({
      where: {
        userId: session.user.id
      }
    })

    // If no settings exist, create default settings
    if (!settings) {
      try {
        settings = await prisma.userNotificationSettings.create({
          data: {
            userId: session.user.id,
            ...DEFAULT_SETTINGS
          }
        })
      } catch (error) {
        console.error('Error creating notification settings:', error)
        // Return default settings if creation fails
        return NextResponse.json({
          success: true,
          settings: DEFAULT_SETTINGS
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan notifikasi berhasil dimuat',
      settings: {
        orderUpdates: settings.orderUpdates,
        paymentConfirmations: settings.paymentConfirmations,
        productAnnouncements: settings.productAnnouncements,
        promotionalEmails: settings.promotionalEmails,
        securityAlerts: settings.securityAlerts,
        accountUpdates: settings.accountUpdates
      }
    })

  } catch (error: any) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Gagal mengambil pengaturan notifikasi',
        settings: DEFAULT_SETTINGS
      },
      { status: 500 }
    )
  }
}

// PUT - Update notification settings (full update)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Unauthorized' 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = notificationSettingsSchema.parse(body)

    // First check if the user exists in the database
    const userExists = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true
      }
    })

    if (!userExists) {
      console.warn(`User ${session.user.id} not found in database for notification settings update`)
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    // Ensure required settings cannot be disabled
    const finalSettings = {
      ...validatedData,
      orderUpdates: true, // Always required
      paymentConfirmations: true, // Always required
      securityAlerts: true, // Always required
    }

    // Upsert notification settings
    const settings = await prisma.userNotificationSettings.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        ...finalSettings,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        ...finalSettings
      }
    })

    // Log the settings change
    await prisma.userActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_NOTIFICATION_SETTINGS',
        resource: 'USER_SETTINGS',
        resourceId: settings.id,
        details: `Updated notification preferences: ${Object.entries(validatedData)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')}`
      }
    }).catch(error => {
      console.warn('Failed to log notification settings update:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Pengaturan notifikasi berhasil disimpan',
      settings: {
        orderUpdates: settings.orderUpdates,
        paymentConfirmations: settings.paymentConfirmations,
        productAnnouncements: settings.productAnnouncements,
        promotionalEmails: settings.promotionalEmails,
        securityAlerts: settings.securityAlerts,
        accountUpdates: settings.accountUpdates
      }
    })

  } catch (error: any) {
    console.error('Error updating notification settings:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false,
          message: 'Data tidak valid',
          errors: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        message: 'Gagal menyimpan pengaturan notifikasi' 
      },
      { status: 500 }
    )
  }
}

// PATCH - Partial update notification settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Unauthorized' 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = partialNotificationSettingsSchema.parse(body)

    // Get current settings
    let currentSettings = await prisma.userNotificationSettings.findUnique({
      where: {
        userId: session.user.id
      }
    })

    // Create default settings if none exist
    if (!currentSettings) {
      currentSettings = await prisma.userNotificationSettings.create({
        data: {
          userId: session.user.id,
          ...DEFAULT_SETTINGS
        }
      })
    }

    // Merge with current settings, ensuring required settings stay true
    const updatedSettings = {
      ...currentSettings,
      ...validatedData,
      orderUpdates: validatedData.orderUpdates ?? currentSettings.orderUpdates,
      paymentConfirmations: validatedData.paymentConfirmations ?? currentSettings.paymentConfirmations,
      securityAlerts: validatedData.securityAlerts ?? currentSettings.securityAlerts,
    }

    // Ensure required settings cannot be disabled
    updatedSettings.orderUpdates = true
    updatedSettings.paymentConfirmations = true
    updatedSettings.securityAlerts = true

    // Update settings
    const settings = await prisma.userNotificationSettings.update({
      where: {
        userId: session.user.id
      },
      data: {
        orderUpdates: updatedSettings.orderUpdates,
        paymentConfirmations: updatedSettings.paymentConfirmations,
        productAnnouncements: updatedSettings.productAnnouncements,
        promotionalEmails: updatedSettings.promotionalEmails,
        securityAlerts: updatedSettings.securityAlerts,
        accountUpdates: updatedSettings.accountUpdates,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pengaturan notifikasi berhasil diperbarui',
      settings: {
        orderUpdates: settings.orderUpdates,
        paymentConfirmations: settings.paymentConfirmations,
        productAnnouncements: settings.productAnnouncements,
        promotionalEmails: settings.promotionalEmails,
        securityAlerts: settings.securityAlerts,
        accountUpdates: settings.accountUpdates
      }
    })

  } catch (error: any) {
    console.error('Error partially updating notification settings:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false,
          message: 'Data tidak valid',
          errors: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        message: 'Gagal memperbarui pengaturan notifikasi' 
      },
      { status: 500 }
    )
  }
}