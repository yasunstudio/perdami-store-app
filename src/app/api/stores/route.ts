import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  // Extract query parameters outside try-catch so they're accessible in catch block
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit')
  const status = searchParams.get('status')
  
  try {
    console.log('GET /api/stores called')
    console.log('Query params:', { limit, status })
    
    console.log('Fetching stores from database...')
    const stores = await prisma.store.findMany({
      include: {
        bundles: true
      }
    })
    console.log(`Found ${stores.length} stores`)
    
    // Filter by status if provided
    let filteredStores = stores
    if (status === 'active') {
      filteredStores = stores.filter(store => store.isActive)
      console.log(`Filtered to ${filteredStores.length} active stores`)
    } else if (status === 'inactive') {
      filteredStores = stores.filter(store => !store.isActive)
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
    console.error('Error in GET /api/stores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    )
  }
}
