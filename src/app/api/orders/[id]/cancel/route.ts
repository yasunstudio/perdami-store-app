import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().min(1, 'Order ID is required')
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate parameters
    const resolvedParams = await params
    const validatedParams = paramsSchema.parse(resolvedParams)
    const orderId = validatedParams.id

    // Find the order, ensure it belongs to the user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id
      },
      include: {
        payment: true // Include payment information
      }
    })

    // Check if order exists
    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if order can be cancelled (only PENDING orders that haven't been paid)
    if (order.orderStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'Hanya pesanan dengan status menunggu yang dapat dibatalkan' },
        { status: 400 }
      )
    }

    if (order.payment?.status === 'PAID') {
      return NextResponse.json(
        { error: 'Pesanan yang sudah dibayar tidak dapat dibatalkan' },
        { status: 400 }
      )
    }

    // Cancel the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        orderStatus: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        orderItems: {
          include: {
            bundle: {
              include: {
                store: true
              }
            }
          }
        },
        bank: {
          select: {
            id: true,
            name: true,
            code: true,
            accountNumber: true,
            accountName: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Log user activity
    await prisma.userActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'CANCEL',
        resource: 'ORDER',
        resourceId: orderId,
        details: `Membatalkan pesanan #${order.orderNumber}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan',
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error cancelling order:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parameter tidak valid', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membatalkan pesanan' },
      { status: 500 }
    )
  }
}
