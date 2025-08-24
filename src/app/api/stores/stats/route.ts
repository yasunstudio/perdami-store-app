import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/stores/stats called')
    
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
                order: true
              }
            }
          }
        }
      },
      where: {
        isActive: true
      }
    })
    
    // Calculate bundle counts, sales, and revenue
    const storesWithStats = topStores
      .map(store => {
        const totalOrders = new Set()
        let totalRevenue = 0
        
        store.bundles.forEach(bundle => {
          bundle.orderItems.forEach(item => {
            if (item.order) {
              totalOrders.add(item.order.id)
              totalRevenue += item.totalPrice
            }
          })
        })
        
        return {
          id: store.id,
          name: store.name,
          totalBundles: store.bundles.length,
          activeBundles: store.bundles.filter(b => b.isActive).length,
          totalOrders: totalOrders.size,
          totalRevenue
        }
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5) // Top 5 stores
    
    console.log('Top stores with stats:', storesWithStats)
    
    const stats = {
      totalStores,
      totalBundles,
      activeStores,
      topStoresByProducts: storesWithStats
    }
    
    console.log('Returning stats:', stats)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in GET /api/stores/stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store statistics' },
      { status: 500 }
    )
  }
}
