import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID diperlukan' },
        { status: 400 }
      )
    }

    // Check if user has access to this order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order tidak ditemukan' },
        { status: 404 }
      )
    }

    // Allow access if user owns the order OR is admin/staff
    const hasAccess = order.userId === session.user.id || 
                      session.user.role === 'ADMIN' || 
                      session.user.role === 'STAFF'

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses ke order ini' },
        { status: 403 }
      )
    }

    // Get all order activity logs
    const logs = await prisma.userActivityLog.findMany({
      where: {
        resource: 'ORDER',
        resourceId: orderId,
        action: {
          in: [
            'ORDER_CREATED',
            'ORDER_UPDATED', 
            'UPDATE_ORDER_STATUS',
            'UPDATE_PAYMENT_STATUS',
            'MARK_PAYMENT_FAILED', 
            'PROCESS_REFUND',
            'ORDER_CANCELLED',
            'ORDER_COMPLETED'
          ]
        }
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
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil riwayat pembayaran' },
      { status: 500 }
    )
  }
}
