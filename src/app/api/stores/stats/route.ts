import { NextResponse } from 'next/server'
import { createPrismaClient } from '@/lib/prisma-serverless'
import { withDatabaseRetry, createErrorResponse } from '@/lib/database-utils'

export async function GET() {
  try {
    const result = await withDatabaseRetry(async () => {
      // Create fresh prisma client for serverless environment to avoid prepared statement conflicts
      const prisma = createPrismaClient()
      
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
            _count: {
              select: {
                bundles: {
                  where: {
                    isActive: true,
                    showToCustomer: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Top 5 stores for public view
        })

        // Calculate bundle stats for each store
        const topStoresByBundles = storesWithBundles.map((store: any) => ({
          id: store.id,
          name: store.name,
          totalBundles: store._count.bundles,
          createdAt: store.createdAt
        })).sort((a: any, b: any) => b.totalBundles - a.totalBundles)

        return {
          totalStores,
          totalBundles,
          activeStores,
          topStoresByBundles
        };
      } finally {
        // Clean up prisma client
        await prisma.$disconnect()
      }
    });

    return NextResponse.json(result)

  } catch (error) {
    return createErrorResponse(error, 'GET /api/stores/stats')
  }
}
