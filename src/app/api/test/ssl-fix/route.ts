import { NextRequest, NextResponse } from "next/server"
import { altPrisma } from "@/lib/prisma-alt"

export async function GET() {
  console.log("📊 Testing alternative Prisma client for SSL fix")
  
  try {
    // Test connection with SSL disabled
    console.log("🔗 Testing alternative database connection...")
    
    // Test 1: Simple count
    const userCount = await altPrisma.user.count()
    console.log(`✅ Users found: ${userCount}`)
    
    // Test 2: Get basic data
    const [totalUsers, totalBundles, totalOrders] = await Promise.all([
      altPrisma.user.count(),
      altPrisma.productBundle.count(),
      altPrisma.order.count()
    ])
    
    console.log(`📊 Counts - Users: ${totalUsers}, Bundles: ${totalBundles}, Orders: ${totalOrders}`)
    
    // Test 3: Get sample data
    const sampleUsers = await altPrisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      take: 3
    })
    
    const sampleBundles = await altPrisma.productBundle.findMany({
      select: { id: true, name: true, price: true },
      take: 3
    })
    
    const sampleOrders = await altPrisma.order.findMany({
      select: { id: true, orderNumber: true, totalAmount: true, orderStatus: true },
      take: 3
    })
    
    const results = {
      success: true,
      connection: 'SSL disabled - working',
      stats: {
        totalUsers,
        totalBundles, 
        totalOrders
      },
      samples: {
        users: sampleUsers,
        bundles: sampleBundles,
        orders: sampleOrders
      },
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(results)

  } catch (error) {
    console.error('❌ Alternative Prisma test error:', error)
    
    return NextResponse.json({
      success: false,
      connection: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
