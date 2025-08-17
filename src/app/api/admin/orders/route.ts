import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { OrderStatus, PaymentStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderStatus = searchParams.get('orderStatus')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Build where conditions
    const where: any = {}
    
    if (orderStatus && orderStatus !== 'all') {
      where.orderStatus = orderStatus
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get orders count
    const totalCount = await prisma.order.count({ where })

    // Get orders
    const orders = await prisma.order.findMany({
      where,
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
                sellingPrice: true,
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
    })

    // Get statistics
    const [
      pendingCount,
      confirmedCount,
      readyCount,
      completedCount,
      cancelledCount,
      pendingPayments,
      paidPayments,
      failedPayments,
      refundedPayments
    ] = await Promise.all([
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.count({ where: { orderStatus: 'CONFIRMED' } }),
      prisma.order.count({ where: { orderStatus: 'READY' } }),
      prisma.order.count({ where: { orderStatus: 'COMPLETED' } }),
      prisma.order.count({ where: { orderStatus: 'CANCELLED' } }),
      prisma.order.count({ where: { paymentStatus: 'PENDING' } }),
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
      prisma.order.count({ where: { paymentStatus: 'FAILED' } }),
      prisma.order.count({ where: { paymentStatus: 'REFUNDED' } })
    ])

    // Calculate total revenue from paid orders
    const paidOrders = await prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { totalAmount: true }
    })

    // Format response
    const formattedOrders = orders.map((order: any) => ({
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
      customer: order.user, // Add customer alias for frontend compatibility
      bank: order.bank,
      payment: order.payment,
      items: order.orderItems.map((item: any) => ({
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
      }
    }

    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response = {
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev
      },
      stats: {
        total: totalCount,
        pending: pendingCount,
        confirmed: confirmedCount,
        ready: readyCount,
        completed: completedCount,
        cancelled: cancelledCount,
        totalRevenue: paidOrders._sum.totalAmount || 0
      },
      paymentStats: {
        pending: pendingPayments,
        paid: paidPayments,
        failed: failedPayments,
        refunded: refundedPayments
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    
    // Get bundles to calculate total
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
    
    const totalAmount = bundles.reduce((sum, bundle) => sum + bundle.sellingPrice, 0)
    const serviceFee = 25000 // Fixed Rp 25.000
    const subtotalAmount = totalAmount
    
    // Create order with items
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
            unitPrice: bundle.sellingPrice,
            totalPrice: bundle.sellingPrice
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
                sellingPrice: true
              }
            }
          }
        },
        payment: true
      }
    })
    
    return NextResponse.json({
      message: 'Order created successfully',
      order: result
    })
    
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
    
    // Update order status
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
                sellingPrice: true
              }
            }
          }
        },
        payment: true
      }
    })
    
    return NextResponse.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    })
    
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({
      error: 'Failed to update order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}