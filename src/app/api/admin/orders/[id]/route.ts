import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { OrderStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔍 Admin order detail API called (Prisma)')
  
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order details with all related data using Prisma
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            bundle: {
              include: {
                store: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true
                  }
                }
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            proofUrl: true,
            notes: true,
            createdAt: true
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

    // Format response to match frontend expectations
    const response = {
      id: order.id,
      orderNumber: order.orderNumber,
      subtotalAmount: order.subtotalAmount,
      serviceFee: order.serviceFee,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      pickupDate: order.pickupDate,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      
      // User details
      user: order.user,
      
      // Order items with bundle and store details
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        productBundle: {
          id: item.bundle.id,
          name: item.bundle.name,
          price: item.bundle.price,
          image: item.bundle.image,
          description: item.bundle.description,
          store: item.bundle.store
        }
      })),
      
      // Payment details
      payment: order.payment,
      
      // Additional metadata
      metadata: {
        totalItems: order.orderItems.length,
        hasPayment: !!order.payment,
        canCancel: order.orderStatus === 'PENDING',
        canConfirm: order.orderStatus === 'PENDING',
        canComplete: order.orderStatus === 'CONFIRMED',
        canRefund: order.orderStatus === 'COMPLETED' && order.payment?.status === 'PAID'
      }
    }

    console.log(`✅ Order ${order.orderNumber} details fetched successfully`)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Admin order detail error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch order details',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('📝 Admin order update API called')
  
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Validate order status if provided
    if (body.orderStatus && !Object.values(OrderStatus).includes(body.orderStatus)) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      )
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(body.orderStatus && { orderStatus: body.orderStatus }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.pickupDate && { pickupDate: new Date(body.pickupDate) }),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            bundle: {
              include: {
                store: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true
                  }
                }
              }
            }
          }
        },
        payment: true
      }
    })

    console.log(`✅ Order ${updatedOrder.orderNumber} updated successfully`)
    return NextResponse.json({
      message: 'Order updated successfully',
      order: updatedOrder
    })
  } catch (error) {
    console.error('❌ Admin order update error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🗑️ Admin order delete API called')
  
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Check if order exists and can be deleted
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        payment: true
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of cancelled or pending orders
    if (!['PENDING', 'CANCELLED'].includes(existingOrder.orderStatus)) {
      return NextResponse.json(
        { error: 'Cannot delete order with current status' },
        { status: 400 }
      )
    }

    // Delete order (this will cascade delete order items and payments)
    await prisma.order.delete({
      where: { id }
    })

    console.log(`✅ Order ${existingOrder.orderNumber} deleted successfully`)
    return NextResponse.json({
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('❌ Admin order delete error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete order',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
