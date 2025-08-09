import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { OrderStatus, PaymentStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  console.log("📊 Admin orders API called")
  
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    
    if (paymentStatus) {
      whereConditions.paymentStatus = paymentStatus
    }
    
    if (search) {
      whereConditions.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          id: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          orderNumber: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }
    
    console.log('🔍 Where conditions:', JSON.stringify(whereConditions, null, 2))
    
    // Get orders with pagination using Prisma ORM
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          orderItems: {
            include: {
              bundle: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true
                }
              }
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
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
              accountNumber: true,
              accountName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.order.count({ where: whereConditions })
    ])

    console.log(`📦 Found ${orders.length} orders out of ${totalCount} total`)

    // Get order status statistics using Prisma ORM
    const [
      pendingCount,
      confirmedCount,
      readyCount,
      completedCount,
      cancelledCount,
      totalRevenue
    ] = await Promise.all([
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.count({ where: { orderStatus: 'CONFIRMED' } }),
      prisma.order.count({ where: { orderStatus: 'READY' } }),
      prisma.order.count({ where: { orderStatus: 'COMPLETED' } }),
      prisma.order.count({ where: { orderStatus: 'CANCELLED' } }),
      prisma.order.aggregate({
        where: { orderStatus: 'COMPLETED' },
        _sum: { totalAmount: true }
      })
    ])

    // Get payment status statistics using Prisma ORM
    const [
      pendingPayments,
      paidPayments,
      failedPayments,
      refundedPayments
    ] = await Promise.all([
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.count({ where: { status: 'REFUNDED' } })
    ])

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      subtotalAmount: order.subtotalAmount,
      serviceFee: order.serviceFee,
      totalAmount: order.totalAmount,
      pickupDate: order.pickupDate,
      pickupMethod: order.pickupMethod,
      pickupStatus: order.pickupStatus,
      paymentProofUrl: order.paymentProofUrl,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user,
      bank: order.bank,
      payment: order.payment,
      items: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        bundle: item.bundle
      }))
    }))

    const statistics = {
      orderStatus: {
        pending: pendingCount,
        confirmed: confirmedCount,
        ready: readyCount,
        completed: completedCount,
        cancelled: cancelledCount
      },
      paymentStatus: {
        pending: pendingPayments,
        paid: paidPayments,
        failed: failedPayments,
        refunded: refundedPayments
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0
      }
    }

    const response = {
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount
      },
      statistics,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.0-prisma'
      }
    }

    console.log('✅ Orders data prepared successfully')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error in GET /api/admin/orders:', error)
    return NextResponse.json({
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  console.log("🔄 Admin orders PATCH API called")
  
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, orderStatus, notes } = body
    
    if (!orderId || !orderStatus) {
      return NextResponse.json({
        error: 'Order ID and order status are required'
      }, { status: 400 })
    }
    
    console.log('🔄 Updating order:', { orderId, orderStatus, notes })
    
    // Update order status using Prisma ORM
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: orderStatus as OrderStatus,
        ...(notes && { notes }),
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
        orderItems: {
          include: {
            bundle: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        payment: true
      }
    })
    
    console.log('✅ Order updated successfully')
    
    return NextResponse.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    })
    
  } catch (error) {
    console.error('❌ Error in PATCH /api/admin/orders:', error)
    return NextResponse.json({
      error: 'Failed to update order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("➕ Admin orders POST API called")
  
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, bundleIds, pickupDate, notes } = body
    
    if (!userId || !bundleIds || !Array.isArray(bundleIds) || bundleIds.length === 0) {
      return NextResponse.json({
        error: 'User ID and bundle IDs are required'
      }, { status: 400 })
    }
    
    console.log('➕ Creating order:', { userId, bundleIds, pickupDate, notes })
    
    // Get bundles to calculate total using Prisma ORM
    const bundles = await prisma.productBundle.findMany({
      where: {
        id: { in: bundleIds },
        isActive: true
      }
    })
    
    if (bundles.length !== bundleIds.length) {
      return NextResponse.json({
        error: 'One or more bundles are not available'
      }, { status: 400 })
    }
    
    const totalAmount = bundles.reduce((sum, bundle) => sum + bundle.price, 0)
    const serviceFee = 25000 // Fixed Rp 25.000 as per schema
    const subtotalAmount = totalAmount
    
    // Create order with items using Prisma ORM
    const result = await prisma.order.create({
      data: {
        userId,
        orderNumber: `ORD-${Date.now()}`,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        subtotalAmount,
        serviceFee,
        totalAmount: subtotalAmount + serviceFee,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        notes,
        orderItems: {
          create: bundles.map(bundle => ({
            bundleId: bundle.id,
            quantity: 1,
            unitPrice: bundle.price,
            totalPrice: bundle.price
          }))
        },
        payment: {
          create: {
            amount: subtotalAmount + serviceFee,
            method: 'BANK_TRANSFER',
            status: 'PENDING'
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            bundle: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        payment: true
      }
    })
    
    console.log('✅ Order created successfully')
    
    return NextResponse.json({
      message: 'Order created successfully',
      order: result
    })
    
  } catch (error) {
    console.error('❌ Error in POST /api/admin/orders:', error)
    return NextResponse.json({
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
