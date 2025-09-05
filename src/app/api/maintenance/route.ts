import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple endpoint to check maintenance status
// This runs in Node.js runtime, not Edge
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.appSettings.findFirst()
    return NextResponse.json({ 
      isMaintenanceMode: settings?.isMaintenanceMode ?? false,
      maintenanceMessage: settings?.maintenanceMessage ?? 'Website sedang dalam pemeliharaan'
    })
  } catch (error) {
    console.error('Error checking maintenance status:', error)
    // Default to maintenance mode on error to be safe
    return NextResponse.json({ 
      isMaintenanceMode: false,
      maintenanceMessage: 'Website sedang dalam pemeliharaan'
    })
  }
}
