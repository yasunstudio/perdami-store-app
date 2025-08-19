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
    
    // Get top stores by bundle count
    const topStoresByBundles = await prisma.store.findMany({
      include: {
        bundles: {
          where: {
            isActive: true
          }
        }
      },
      where: {
        isActive: true
      }
    })
    
    // Calculate bundle counts and sort
    const storesWithBundleCounts = topStoresByBundles
      .map(store => ({
        id: store.id,
        name: store.name,
        bundleCount: store.bundles.length
      }))
      .sort((a, b) => b.bundleCount - a.bundleCount)
      .slice(0, 5) // Top 5 stores
    
    console.log('Top stores by bundles:', storesWithBundleCounts)
    
    const stats = {
      totalStores,
      totalBundles,
      activeStores,
      topStoresByBundles: storesWithBundleCounts
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
