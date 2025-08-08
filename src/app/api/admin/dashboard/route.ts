import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Vercel-optimized connection handling
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// Helper function to retry database operations
async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0) {
      console.log(`⚠️ Database operation failed, retrying... (${retries} retries left)`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return retryOperation(operation, retries - 1)
    }
    throw error
  }
}

export async function GET() {
  try {
    console.log('🔍 Admin dashboard API called on Vercel')
    
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

    console.log('✅ Admin authorized, fetching dashboard stats with Prisma')

    // Test database connection first with retry
    await retryOperation(async () => {
      await prisma.$connect()
      console.log('🔗 Database connected successfully on Vercel')
    })

    // Get basic stats using Prisma with retry logic
    const [totalUsers, totalBundles, totalOrders, totalStores] = await Promise.all([
      retryOperation(() => prisma.user.count()).catch(err => {
        console.error('❌ Error counting users:', err)
        return 0
      }),
      retryOperation(() => prisma.productBundle.count()).catch(err => {
        console.error('❌ Error counting bundles:', err)
        return 0
      }),
      retryOperation(() => prisma.order.count()).catch(err => {
        console.error('❌ Error counting orders:', err)
        return 0
      }),
      retryOperation(() => prisma.store.count()).catch(err => {
        console.error('❌ Error counting stores:', err)
        return 0
      })
    ])

    console.log('📊 Raw stats:', { totalUsers, totalBundles, totalOrders, totalStores })

    // Get recent orders (last 5) with user details - with retry
    const recentOrders = await retryOperation(() => prisma.order.findMany({
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
    })).catch(err => {
      console.error('❌ Error fetching recent orders:', err)
      return []
    })

    console.log('📋 Recent orders found:', recentOrders.length)

    // Get popular bundles with store details - with retry
    const popularBundles = await retryOperation(() => prisma.productBundle.findMany({
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
    })).catch(err => {
      console.error('❌ Error fetching popular bundles:', err)
      return []
    })

    console.log('🎁 Popular bundles found:', popularBundles.length)

    // Get revenue data with retry
    const ordersWithTotal = await retryOperation(() => prisma.order.findMany({
      select: {
        totalAmount: true,
        orderStatus: true,
        createdAt: true,
      },
    })).catch(err => {
      console.error('❌ Error fetching orders for revenue:', err)
      return []
    })

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
        totalStores,
        totalRevenue,
        pendingOrders,
        completedOrders,
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
