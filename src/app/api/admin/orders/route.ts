import { NextRequest, NextResponse } from "next/server"
import { prisma, disconnectPrisma } from "@/lib/prisma"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { ensureDatabaseConnection, executeWithRetry } from "@/lib/database-connection"

export async function GET(request: NextRequest) {
  console.log("📊 Admin orders API called (Robust Prisma)")
  
  try {
    // Ensure robust database connection
    await ensureDatabaseConnection()
    
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderStatus = searchParams.get('orderStatus') as OrderStatus
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus
    const search = searchParams.get('search')
    
    console.log('📊 Query params:', { page, limit, orderStatus, paymentStatus, search })
    
    const offset = (page - 1) * limit
    
    // Build where conditions
    const whereConditions: any = {}
    
    if (orderStatus) {
      whereConditions.orderStatus = orderStatus
    }
    
    if (search) {
      whereConditions.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    if (paymentStatus) {
      whereConditions.payment = {
        status: paymentStatus
      }
    }

    // Execute operations with retry logic
    const [orders, total] = await Promise.all([
      executeWithRetry(() => 
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
                proofUrl: true
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
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        })
      ),
      
      executeWithRetry(() => 
        prisma.order.count({
          where: whereConditions
        })
      )
    ]);

    // Get statistics with individual queries to avoid groupBy issues
    const [
      pendingCount,
      confirmedCount, 
      readyCount,
      completedCount,
      cancelledCount,
      revenueResult
    ] = await Promise.all([
      executeWithRetry(() => prisma.order.count({ where: { orderStatus: 'PENDING' } })),
      executeWithRetry(() => prisma.order.count({ where: { orderStatus: 'CONFIRMED' } })),
      executeWithRetry(() => prisma.order.count({ where: { orderStatus: 'READY' } })),
      executeWithRetry(() => prisma.order.count({ where: { orderStatus: 'COMPLETED' } })),
      executeWithRetry(() => prisma.order.count({ where: { orderStatus: 'CANCELLED' } })),
      executeWithRetry(() => 
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { payment: { status: 'PAID' } }
        })
      )
    ]);

    // Get payment statistics
    const [
      paymentPendingCount,
      paymentPaidCount,
      paymentFailedCount,
      paymentRefundedCount
    ] = await Promise.all([
      executeWithRetry(() => prisma.payment.count({ where: { status: 'PENDING' } })),
      executeWithRetry(() => prisma.payment.count({ where: { status: 'PAID' } })),
      executeWithRetry(() => prisma.payment.count({ where: { status: 'FAILED' } })),
      executeWithRetry(() => prisma.payment.count({ where: { status: 'REFUNDED' } }))
    ]);

    // Format response
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
    }));

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
        stats: {
          total,
          pending: pendingCount,
          confirmed: confirmedCount,
          ready: readyCount,
          completed: completedCount,
          cancelled: cancelledCount,
          totalRevenue: Number(revenueResult._sum.totalAmount || 0)
        },
        paymentStats: {
          pending: paymentPendingCount,
          paid: paymentPaidCount,
          failed: paymentFailedCount,
          refunded: paymentRefundedCount
        }
      }
    };

    console.log('✅ Orders fetched successfully with retry logic:', {
      ordersCount: formattedOrders.length,
      total,
      attempts: 'Variable'
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching orders after retries:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    // Optional: disconnect to free resources
    // await disconnectPrisma();
  }
}

// Update order status (PUT method) with retry logic
export async function PUT(request: NextRequest) {
  console.log('🔄 Admin order update API called (Robust Prisma)')
  
  try {
    await prisma.$connect();
    
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
    
    // Update order with retry logic
    const updatedOrder = await executeWithRetry(() =>
      prisma.order.update({
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
    );

    console.log('✅ Order status updated successfully (Robust Prisma):', { orderId, orderStatus })

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    })

  } catch (error) {
    console.error('❌ Error updating order (Robust Prisma):', error)
    
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
  } finally {
    // Optional: disconnect to free resources
    // await disconnectPrisma();
  }
}

// Delete order (DELETE method) with retry logic
export async function DELETE(request: NextRequest) {
  console.log('🗑️ Admin order delete API called (Robust Prisma)')
  
  try {
    await prisma.$connect();
    
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Delete order with transaction and retry logic
    const result = await executeWithRetry(() =>
      prisma.$transaction(async (tx) => {
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
    );

    console.log('✅ Order deleted successfully (Robust Prisma):', { orderId })

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
      orderId
    })

  } catch (error) {
    console.error('❌ Error deleting order (Robust Prisma):', error)
    
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
  } finally {
    // Optional: disconnect to free resources
    // await disconnectPrisma();
  }
}
