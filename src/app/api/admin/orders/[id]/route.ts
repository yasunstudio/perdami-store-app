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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔍 Admin order detail API called')
  
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const client = await getDbClient()

    // Get order details
    const orderQuery = `
      SELECT 
        o.id,
        o."orderNumber",
        o."subtotalAmount",
        o."serviceFee", 
        o."totalAmount",
        o."orderStatus",
        o."pickupDate",
        o.notes,
        o."createdAt",
        o."updatedAt",
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        p.id as payment_id,
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
      WHERE o.id = $1
    `
    
    const orderResult = await client.query(orderQuery, [id])
    
    if (orderResult.rows.length === 0) {
      await client.end()
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderResult.rows[0]

    // Get order items
    const itemsQuery = `
      SELECT 
        oi.id as item_id,
        oi.quantity,
        oi."price" as item_price,
        pb.id as bundle_id,
        pb.name as bundle_name,
        pb.price as bundle_price,
        pb.image as bundle_image,
        pb.description as bundle_description,
        s.id as store_id,
        s.name as store_name,
        s."isActive" as store_active
      FROM order_items oi
      LEFT JOIN product_bundles pb ON oi."bundleId" = pb.id
      LEFT JOIN stores s ON pb."storeId" = s.id
      WHERE oi."orderId" = $1
      ORDER BY oi."createdAt"
    `
    
    const itemsResult = await client.query(itemsQuery, [id])

    // Get activity logs if exists
    const activityQuery = `
      SELECT 
        id,
        action,
        description,
        "createdAt",
        "performedBy"
      FROM order_activity_logs
      WHERE "orderId" = $1
      ORDER BY "createdAt" DESC
    `
    
    const activityResult = await client.query(activityQuery, [id])

    await client.end()

    // Format response
    const orderDetail = {
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
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: itemsResult.rows.map((item: any) => ({
        id: item.item_id,
        quantity: item.quantity,
        price: parseFloat(item.item_price),
        bundle: {
          id: item.bundle_id,
          name: item.bundle_name,
          price: parseFloat(item.bundle_price || 0),
          image: item.bundle_image,
          description: item.bundle_description,
          store: {
            id: item.store_id,
            name: item.store_name,
            isActive: item.store_active
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
        id: order.payment_id,
        status: order.payment_status,
        method: order.payment_method,
        proofUrl: order.payment_proof,
        createdAt: order.payment_created_at,
        updatedAt: order.payment_updated_at
      } : null,
      activityLogs: activityResult.rows.map((log: any) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        createdAt: log.createdAt,
        performedBy: log.performedBy
      }))
    }

    console.log('✅ Order detail fetched successfully:', { orderId: id })

    return NextResponse.json({
      success: true,
      order: orderDetail
    })

  } catch (error) {
    console.error('❌ Error fetching order detail:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch order detail',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔄 Admin order update API called')
  
  try {
    const { id } = await params
    const body = await request.json()
    const { orderStatus, paymentStatus, notes } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const client = await getDbClient()
    
    // Update order
    const updateOrderQuery = `
      UPDATE orders 
      SET 
        "orderStatus" = COALESCE($1, "orderStatus"),
        notes = COALESCE($2, notes),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `
    
    const orderUpdateResult = await client.query(updateOrderQuery, [
      orderStatus || null, 
      notes || null, 
      id
    ])
    
    if (orderUpdateResult.rows.length === 0) {
      await client.end()
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update payment status if provided
    if (paymentStatus) {
      const updatePaymentQuery = `
        UPDATE payments 
        SET 
          status = $1,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "orderId" = $2
      `
      
      await client.query(updatePaymentQuery, [paymentStatus, id])
    }

    // Log activity
    const logQuery = `
      INSERT INTO order_activity_logs ("orderId", action, description, "performedBy", "createdAt")
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `
    
    let actionDescription = []
    if (orderStatus) actionDescription.push(`Order status changed to ${orderStatus}`)
    if (paymentStatus) actionDescription.push(`Payment status changed to ${paymentStatus}`)
    if (notes) actionDescription.push(`Notes updated`)
    
    await client.query(logQuery, [
      id,
      'STATUS_UPDATE',
      actionDescription.join(', '),
      'admin'
    ])

    await client.end()

    console.log('✅ Order updated successfully:', { orderId: id, orderStatus, paymentStatus })

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: orderUpdateResult.rows[0]
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🗑️ Admin order delete API called')
  
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const client = await getDbClient()
    
    // First, delete related records (due to foreign key constraints)
    await client.query('DELETE FROM order_activity_logs WHERE "orderId" = $1', [id])
    await client.query('DELETE FROM payments WHERE "orderId" = $1', [id])
    await client.query('DELETE FROM order_items WHERE "orderId" = $1', [id])
    
    // Then delete the order
    const deleteResult = await client.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id])
    
    if (deleteResult.rows.length === 0) {
      await client.end()
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    await client.end()

    console.log('✅ Order deleted successfully:', { orderId: id })

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting order:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
