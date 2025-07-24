import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Extract query parameters outside try-catch so they're accessible in catch block
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit')
  const status = searchParams.get('status')
  
  try {
    console.log('GET /api/stores called')
    console.log('Query params:', { limit, status })
    
    // Get all stores first
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
    console.error('Error fetching stores:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Check if it's a database connection error
    const isDatabaseError = error instanceof Error && (
      error.message.includes('Can\'t reach database server') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('PrismaClientInitializationError')
    )
    
    if (isDatabaseError) {
      console.error('Database connection failed. Please start PostgreSQL database.')
      
      // Return mock data for development when database is not available
      const mockStores = [
        {
          id: '1',
          name: 'Toko Oleh-oleh Bandung',
          description: 'Toko oleh-oleh khas Bandung dengan berbagai macam produk lokal',
          image: '/images/products/placeholder.jpg',
          address: 'Jl. Braga No. 123',
          city: 'Bandung',
          province: 'Jawa Barat',
          isActive: true,
          categoryCount: 3,
          productCount: 15
        },
        {
          id: '2',
          name: 'Perdami Store Official',
          description: 'Store resmi PERDAMI dengan produk-produk pilihan untuk event PIT 2025',
          image: '/images/products/placeholder.jpg',
          address: 'Venue PIT PERDAMI 2025',
          city: 'Bandung',
          province: 'Jawa Barat',
          isActive: true,
          categoryCount: 5,
          productCount: 25
        },
        {
          id: '3',
          name: 'Souvenir Corner',
          description: 'Berbagai souvenir dan merchandise eksklusif event',
          image: '/images/products/placeholder.jpg',
          address: 'Jl. Dago No. 456',
          city: 'Bandung',
          province: 'Jawa Barat',
          isActive: true,
          categoryCount: 2,
          productCount: 12
        }
      ]
      
      let filteredMockStores = mockStores
      if (status === 'active') {
        filteredMockStores = mockStores.filter(store => store.isActive)
      }
      
      if (limit) {
        const limitNum = parseInt(limit, 10)
        if (!isNaN(limitNum) && limitNum > 0) {
          filteredMockStores = filteredMockStores.slice(0, limitNum)
        }
      }
      
      return NextResponse.json({
        success: true,
        data: filteredMockStores,
        total: filteredMockStores.length,
        warning: 'Using mock data. Database not connected.'
      })
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch stores',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
