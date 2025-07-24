import { prisma } from '@/lib/prisma'

/**
 * Bundle-only admin data service for dashboard statistics
 */
export class AdminDataService {
  /**
   * Get dashboard statistics with bundle-only architecture
   */
  static async getDashboardStats() {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [
        totalBundles,
        totalStores,
        totalUsers,
        totalOrders,
        recentBundles,
        recentStores,
        recentUsers,
        recentOrders
      ] = await Promise.all([
        // Count all bundles
        prisma.productBundle.count({
          where: {
            isActive: true
          }
        }),
        prisma.store.count({
          where: {
            isActive: true
          }
        }),
        prisma.user.count(),
        prisma.order.count(),
        // Recent data for growth calculation (last 30 days)
        prisma.productBundle.count({
          where: {
            isActive: true,
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }),
        prisma.store.count({
          where: {
            isActive: true,
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }),
        prisma.order.count({
          where: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        })
      ])

      // Calculate growth rates
      const bundleGrowth = totalBundles > 0 ? 
        Math.round((recentBundles / totalBundles) * 100) : 0
      const storeGrowth = totalStores > 0 ? 
        Math.round((recentStores / totalStores) * 100) : 0
      const userGrowth = totalUsers > 0 ? 
        Math.round((recentUsers / totalUsers) * 100) : 0
      const orderGrowth = totalOrders > 0 ? 
        Math.round((recentOrders / totalOrders) * 100) : 0

      return {
        totalBundles,
        totalStores,
        totalUsers,
        totalOrders,
        bundleGrowth,
        storeGrowth,
        userGrowth,
        orderGrowth
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      throw new Error('Gagal mengambil statistik dashboard')
    }
  }

  /**
   * Get recent activities for dashboard
   */
  static async getRecentActivities(limit: number = 10) {
    try {
      const [recentBundles, recentOrders, recentUsers] = await Promise.all([
        prisma.productBundle.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            store: {
              select: {
                name: true
              }
            }
          }
        }),
        prisma.order.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.user.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        })
      ])

      return {
        recentBundles,
        recentOrders,
        recentUsers
      }
    } catch (error) {
      console.error('Error getting recent activities:', error)
      throw new Error('Gagal mengambil aktivitas terbaru')
    }
  }

  /**
   * Get bundle statistics by store
   */
  static async getBundleStatsByStore() {
    try {
      const bundleStats = await prisma.store.findMany({
        include: {
          _count: {
            select: {
              bundles: true
            }
          }
        },
        orderBy: {
          bundles: {
            _count: 'desc'
          }
        },
        take: 10
      })

      return bundleStats.map(store => ({
        storeName: store.name,
        bundleCount: store._count.bundles,
        city: store.city
      }))
    } catch (error) {
      console.error('Error getting bundle stats by store:', error)
      throw new Error('Gagal mengambil statistik bundle per toko')
    }
  }

  /**
   * Get sales statistics for charts
   */
  static async getSalesStats(days: number = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        select: {
          createdAt: true,
          totalAmount: true
        }
      })

      // Group by date
      const salesByDate = orders.reduce((acc, order) => {
        const date = order.createdAt.toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = {
            date,
            revenue: 0,
            orders: 0
          }
        }
        acc[date].revenue += order.totalAmount
        acc[date].orders += 1
        return acc
      }, {} as Record<string, { date: string; revenue: number; orders: number }>)

      return Object.values(salesByDate).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    } catch (error) {
      console.error('Error getting sales stats:', error)
      throw new Error('Gagal mengambil statistik penjualan')
    }
  }

  /**
   * Get top performing bundles
   */
  static async getTopBundles(limit: number = 10) {
    try {
      const topBundles = await prisma.productBundle.findMany({
        include: {
          store: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        },
        orderBy: {
          orderItems: {
            _count: 'desc'
          }
        },
        take: limit
      })

      return topBundles.map(bundle => ({
        id: bundle.id,
        name: bundle.name,
        storeName: bundle.store.name,
        price: bundle.price,
        orderCount: bundle._count.orderItems,
        isActive: bundle.isActive,
        isFeatured: bundle.isFeatured
      }))
    } catch (error) {
      console.error('Error getting top bundles:', error)
      throw new Error('Gagal mengambil bundle terpopuler')
    }
  }

  /**
   * Get recent orders for dashboard
   */
  static async getRecentOrders(limit: number = 5) {
    try {
      const recentOrders = await prisma.order.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        }
      })

      return recentOrders
    } catch (error) {
      console.error('Error getting recent orders:', error)
      throw new Error('Gagal mengambil pesanan terbaru')
    }
  }

  /**
   * Get popular bundles for dashboard
   */
  static async getPopularBundles(limit: number = 5) {
    try {
      const popularBundles = await prisma.productBundle.findMany({
        take: limit,
        where: {
          isActive: true
        },
        include: {
          store: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              orderItems: true
            }
          },
          orderItems: {
            select: {
              quantity: true,
              price: true
            }
          }
        },
        orderBy: {
          orderItems: {
            _count: 'desc'
          }
        }
      })

      return popularBundles.map(bundle => ({
        ...bundle,
        revenue: bundle.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      }))
    } catch (error) {
      console.error('Error getting popular bundles:', error)
      throw new Error('Gagal mengambil bundle populer')
    }
  }
}
