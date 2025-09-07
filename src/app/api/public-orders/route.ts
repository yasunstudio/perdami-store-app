import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  console.log("📊 Public orders API called (fallback)")
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderStatus = searchParams.get('orderStatus')
    const paymentStatus = searchParams.get('paymentStatus')
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
          orderNumber: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }
    
    // Get orders with pagination (limited data for public access)
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
                  sellingPrice: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.order.count({ where: whereConditions })
    ])

    // Get basic statistics
    const [
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount
    ] = await Promise.all([
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.count({ where: { orderStatus: 'CONFIRMED' } }),
      prisma.order.count({ where: { orderStatus: 'COMPLETED' } }),
      prisma.order.count({ where: { orderStatus: 'CANCELLED' } })
    ])

    const response = {
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        user: order.user,
        items: order.orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          bundle: item.bundle
        }))
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount
      },
      stats: {
        pending: pendingCount,
        confirmed: confirmedCount,
        completed: completedCount,
        cancelled: cancelledCount
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0-public-fallback'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error in GET /api/public-orders:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
