import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/types'

// Database connection
async function getDbClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found')
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })
  
  await client.connect()
  return client
}

export async function GET(request: NextRequest) {
  console.log('🔍 Admin orders API called')
  
  try {
    const client = await getDbClient()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderStatus = searchParams.get('orderStatus') as OrderStatus | null
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus | null
    const pickupDate = searchParams.get('pickupDate') || null
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const offset = (page - 1) * limit

    // Build WHERE clause
    let whereConditions = []
    let queryParams = []
    let paramIndex = 1

    if (orderStatus) {
      whereConditions.push(`o."orderStatus" = $${paramIndex}`)
      queryParams.push(orderStatus)
      paramIndex++
    }

    if (paymentStatus) {
      whereConditions.push(`p.status = $${paramIndex}`)
      queryParams.push(paymentStatus)
      paramIndex++
    }

    if (pickupDate) {
      const startOfDay = new Date(pickupDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(pickupDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      whereConditions.push(`o."pickupDate" >= $${paramIndex} AND o."pickupDate" <= $${paramIndex + 1}`)
      queryParams.push(startOfDay.toISOString(), endOfDay.toISOString())
      paramIndex += 2
    }

    if (search) {
      whereConditions.push(`(
        o."orderNumber" ILIKE $${paramIndex} OR 
        u.name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex}
      )`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    // Build ORDER BY clause
    let orderByClause = 'ORDER BY o."createdAt" DESC'
    if (sortBy === 'customerName') {
      orderByClause = `ORDER BY u.name ${sortOrder.toUpperCase()}`
    } else if (sortBy === 'totalAmount') {
      orderByClause = `ORDER BY o."totalAmount" ${sortOrder.toUpperCase()}`
    } else if (sortBy === 'orderStatus') {
      orderByClause = `ORDER BY o."orderStatus" ${sortOrder.toUpperCase()}`
    }

    // Get orders with pagination
    const ordersQuery = `
      SELECT 
        o.id,
        o."orderNumber",
        o."subtotalAmount",
        o."serviceFee", 
        o."totalAmount",
        o."orderStatus",
        o."pickupDate",
        o."pickupTime",
        o.notes,
        o."createdAt",
        o."updatedAt",
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        p.status as payment_status,
        p.method as payment_method,
        p."proofUrl" as payment_proof,
        p."createdAt" as payment_created_at,
        p."updatedAt" as payment_updated_at,
        b.id as bank_id,
        b.name as bank_name,
        b."accountNumber" as bank_account_number,
        b."accountName" as bank_account_name
      FROM orders o
      LEFT JOIN users u ON o."userId" = u.id
      LEFT JOIN payments p ON o.id = p."orderId"
      LEFT JOIN banks b ON o."bankId" = b.id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(limit, offset)
    
    console.log('📊 Executing orders query with params:', { page, limit, orderStatus, paymentStatus, search })
    
    const ordersResult = await client.query(ordersQuery, queryParams)
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN users u ON o."userId" = u.id
      LEFT JOIN payments p ON o.id = p."orderId"
      ${whereClause}
    `
    
    const countParams = queryParams.slice(0, -2) // Remove limit and offset
    const countResult = await client.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total)

    // Get order items for each order
    const orderIds = ordersResult.rows.map((order: any) => order.id)
    let orderItems: any[] = []
    
    if (orderIds.length > 0) {
      const itemsQuery = `
        SELECT 
          oi."orderId",
          oi.id as item_id,
          oi.quantity,
          oi."price" as item_price,
          pb.id as bundle_id,
          pb.name as bundle_name,
          pb.price as bundle_price,
          pb.image as bundle_image,
          s.id as store_id,
          s.name as store_name
        FROM order_items oi
        LEFT JOIN product_bundles pb ON oi."bundleId" = pb.id
        LEFT JOIN stores s ON pb."storeId" = s.id
        WHERE oi."orderId" = ANY($1)
        ORDER BY oi."createdAt"
      `
      
      const itemsResult = await client.query(itemsQuery, [orderIds])
      orderItems = itemsResult.rows
    }

    // Get order statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "orderStatus" = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN "orderStatus" = 'CONFIRMED' THEN 1 END) as confirmed,
        COUNT(CASE WHEN "orderStatus" = 'READY' THEN 1 END) as ready,
        COUNT(CASE WHEN "orderStatus" = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN "orderStatus" = 'CANCELLED' THEN 1 END) as cancelled
      FROM orders
    `
    
    const statsResult = await client.query(statsQuery)
    const stats = statsResult.rows[0]

    // Get payment statistics
    const paymentStatsQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) as refunded
      FROM payments
    `
    
    const paymentStatsResult = await client.query(paymentStatsQuery)
    const paymentStats = paymentStatsResult.rows[0]

    // Calculate total revenue
    const revenueQuery = `
      SELECT COALESCE(SUM(o."totalAmount"), 0) as total_revenue
      FROM orders o
      LEFT JOIN payments p ON o.id = p."orderId"
      WHERE p.status = 'PAID'
    `
    
    const revenueResult = await client.query(revenueQuery)
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue || 0)

    await client.end()

    // Format orders data
    const orders = ordersResult.rows.map((order: any) => {
      const items = orderItems.filter((item: any) => item.orderId === order.id)
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: {
          id: order.user_id,
          name: order.user_name,
          email: order.user_email,
          phone: order.user_phone
        },
        subtotalAmount: parseFloat(order.subtotalAmount),
        serviceFee: parseFloat(order.serviceFee),
        totalAmount: parseFloat(order.totalAmount),
        orderStatus: order.orderStatus,
        paymentStatus: order.payment_status || 'PENDING',
        paymentMethod: order.payment_method,
        paymentProof: order.payment_proof,
        pickupDate: order.pickupDate,
        pickupTime: order.pickupTime,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: items.map((item: any) => ({
          id: item.item_id,
          quantity: item.quantity,
          price: parseFloat(item.item_price),
          bundle: {
            id: item.bundle_id,
            name: item.bundle_name,
            price: parseFloat(item.bundle_price || 0),
            image: item.bundle_image,
            store: {
              id: item.store_id,
              name: item.store_name
            }
          }
        })),
        bank: order.bank_id ? {
          id: order.bank_id,
          name: order.bank_name,
          accountNumber: order.bank_account_number,
          accountName: order.bank_account_name
        } : null,
        payment: order.payment_status ? {
          id: `payment-${order.id}`,
          status: order.payment_status,
          method: order.payment_method,
          proofUrl: order.payment_proof,
          createdAt: order.payment_created_at,
          updatedAt: order.payment_updated_at
        } : null
      }
    })

    // Format statistics
    const orderStats = {
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      confirmed: parseInt(stats.confirmed),
      ready: parseInt(stats.ready),
      completed: parseInt(stats.completed),
      cancelled: parseInt(stats.cancelled),
      totalRevenue
    }

    const paymentStatsFormatted = {
      pending: parseInt(paymentStats.pending),
      paid: parseInt(paymentStats.paid),
      failed: parseInt(paymentStats.failed),
      refunded: parseInt(paymentStats.refunded)
    }

    const response = {
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats: orderStats,
        paymentStats: paymentStatsFormatted
      }
    }

    console.log('✅ Orders data fetched successfully:', {
      ordersCount: orders.length,
      total,
      orderStats,
      paymentStats: paymentStatsFormatted
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching orders:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Update order status (PUT method)
export async function PUT(request: NextRequest) {
  console.log('🔄 Admin order update API called')
  
  try {
    const body = await request.json()
    const { orderId, orderStatus, notes } = body
    
    if (!orderId || !orderStatus) {
      return NextResponse.json(
        { error: 'Order ID and order status are required' },
        { status: 400 }
      )
    }

    const client = await getDbClient()
    
    // Update order status
    const updateQuery = `
      UPDATE orders 
      SET 
        "orderStatus" = $1,
        notes = $2,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `
    
    const updateResult = await client.query(updateQuery, [orderStatus, notes || null, orderId])
    
    if (updateResult.rows.length === 0) {
      await client.end()
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    await client.end()

    console.log('✅ Order status updated successfully:', { orderId, orderStatus })

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updateResult.rows[0]
    })

  } catch (error) {
    console.error('❌ Error updating order:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
