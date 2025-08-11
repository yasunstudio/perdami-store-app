import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total bundles count
    const totalBundles = await prisma.productBundle.count()

    // Get active bundles count
    const activeBundles = await prisma.productBundle.count({
      where: { isActive: true }
    })

    // Get featured bundles count
    const featuredBundles = await prisma.productBundle.count({
      where: { 
        isActive: true,
        isFeatured: true 
      }
    })

    // Get bundles with their order counts and revenue
    const bundlesWithStats = await prisma.productBundle.findMany({
      include: {
        _count: {
          select: {
            orderItems: true
          }
        },
        orderItems: {
          select: {
            quantity: true,
            unitPrice: true
          }
        },
        store: {
          select: {
            name: true
          }
        }
      },
      where: { isActive: true },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Top 10 bundles
    })

    // Calculate bundle stats
    const topBundlesByOrders = bundlesWithStats.map(bundle => {
      const totalOrders = bundle._count.orderItems
      const totalRevenue = bundle.orderItems.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0)
      
      return {
        id: bundle.id,
        name: bundle.name,
        price: bundle.price,
        storeName: bundle.store.name,
        totalOrders,
        totalRevenue,
        isActive: bundle.isActive,
        isFeatured: bundle.isFeatured,
        image: bundle.image,
        createdAt: bundle.createdAt
      }
    }).sort((a, b) => b.totalOrders - a.totalOrders)

    // Get bundle performance by store
    const bundlesByStore = await prisma.store.findMany({
      include: {
        _count: {
          select: {
            bundles: {
              where: { isActive: true }
            }
          }
        },
        bundles: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                orderItems: true
              }
            }
          }
        }
      }
    })

    const storeStats = bundlesByStore.map(store => {
      const totalBundlesInStore = store._count.bundles
      const totalOrdersInStore = store.bundles.reduce((sum: number, bundle: any) => sum + bundle._count.orderItems, 0)
      
      return {
        storeId: store.id,
        storeName: store.name,
        totalBundles: totalBundlesInStore,
        totalOrders: totalOrdersInStore
      }
    })

    // Get bundle creation trends (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentBundles = await prisma.productBundle.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    // Calculate average bundle price
    const bundlePrices = await prisma.productBundle.findMany({
      select: { price: true },
      where: { isActive: true }
    })

    const averagePrice = bundlePrices.length > 0 
      ? bundlePrices.reduce((sum, bundle) => sum + bundle.price, 0) / bundlePrices.length 
      : 0

    // Get price range stats
    const priceRanges = {
      under50k: await prisma.productBundle.count({
        where: { 
          isActive: true,
          price: { lt: 50000 }
        }
      }),
      range50k100k: await prisma.productBundle.count({
        where: { 
          isActive: true,
          price: { gte: 50000, lt: 100000 }
        }
      }),
      range100k200k: await prisma.productBundle.count({
        where: { 
          isActive: true,
          price: { gte: 100000, lt: 200000 }
        }
      }),
      above200k: await prisma.productBundle.count({
        where: { 
          isActive: true,
          price: { gte: 200000 }
        }
      })
    }

    return NextResponse.json({
      stats: {
        totalBundles,
        activeBundles,
        featuredBundles,
        recentBundles,
        averagePrice: Math.round(averagePrice),
        bundleGrowthRate: totalBundles > 0 ? ((recentBundles / totalBundles) * 100) : 0
      },
      topSellingProducts: topBundlesByOrders, // Changed key name to match component expectation
      storeStats,
      priceRanges,
      chartData: topBundlesByOrders.slice(0, 5).map(bundle => ({
        name: bundle.name.length > 20 ? bundle.name.substring(0, 20) + '...' : bundle.name,
        orders: bundle.totalOrders,
        revenue: bundle.totalRevenue,
        price: bundle.price
      }))
    })

  } catch (error) {
    console.error('Products stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
