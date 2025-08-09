import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  console.log("📊 Basic orders test API")
  
  try {
    // Very simple query - just count orders
    const orderCount = await prisma.order.count()
    
    // Get basic order info
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`✅ Found ${orderCount} orders, returning ${orders.length}`)

    return NextResponse.json({
      success: true,
      total: orderCount,
      orders: orders,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Basic orders test error:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch basic orders',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
