import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

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
  console.log('🔍 Public orders API called')
  
  try {
    const client = await getDbClient()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderStatus = searchParams.get('orderStatus') || null
    const paymentStatus = searchParams.get('paymentStatus') || null
    const search = searchParams.get('search') || ''
    
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
        b.id as bank_id,
        b.name as bank_name,
        b."accountNumber" as bank_account_number,
        b."accountName" as bank_account_name
      FROM orders o
      LEFT JOIN users u ON o."userId" = u.id
      LEFT JOIN payments p ON o.id = p."orderId"
      LEFT JOIN banks b ON o."bankId" = b.id
      ${whereClause}
      ORDER BY o."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(limit, offset)
    
    console.log('📊 Executing orders query:', ordersQuery)
    console.log('📊 Query params:', queryParams)
    
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
    const orderIds = ordersResult.rows.map(order => order.id)
    let orderItems = []
    
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
        COUNT(CASE WHEN "orderStatus" = 'CANCELLED' THEN 1 END) as cancelled,
        COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN o."totalAmount" ELSE 0 END), 0) as total_revenue
      FROM orders o
      LEFT JOIN payments p ON o.id = p."orderId"
    `
    
    const statsResult = await client.query(statsQuery)
    const stats = statsResult.rows[0]

    await client.end()

    // Format orders data
    const orders = ordersResult.rows.map(order => {
      const items = orderItems.filter(item => item.orderId === order.id)
      
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
        items: items.map(item => ({
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
        } : null
      }
    })

    const response = {
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      stats: {
        total: parseInt(stats.total),
        pending: parseInt(stats.pending),
        confirmed: parseInt(stats.confirmed),
        ready: parseInt(stats.ready),
        completed: parseInt(stats.completed),
        cancelled: parseInt(stats.cancelled),
        totalRevenue: parseFloat(stats.total_revenue)
      }
    }

    console.log('✅ Orders data fetched successfully:', {
      ordersCount: orders.length,
      total,
      stats: response.stats
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
