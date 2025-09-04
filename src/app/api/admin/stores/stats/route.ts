import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/stores/stats called')
    
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get total stores count
    const totalStores = await prisma.store.count()
    console.log(`Total stores: ${totalStores}`)
    
    // Get active stores count
    const activeStores = await prisma.store.count({
      where: {
        isActive: true
      }
    })
    console.log(`Active stores: ${activeStores}`)
    
    // Get total bundles count
    const totalBundles = await prisma.productBundle.count()
    console.log(`Total bundles: ${totalBundles}`)
    
    // Get top stores by bundle count and revenue
    const topStores = await prisma.store.findMany({
      include: {
        bundles: {
          where: {
            isActive: true
          },
          include: {
            orderItems: {
              include: {
                order: {
                  select: {
                    id: true,
                    orderStatus: true,
                    totalAmount: true
                  }
                }
              }
            }
          }
        }
      },
      where: {
        isActive: true
      }
    })
    
    // Calculate bundle counts, sales, and revenue for each store
    const storesWithStats = topStores
      .map(store => {
        const activeBundles = store.bundles.filter(bundle => bundle.isActive)
        const totalBundlesCount = activeBundles.length
        
        // Calculate unique orders and total revenue
        const uniqueOrders = new Set()
        let totalRevenue = 0
        
        activeBundles.forEach(bundle => {
          bundle.orderItems.forEach(item => {
            if (item.order && item.order.orderStatus === 'COMPLETED') {
              uniqueOrders.add(item.order.id)
              totalRevenue += item.totalPrice
            }
          })
        })
        
        return {
          id: store.id,
          name: store.name,
          totalBundles: totalBundlesCount,
          activeBundles: totalBundlesCount,
          totalOrders: uniqueOrders.size,
          totalRevenue,
          isActive: store.isActive,
          createdAt: store.createdAt
        }
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
    
    console.log('Top stores with stats:', storesWithStats.slice(0, 5))
    
    const stats = {
      totalStores,
      activeStores,
      totalBundles,
      topStoresByProducts: storesWithStats.slice(0, 10), // Top 10 stores
      topStoresByRevenue: storesWithStats.slice(0, 5)     // Top 5 by revenue
    }
    
    console.log('Returning store stats:', {
      totalStores: stats.totalStores,
      activeStores: stats.activeStores,
      totalBundles: stats.totalBundles,
      topStoresCount: stats.topStoresByProducts.length
    })
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in GET /api/admin/stores/stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store statistics' },
      { status: 500 }
    )
  }
}
