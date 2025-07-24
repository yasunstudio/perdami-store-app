import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().min(1, 'Order ID is required')
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const validatedParams = paramsSchema.parse(resolvedParams)
    const orderId = validatedParams.id

    // Find the order with all related data
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id
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
        },
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            amount: true,
            proofUrl: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Add computed paymentStatus for backward compatibility
    const orderWithPaymentStatus = {
      ...order,
      paymentStatus: order.payment?.status || 'PENDING'
    }

    return NextResponse.json({
      success: true,
      order: orderWithPaymentStatus
    })

  } catch (error) {
    console.error('Error fetching order:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const validatedParams = paramsSchema.parse(resolvedParams)
    const orderId = validatedParams.id
    const body = await request.json()

    // Validate that the order belongs to the user
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow updating certain fields by customers
    const allowedUpdates = {
      ...(body.paymentProof && { paymentProof: body.paymentProof }),
      ...(body.notes && { notes: body.notes }),
      ...(body.bankId && { bankId: body.bankId })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: allowedUpdates,
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
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error updating order:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}