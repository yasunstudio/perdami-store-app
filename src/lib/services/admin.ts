import { prisma } from '@/lib/prisma'

export class AdminService {
  static async getDashboardStats() {
    try {
      const [
        totalBundles,
        totalStores,
        totalUsers,
        totalOrders
      ] = await Promise.all([
        prisma.productBundle.count(),
        prisma.store.count(),
        prisma.user.count(),
        prisma.order.count()
      ])

      return {
        totalBundles,
        totalStores,
        totalUsers,
        totalOrders
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalBundles: 0,
        totalStores: 0,
        totalUsers: 0,
        totalOrders: 0
      }
    }
  }

  static async getRecentOrders(limit = 10) {
    try {
      const orders = await prisma.order.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          orderItems: true
        }
      })

      return orders.map(order => ({
        id: order.id,
        customerName: order.user.name || order.user.email || 'Customer',
        itemCount: order.orderItems.length,
        totalAmount: order.totalAmount,
        status: order.orderStatus,
        createdAt: order.createdAt
      }))
    } catch (error) {
      console.error('Error fetching recent orders:', error)
      return []
    }
  }

  static async getPopularBundles(limit = 10) {
    try {
      // Get featured bundles with better sorting logic
      const bundles = await prisma.productBundle.findMany({
        take: limit,
        where: {
          isActive: true,
          showToCustomer: true
        },
        include: {
          store: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
          { name: 'asc' }
        ]
      })

      return bundles.map(bundle => ({
        id: bundle.id,
        name: bundle.name,
        price: bundle.price,
        storeName: bundle.store.name,
        isFeatured: bundle.isFeatured
      }))
    } catch (error) {
      console.error('Error fetching popular bundles:', error)
      return []
    }
  }

  static async getStoreSummary() {
    try {
      const stores = await prisma.store.findMany({
        include: {
          _count: {
            select: {
              bundles: true
            }
          }
        }
      })

      return stores.map(store => ({
        id: store.id,
        name: store.name,
        description: store.description,
        bundleCount: store._count.bundles
      }))
    } catch (error) {
      console.error('Error fetching store summary:', error)
      return []
    }
  }
}
