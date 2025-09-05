import { NextResponse } from 'next/server'
import { getMaintenanceSettings } from '@/lib/maintenance'

export async function GET() {
  try {
    const settings = await getMaintenanceSettings()
    
    const status = {
      isMaintenanceMode: settings?.isMaintenanceMode ?? false,
      message: settings?.maintenanceMessage || 'Sistem sedang dalam pemeliharaan',
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching maintenance status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch maintenance status',
        isMaintenanceMode: false,
        message: 'Status tidak dapat dimuat',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
