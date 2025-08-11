import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get total stores count
    const totalStores = await prisma.store.count({
      where: { isActive: true } // Only count active stores for public view
    })

    // Get total bundles count across all active stores
    const totalBundles = await prisma.productBundle.count({
      where: { 
        isActive: true,
        showToCustomer: true // Only count bundles that are shown to customers
      }
    })

    // Get active stores count
    const activeStores = await prisma.store.count({
      where: { isActive: true }
    })

    // Get stores with their bundle counts for public display
    const storesWithBundles = await prisma.store.findMany({
      where: { isActive: true },
      include: {
        bundles: {
          where: { 
            isActive: true,
            showToCustomer: true
          }
        }
      }
    })

    // Format stores data for public consumption (with limited fields)
    const topStoresByBundles = storesWithBundles.map(store => ({
      id: store.id,
      name: store.name,
      description: store.description,
      image: store.image,
      isActive: store.isActive,
      bundleCount: store.bundles.length,
      location: 'Venue PIT PERDAMI 2025, Bandung',
      createdAt: store.createdAt,
      updatedAt: store.updatedAt
    })).sort((a: any, b: any) => b.bundleCount - a.bundleCount)

    const result = {
      totalStores,
      totalBundles,
      activeStores,
      topStoresByBundles
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in GET /api/stores/stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store stats' },
      { status: 500 }
    )
  }
}
