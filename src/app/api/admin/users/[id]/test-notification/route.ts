import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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
    const { type, message } = body

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate notification type
    const validTypes = ['order', 'payment', 'product', 'promo', 'security', 'account']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    // Create test notification log
    await prisma.userActivityLog.create({
      data: {
        userId: id,
        action: 'TEST_NOTIFICATION_SENT',
        resource: 'USER_NOTIFICATION',
        details: `Admin sent test notification (${type}) to user ${user.email}: ${message}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    // In a real application, you would send the actual notification here
    // For now, we'll just simulate it
    const testMessage = message || getDefaultTestMessage(type)
    
    return NextResponse.json({
      message: 'Test notification sent successfully',
      details: {
        type,
        recipient: user.email,
        testMessage,
        sentAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getDefaultTestMessage(type: string): string {
  const messages = {
    order: 'Pesanan Anda #TEST-001 telah dikonfirmasi dan sedang diproses.',
    payment: 'Pembayaran Anda sebesar Rp 100.000 telah diterima.',
    product: 'Produk baru "Test Product" telah ditambahkan ke katalog.',
    promo: 'Dapatkan diskon 20% untuk pembelian berikutnya!',
    security: 'Login baru terdeteksi dari perangkat tidak dikenal.',
    account: 'Profil akun Anda telah diperbarui.'
  }
  return messages[type as keyof typeof messages] || 'Ini adalah notifikasi uji coba.'
}
