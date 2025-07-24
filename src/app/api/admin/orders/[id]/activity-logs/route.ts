import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: orderId } = await params

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get all order activity logs
    const logs = await prisma.userActivityLog.findMany({
      where: {
        resource: 'ORDER',
        resourceId: orderId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      logs,
      total: logs.length
    })

  } catch (error) {
    console.error('Error fetching order activity logs:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil riwayat aktivitas' },
      { status: 500 }
    )
  }
}
