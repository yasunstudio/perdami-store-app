import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.appSettings.findFirst()
    
    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        appName: 'Perdami Store',
        appDescription: 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025. Nikmati kemudahan berbelanja online dan ambil langsung di venue event.',
        appLogo: '/images/logo.png',
        businessAddress: 'Venue PIT PERDAMI 2025, Bandung, Jawa Barat',
        pickupLocation: 'Venue PIT PERDAMI 2025',
        pickupCity: 'Bandung, Jawa Barat',
        eventName: 'PIT PERDAMI 2025',
        eventYear: '2025',
        copyrightText: '© 2025 Perdami Store. Dibuat khusus untuk PIT PERDAMI 2025.',
        copyrightSubtext: 'Semua hak cipta dilindungi.',
        isMaintenanceMode: false,
        isActive: true,
      }
      return NextResponse.json(defaultSettings)
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching app settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch app settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    
    // Try to update existing settings or create new one
    const updatedSettings = await prisma.appSettings.upsert({
      where: { id: data.id || 'default' },
      update: data,
      create: { id: 'default', ...data }
    })
    
    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating app settings:', error)
    return NextResponse.json(
      { error: 'Failed to update app settings' },
      { status: 500 }
    )
  }
}
