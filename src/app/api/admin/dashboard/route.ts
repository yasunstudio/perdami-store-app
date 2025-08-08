import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    console.log('🔍 Admin dashboard API called')
    
    const session = await auth()
    console.log('👤 Session:', session?.user ? { id: session.user.id, role: session.user.role } : 'null')
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user,
          userRole: session?.user?.role
        }
      }, { status: 401 })
    }

    console.log('✅ Fetching dashboard stats with Prisma')

    // Get basic stats using Prisma with parallel queries
    const [totalUsers, totalBundles, totalOrders, totalStores] = await Promise.all([
      prisma.user.count(),
      prisma.productBundle.count(),
      prisma.order.count(),
      prisma.store.count()
    ])

    // Get recent orders (last 5) with user details
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
    })

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
    })

    // Structure the response
    const dashboardData = {
      stats: {
        totalUsers,
        totalProducts: totalBundles,
        totalOrders,
        totalStores,
        userGrowthRate: 12.5, // Mock growth rates
        productGrowthRate: 8.3,
        orderGrowthRate: 15.7,
        storeGrowthRate: 5.2
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'Unknown',
        customerEmail: order.user?.email || '',
        totalAmount: parseFloat(order.totalAmount.toString()),
        status: order.orderStatus,
        itemCount: 1, // Mock item count
        createdAt: order.createdAt
      })),
      popularProducts: popularBundles.map((bundle, index) => ({
        id: bundle.id,
        name: bundle.name,
        price: parseFloat(bundle.price.toString()),
        image: bundle.image,
        storeName: bundle.store?.name || 'Unknown',
        totalSold: Math.floor(Math.random() * 50) + 10, // Mock sales
        revenue: parseFloat(bundle.price.toString()) * (Math.floor(Math.random() * 50) + 10),
        isFeatured: index < 2
      }))
    }

    console.log('Dashboard stats:', dashboardData.stats)

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('❌ Dashboard API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
