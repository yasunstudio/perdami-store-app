import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withDatabaseRetry, createErrorResponse } from '@/lib/database-utils'

export async function GET(request: NextRequest) {
  // Extract query parameters outside try-catch so they're accessible in catch block
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit')
  const status = searchParams.get('status')
  
  try {
    console.log('GET /api/stores called')
    console.log('Query params:', { limit, status })
    
    // Use retry logic for database operations
    const result = await withDatabaseRetry(async () => {
      console.log('Fetching stores from database...')
      const stores = await prisma.store.findMany({
        include: {
          bundles: true
        }
      })
      console.log(`Found ${stores.length} stores`)
      return stores;
    });
    
    // Filter by status if provided
    let filteredStores = result
    if (status === 'active') {
      filteredStores = result.filter(store => store.isActive)
      console.log(`Filtered to ${filteredStores.length} active stores`)
    } else if (status === 'inactive') {
      filteredStores = result.filter(store => !store.isActive)
      console.log(`Filtered to ${filteredStores.length} inactive stores`)
    }
    
    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (!isNaN(limitNum) && limitNum > 0) {
        filteredStores = filteredStores.slice(0, limitNum)
        console.log(`Limited to ${filteredStores.length} stores`)
      }
    }
    
    // Transform to the format expected by the frontend
    const formattedStores = filteredStores.map(store => ({
      id: store.id,
      name: store.name,
      description: store.description,
      image: store.image,
      address: store.address,
      city: store.city,
      province: store.province,
      isActive: store.isActive,
      bundleCount: store.bundles?.length || 0,
    }))
    
    console.log('Returning stores:', formattedStores.length)
    
    return NextResponse.json({
      success: true,
      data: formattedStores,
      total: filteredStores.length
    })
  } catch (error) {
    return createErrorResponse(error, 'GET /api/stores')
  }
}
