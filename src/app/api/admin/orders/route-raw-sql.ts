import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  console.log("📊 Admin orders API called (Raw SQL Fallback)")
  
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
    
    // Build raw SQL query to avoid Prisma prepared statement issues
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1
    
    if (orderStatus) {
      whereClause += ` AND o.order_status = $${paramIndex}`
      params.push(orderStatus)
      paramIndex++
    }
    
    if (search) {
      whereClause += ` AND o.order_number ILIKE $${paramIndex}`
      params.push(`%${search}%`)
      paramIndex++
    }
    
    if (paymentStatus) {
      whereClause += ` AND p.status = $${paramIndex}`
      params.push(paymentStatus)
      paramIndex++
    }
    
    // Add pagination parameters
    const limitParam = `$${paramIndex}`
    params.push(limit)
    paramIndex++
    
    const offsetParam = `$${paramIndex}`
    params.push(offset)
    
    const ordersQuery = `
      SELECT 
        o.id,
        o.order_number as "orderNumber",
        o.subtotal_amount as "subtotalAmount",
        o.service_fee as "serviceFee", 
        o.total_amount as "totalAmount",
        o.order_status as "orderStatus",
        o.pickup_date as "pickupDate",
        o.notes,
        o.created_at as "createdAt",
        o.updated_at as "updatedAt",
        u.id as "userId",
        u.name as "userName",
        u.email as "userEmail", 
        u.phone as "userPhone",
        p.status as "paymentStatus",
        p.method as "paymentMethod",
        p.proof_url as "paymentProof"
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      ${whereClause}
    `
    
    console.log('📊 Raw SQL Query:', ordersQuery)
    console.log('📊 Parameters:', params)
    
    // Execute raw SQL queries
    const [orders, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(ordersQuery, ...params),
      prisma.$queryRawUnsafe(countQuery, ...params.slice(0, -2)) // Exclude limit and offset for count
    ])
    
    const total = Number((countResult as any[])[0]?.total || 0)
    
    // Format orders data
    const formattedOrders = (orders as any[]).map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        id: order.userId,
        name: order.userName,
        email: order.userEmail,
        phone: order.userPhone
      },
      subtotalAmount: Number(order.subtotalAmount),
      serviceFee: Number(order.serviceFee),
      totalAmount: Number(order.totalAmount),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus || 'PENDING',
      paymentMethod: order.paymentMethod,
      paymentProof: order.paymentProof,
      pickupDate: order.pickupDate,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: [] // Will be populated later if needed
    }))

    // Simple stats
    const totalOrdersResult = await prisma.$queryRawUnsafe('SELECT COUNT(*) as total FROM orders')
    const totalOrders = Number((totalOrdersResult as any[])[0]?.total || 0)

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
          total: totalOrders,
          pending: 0,
          confirmed: 0,
          ready: 0,
          completed: 0,
          cancelled: 0,
          totalRevenue: 0
        },
        paymentStats: {
          pending: 0,
          paid: 0,
          failed: 0,
          refunded: 0
        }
      }
    }

    console.log('✅ Orders data fetched successfully (Raw SQL):', {
      ordersCount: formattedOrders.length,
      total
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching orders (Raw SQL):', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Simple PUT method using raw SQL
export async function PUT(request: NextRequest) {
  console.log('🔄 Admin order update API called (Raw SQL)')
  
  try {
    const body = await request.json()
    const { orderId, orderStatus, notes } = body
    
    if (!orderId || !orderStatus) {
      return NextResponse.json(
        { error: 'Order ID and order status are required' },
        { status: 400 }
      )
    }

    // Use raw SQL for update
    const updateQuery = `
      UPDATE orders 
      SET order_status = $1, notes = $2, updated_at = $3
      WHERE id = $4
      RETURNING *
    `
    
    const result = await prisma.$queryRawUnsafe(
      updateQuery, 
      orderStatus, 
      notes || null, 
      new Date(), 
      orderId
    )

    console.log('✅ Order status updated successfully (Raw SQL):', { orderId, orderStatus })

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: (result as any[])[0]
    })

  } catch (error) {
    console.error('❌ Error updating order (Raw SQL):', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
