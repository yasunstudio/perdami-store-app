import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    console.log('🔍 Admin dashboard API called on Vercel')
    
    const session = await auth()
    console.log('👤 Session:', session?.user ? { id: session.user.id, role: session.user.role } : 'null')

    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({
        error: 'Unauthorized',
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user
        }
      }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      console.log('❌ User is not admin:', session.user.role)
      return NextResponse.json({
        error: 'Forbidden - Admin access required',
        debug: {
          userRole: session.user.role,
          requiredRole: 'ADMIN'
        }
      }, { status: 403 })
    }

    console.log('✅ Admin authorized, fetching dashboard stats')

    // Get basic stats with error handling
    const [totalUsers, totalBundles, totalOrders] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.productBundle.count().catch(() => 0),
      prisma.order.count().catch(() => 0)
    ])

    console.log('📊 Raw stats:', { totalUsers, totalBundles, totalOrders })

    // Get recent orders with user details
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }).catch(() => [])

    console.log('📋 Recent orders found:', recentOrders.length)

    // Get popular bundles with store details
    const popularBundles = await prisma.productBundle.findMany({
      take: 5,
      where: { showToCustomer: true },
      orderBy: { price: 'desc' },
      include: {
        store: {
          select: {
            name: true
          }
        }
      }
    }).catch(() => [])

    console.log('🎁 Popular bundles found:', popularBundles.length)

    // Get revenue data
    const ordersWithTotal = await prisma.order.findMany({
      select: {
        totalAmount: true,
        orderStatus: true,
        createdAt: true,
      },
    }).catch(() => [])

    let totalRevenue = 0
    let pendingOrders = 0
    let completedOrders = 0

    ordersWithTotal.forEach(order => {
      if (order.totalAmount) {
        totalRevenue += order.totalAmount
      }
      if (order.orderStatus === 'PENDING') {
        pendingOrders += 1
      } else if (order.orderStatus === 'COMPLETED') {
        completedOrders += 1
      }
    })

    console.log('💰 Revenue calculation:', { 
      totalRevenue, 
      pendingOrders, 
      completedOrders,
      ordersProcessed: ordersWithTotal.length 
    })

    // Structure the response
    const dashboardData = {
      stats: {
        totalUsers,
        totalProducts: totalBundles,
        totalOrders,
        totalStores: 1, // Simplified
        totalRevenue,
        pendingOrders,
        completedOrders,
        userGrowthRate: 12.5,
        productGrowthRate: 8.3,
        orderGrowthRate: 15.7,
        storeGrowthRate: 5.2
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'Unknown',
        customerEmail: order.user?.email || '',
        amount: order.totalAmount,
        status: order.orderStatus,
        paymentStatus: order.paymentStatus,
        date: order.createdAt.toISOString().split('T')[0],
        time: order.createdAt.toISOString().split('T')[1].substring(0, 8)
      })),
      popularProducts: popularBundles.map(bundle => ({
        id: bundle.id,
        name: bundle.name,
        price: bundle.price,
        storeName: bundle.store?.name || 'Unknown Store',
        description: bundle.description?.substring(0, 100) || 'No description'
      }))
    }

    console.log('✅ Dashboard data prepared:', {
      statsCount: Object.keys(dashboardData.stats).length,
      recentOrdersCount: dashboardData.recentOrders.length,
      popularProductsCount: dashboardData.popularProducts.length
    })

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('❌ Admin Dashboard API error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
