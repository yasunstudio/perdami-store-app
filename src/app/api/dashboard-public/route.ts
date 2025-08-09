import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('📊 Dashboard Public API - Vercel Optimized')
  
  try {
    console.log('🔗 Testing database connection...')
    
    // Get basic stats with simple error handling
    const [totalUsers, totalBundles, totalOrders] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.productBundle.count({ where: { showToCustomer: true } }).catch(() => 0),
      prisma.order.count().catch(() => 0)
    ])

    console.log('📊 Stats retrieved:', { totalUsers, totalBundles, totalOrders })

    // Get recent orders (minimal info)
    const recentOrders = await prisma.order.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        createdAt: true
      }
    }).catch(() => [])

    // Get popular bundles (minimal info)
    const popularBundles = await prisma.productBundle.findMany({
      take: 3,
      where: { showToCustomer: true },
      orderBy: { price: 'desc' },
      select: {
        id: true,
        name: true,
        price: true
      }
    }).catch(() => [])

    const dashboardData = {
      stats: {
        totalUsers,
        totalProducts: totalBundles,
        totalOrders,
        totalStores: 1 // Simplified for now
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        date: order.createdAt.toISOString().split('T')[0]
      })),
      popularProducts: popularBundles.map(bundle => ({
        id: bundle.id,
        name: bundle.name,
        price: bundle.price
      }))
    }

    console.log('✅ Dashboard data prepared successfully')
    return NextResponse.json(dashboardData)
    
  } catch (error) {
    console.error('❌ Dashboard Public API error:', error)
    
    // Return fallback data
    return NextResponse.json({
      stats: {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalStores: 0
      },
      recentOrders: [],
      popularProducts: [],
      error: 'Failed to load dashboard data'
    }, { status: 500 })
  }
}
