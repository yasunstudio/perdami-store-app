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
  console.log('🔍 Working admin orders API called')
  
  try {
    const client = await getDbClient()
    
    // Very simple query first - just orders
    const ordersQuery = `
      SELECT 
        o.id,
        o."orderNumber",
        o."subtotalAmount",
        o."serviceFee",
        o."totalAmount",
        o."orderStatus",
        o."paymentStatus",
        o."pickupDate",
        o."createdAt",
        o."updatedAt"
      FROM orders o
      ORDER BY o."createdAt" DESC
      LIMIT 10
    `
    
    console.log('📊 Executing simple admin orders query')
    
    const ordersResult = await client.query(ordersQuery)
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      message: `Found ${ordersResult.rows.length} orders`,
      count: ordersResult.rows.length,
      orders: ordersResult.rows,
      pagination: {
        page: 1,
        limit: 10,
        total: ordersResult.rows.length,
        totalPages: 1
      }
    })
    
  } catch (error) {
    console.error('❌ Error in working admin orders API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
