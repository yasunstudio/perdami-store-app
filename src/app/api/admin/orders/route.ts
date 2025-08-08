import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus, PaymentStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  console.log("📊 Admin orders API called (Prisma)")
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderStatus = searchParams.get('orderStatus') as OrderStatus
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus
    const pickupDate = searchParams.get('pickupDate')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    console.log('📊 Query params:', { page, limit, orderStatus, paymentStatus, pickupDate, search, sortBy, sortOrder })
    
    const offset = (page - 1) * limit
    
    // Build Prisma where conditions
    const whereConditions: any = {}
    
    if (orderStatus) {
      whereConditions.orderStatus = orderStatus
    }
    
    if (pickupDate) {
      const startOfDay = new Date(pickupDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(pickupDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      whereConditions.pickupDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }
    
    if (search) {
      whereConditions.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    // Add payment status filter if specified
    if (paymentStatus) {
      whereConditions.payment = {
        status: paymentStatus
      }
    }
    
    // Build order by clause
    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'customerName') {
      orderBy = { user: { name: sortOrder as 'asc' | 'desc' } }
    } else if (sortBy === 'totalAmount') {
      orderBy = { totalAmount: sortOrder as 'asc' | 'desc' }
    } else if (sortBy === 'orderStatus') {
      orderBy = { orderStatus: sortOrder as 'asc' | 'desc' }
    }

    // Execute queries in parallel for better performance
    const [orders, total, orderStats, paymentStats] = await Promise.all([
      // Get orders with full relations
      prisma.order.findMany({
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
              proofUrl: true,
              createdAt: true,
              updatedAt: true
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
          orderItems: {
            include: {
              bundle: {
                include: {
                  store: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      
      // Get total count
      prisma.order.count({
        where: whereConditions
      }),
      
      // Get order statistics
      prisma.order.groupBy({
        by: ['orderStatus'],
        _count: {
          orderStatus: true
        }
      }),
      
      // Get payment statistics
      prisma.payment.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
    ])

    // Calculate total revenue from paid orders
    const revenueResult = await prisma.order.aggregate({
      _sum: {
        totalAmount: true
      },
      where: {
        payment: {
          status: 'PAID'
        }
      }
    })

    const totalRevenue = revenueResult._sum.totalAmount || 0

    // Format orders data
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
      updatedAt: order.updatedAt,
      items: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        bundle: {
          id: item.bundle.id,
          name: item.bundle.name,
          price: Number(item.bundle.price),
          image: item.bundle.image,
          store: {
            id: item.bundle.store.id,
            name: item.bundle.store.name
          }
        }
      })),
      bank: order.bank,
      payment: order.payment
    }))

    // Format statistics
    const formattedOrderStats = {
      total: total,
      pending: orderStats.find(stat => stat.orderStatus === 'PENDING')?._count.orderStatus || 0,
      confirmed: orderStats.find(stat => stat.orderStatus === 'CONFIRMED')?._count.orderStatus || 0,
      ready: orderStats.find(stat => stat.orderStatus === 'READY')?._count.orderStatus || 0,
      completed: orderStats.find(stat => stat.orderStatus === 'COMPLETED')?._count.orderStatus || 0,
      cancelled: orderStats.find(stat => stat.orderStatus === 'CANCELLED')?._count.orderStatus || 0,
      totalRevenue: Number(totalRevenue)
    }

    const formattedPaymentStats = {
      pending: paymentStats.find(stat => stat.status === 'PENDING')?._count.status || 0,
      paid: paymentStats.find(stat => stat.status === 'PAID')?._count.status || 0,
      failed: paymentStats.find(stat => stat.status === 'FAILED')?._count.status || 0,
      refunded: paymentStats.find(stat => stat.status === 'REFUNDED')?._count.status || 0
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

    console.log('✅ Orders data fetched successfully (Prisma):', {
      ordersCount: formattedOrders.length,
      total,
      orderStats: formattedOrderStats,
      paymentStats: formattedPaymentStats
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching orders (Prisma):', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Update order status (PUT method) with Prisma
export async function PUT(request: NextRequest) {
  console.log('🔄 Admin order update API called (Prisma)')
  
  try {
    const body = await request.json()
    const { orderId, orderStatus, notes } = body
    
    if (!orderId || !orderStatus) {
      return NextResponse.json(
        { error: 'Order ID and order status are required' },
        { status: 400 }
      )
    }

    // Validate order status
    const validStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(orderStatus)) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      )
    }
    
    // Update order using Prisma
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: orderStatus as OrderStatus,
        notes: notes || null,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        payment: true,
        bank: true
      }
    })

    console.log('✅ Order status updated successfully (Prisma):', { orderId, orderStatus })

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    })

  } catch (error) {
    console.error('❌ Error updating order (Prisma):', error)
    
    // Handle Prisma-specific errors
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

// Delete order (DELETE method) with Prisma
export async function DELETE(request: NextRequest) {
  console.log('🗑️ Admin order delete API called (Prisma)')
  
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Delete order and related records using transaction
    const result = await prisma.$transaction(async (tx) => {
      // First delete order items
      await tx.orderItem.deleteMany({
        where: { orderId }
      })
      
      // Delete payment if exists
      await tx.payment.deleteMany({
        where: { orderId }
      })
      
      // Finally delete the order
      const deletedOrder = await tx.order.delete({
        where: { id: orderId }
      })
      
      return deletedOrder
    })

    console.log('✅ Order deleted successfully (Prisma):', { orderId })

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
      orderId
    })

  } catch (error) {
    console.error('❌ Error deleting order (Prisma):', error)
    
    // Handle Prisma-specific errors
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
