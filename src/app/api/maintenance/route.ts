import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple endpoint to check maintenance status
// This runs in Node.js runtime, not Edge
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.appSettings.findFirst()
    
    const defaultMessage = `🔧 Order Tutup Sementara - Dibuka Besok Pagi

Mohon maaf, sistem pemesanan Perdami Store ditutup sementara untuk persiapan event.

📅 Order akan dibuka kembali: BESOK PAGI
⏰ Estimasi waktu: Sekitar pukul 07:00 WIB

Kami sedang mempersiapkan segala sesuatu agar proses pemesanan berjalan lancar di hari event.

Terima kasih atas kesabaran Anda! 🙏`

    return NextResponse.json({ 
      isMaintenanceMode: settings?.isMaintenanceMode ?? false,
      maintenanceMessage: settings?.maintenanceMessage ?? defaultMessage
    })
  } catch (error) {
    console.error('Error checking maintenance status:', error)
    // Default to maintenance mode on error to be safe
    const fallbackMessage = `🔧 Order Tutup Sementara - Dibuka Besok Pagi

Mohon maaf, sistem pemesanan Perdami Store ditutup sementara untuk persiapan event.

📅 Order akan dibuka kembali: BESOK PAGI
⏰ Estimasi waktu: Sekitar pukul 07:00 WIB

Kami sedang mempersiapkan segala sesuatu agar proses pemesanan berjalan lancar di hari event.

Terima kasih atas kesabaran Anda! 🙏`

    return NextResponse.json({ 
      isMaintenanceMode: false,
      maintenanceMessage: fallbackMessage
    })
  }
}
