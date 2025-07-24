import { NextResponse } from 'next/server'
import { AdminDataService } from '@/features/admin/services/admin-data.service'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    // Check if user is admin using the same pattern as notifications
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const [stats, recentOrders, popularBundles] = await Promise.all([
      AdminDataService.getDashboardStats(),
      AdminDataService.getRecentOrders(5),
      AdminDataService.getPopularBundles(5)
    ])

    // Structure the response to match what the dashboard component expects
    const dashboardData = {
      stats: {
        totalUsers: stats.totalUsers,
        totalProducts: stats.totalBundles, // Use bundles as products replacement
        totalOrders: stats.totalOrders,
        totalStores: stats.totalStores,
        userGrowthRate: stats.userGrowth,
        productGrowthRate: stats.bundleGrowth,
        orderGrowthRate: stats.orderGrowth,
        storeGrowthRate: stats.storeGrowth
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user.name || 'Unknown',
        customerEmail: order.user.email,
        totalAmount: order.totalAmount,
        status: order.orderStatus,
        itemCount: order._count.orderItems,
        createdAt: order.createdAt
      })),
      popularProducts: popularBundles.map(bundle => ({
        id: bundle.id,
        name: bundle.name,
        price: bundle.price,
        image: bundle.image,
        storeName: bundle.store.name,
        totalSold: bundle._count.orderItems,
        revenue: bundle.revenue,
        isFeatured: bundle.isFeatured
      }))
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
