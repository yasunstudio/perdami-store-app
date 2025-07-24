import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'

// Schema validation untuk AppSettings
const appSettingsSchema = z.object({
  appName: z.string().min(1, 'Nama aplikasi wajib diisi').optional(),
  appDescription: z.string().min(1, 'Deskripsi aplikasi wajib diisi').optional(),
  appLogo: z.string().url('URL logo tidak valid').optional(),
  businessAddress: z.string().min(1, 'Alamat bisnis wajib diisi').optional(),
  pickupLocation: z.string().min(1, 'Lokasi pickup wajib diisi').optional(),
  pickupCity: z.string().min(1, 'Kota pickup wajib diisi').optional(),
  eventName: z.string().min(1, 'Nama event wajib diisi').optional(),
  eventYear: z.string().min(4, 'Tahun event minimal 4 karakter').max(4, 'Tahun event maksimal 4 karakter').optional(),
  copyrightText: z.string().min(1, 'Teks copyright wajib diisi').optional(),
  copyrightSubtext: z.string().min(1, 'Subteks copyright wajib diisi').optional(),
  isMaintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  isActive: z.boolean().optional()
})

// GET /api/admin/app-settings - Get all app settings
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.appSettings.findMany()
    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error) {
    console.error('Error fetching app settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/app-settings - Create new app settings
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = appSettingsSchema.parse(body)

    const settings = await prisma.appSettings.create({
      data: validatedData
    })

    // Audit logging
    try {
      await auditLog.updateSettings(session.user.id, validatedData)
    } catch (error) {
      console.error('Failed to log settings creation:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan aplikasi berhasil dibuat',
      data: settings
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating app settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/app-settings - Update app settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = appSettingsSchema.parse(body)

    const settings = await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: validatedData,
      create: { id: 'default', ...validatedData }
    })

    // Audit logging
    try {
      await auditLog.updateSettings(session.user.id, validatedData)
    } catch (error) {
      console.error('Failed to log settings update:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan aplikasi berhasil diperbarui',
      data: settings
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating app settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
