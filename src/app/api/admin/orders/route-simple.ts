import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus, PaymentStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  console.log("📊 Admin orders API called (Simple Prisma)")
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderStatus = searchParams.get('orderStatus') as OrderStatus
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus
    const search = searchParams.get('search')
    
    console.log('📊 Query params:', { page, limit, orderStatus, paymentStatus, search })
    
    const offset = (page - 1) * limit
    
    // Build simple where conditions
    const whereConditions: any = {}
    
    if (orderStatus) {
      whereConditions.orderStatus = orderStatus
    }
    
    if (search) {
      whereConditions.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Add payment status filter if specified
    if (paymentStatus) {
      whereConditions.payment = {
        status: paymentStatus
      }
    }

    // Get orders with minimal relations to avoid complex joins
    const orders = await prisma.order.findMany({
      where: whereConditions,
      include: {
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
            proofUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })
    
    // Get simple total count
    const total = await prisma.order.count({
      where: whereConditions
    })
    
    // Simple statistics - just get basic counts
    const totalOrders = await prisma.order.count()
    
    // Format orders data with minimal processing
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone
      },
      subtotalAmount: Number(order.subtotalAmount),
      serviceFee: Number(order.serviceFee),
      totalAmount: Number(order.totalAmount),
      orderStatus: order.orderStatus,
      paymentStatus: order.payment?.status || 'PENDING',
      paymentMethod: order.payment?.method,
      paymentProof: order.payment?.proofUrl,
      pickupDate: order.pickupDate,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))

    // Simple stats without complex grouping
    const formattedOrderStats = {
      total: totalOrders,
      pending: 0,
      confirmed: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0
    }

    const formattedPaymentStats = {
      pending: 0,
      paid: 0,
      failed: 0,
      refunded: 0
    }

    const response = {
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats: formattedOrderStats,
        paymentStats: formattedPaymentStats
      }
    }

    console.log('✅ Orders data fetched successfully (Simple Prisma):', {
      ordersCount: formattedOrders.length,
      total
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching orders (Simple Prisma):', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Simple PUT method
export async function PUT(request: NextRequest) {
  console.log('🔄 Admin order update API called (Simple Prisma)')
  
  try {
    const body = await request.json()
    const { orderId, orderStatus, notes } = body
    
    if (!orderId || !orderStatus) {
      return NextResponse.json(
        { error: 'Order ID and order status are required' },
        { status: 400 }
      )
    }

    // Simple update without complex relations
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: orderStatus as OrderStatus,
        notes: notes || null,
        updatedAt: new Date()
      }
    })

    console.log('✅ Order status updated successfully (Simple Prisma):', { orderId, orderStatus })

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    })

  } catch (error) {
    console.error('❌ Error updating order (Simple Prisma):', error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
