import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total stores count
    const totalStores = await prisma.store.count()

    // Get total bundles count across all stores
    const totalBundles = await prisma.productBundle.count({
      where: { isActive: true }
    })

    // Get active stores count
    const activeStores = await prisma.store.count({
      where: { isActive: true }
    })

    // Get stores with their bundle counts
    const storesWithBundles = await prisma.store.findMany({
      include: {
        _count: {
          select: {
            bundles: true
          }
        },
        bundles: {
          select: {
            id: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Top 10 stores
    })

    // Calculate bundle stats for each store
    const topStoresByBundles = storesWithBundles.map(store => ({
      id: store.id,
      name: store.name,
      isActive: store.isActive,
      totalBundles: store._count.bundles,
      activeBundles: store.bundles.filter(bundle => bundle.isActive).length,
      createdAt: store.createdAt
    })).sort((a, b) => b.totalBundles - a.totalBundles)

    // Calculate growth rate (last 30 days vs previous 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000))

    // Stores created in last 30 days
    const recentStoresCount = await prisma.store.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Stores created in previous 30 days (30-60 days ago)
    const previousStoresCount = await prisma.store.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    })

    // Calculate growth rate percentage
    let growthRate = 0
    if (previousStoresCount > 0) {
      growthRate = ((recentStoresCount - previousStoresCount) / previousStoresCount) * 100
    } else if (recentStoresCount > 0) {
      growthRate = 100 // 100% growth if there were no stores before
    }

    // Stores without bundles
    const storesWithoutBundles = await prisma.store.findMany({
      where: {
        bundles: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    })

    // Recent stores (last 5)
    const recentStores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            bundles: true
          }
        }
      }
    })

    return NextResponse.json({
      totalStores,
      totalBundles,
      activeStores,
      inactiveStores: totalStores - activeStores,
      recentStores: recentStoresCount,
      storesWithoutBundles: storesWithoutBundles.length,
      topStoresByBundles: topStoresByBundles.slice(0, 5),
      growthRate: Math.round(growthRate * 100) / 100 // Round to 2 decimal places
    })

  } catch (error) {
    console.error('Error fetching store stats:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil statistik toko' },
      { status: 500 }
    )
  }
}
