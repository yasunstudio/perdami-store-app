import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  console.log("📊 Admin orders API - Fixed Version")
  
  try {
    // Simple connection test first
    const connectionTest = await prisma.user.count().catch(() => -1)
    if (connectionTest === -1) {
      throw new Error("Database connection failed")
    }
    
    console.log(`✅ Database connected, ${connectionTest} users found`)

    // Get basic orders without complex relations first
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
        userId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`✅ Found ${orders.length} orders`)

    // Get user details separately to avoid complex joins
    const userIds = [...new Set(orders.map(o => o.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    })

    // Create user lookup map
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>)

    // Combine orders with user data
    const enrichedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: userMap[order.userId] || null
    }))

    console.log(`✅ Orders prepared successfully`)

    const response = {
      success: true,
      data: enrichedOrders,
      total: orders.length,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Admin orders API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
