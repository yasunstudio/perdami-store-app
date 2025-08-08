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
  console.log('🔍 Simple orders API called')
  
  try {
    const client = await getDbClient()
    
    // Very simple query without JOINs
    const ordersQuery = `
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
        o."updatedAt"
      FROM orders o
      ORDER BY o."createdAt" DESC
      LIMIT 10
    `
    
    console.log('📊 Executing simple orders query...')
    
    const ordersResult = await client.query(ordersQuery)
    
    // Get total count
    const countResult = await client.query('SELECT COUNT(*) as total FROM orders')
    const total = parseInt(countResult.rows[0].total)

    await client.end()

    const response = {
      success: true,
      message: `Found ${ordersResult.rows.length} orders`,
      count: ordersResult.rows.length,
      total,
      orders: ordersResult.rows
    }

    console.log('✅ Simple orders data fetched successfully:', response.message)

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
