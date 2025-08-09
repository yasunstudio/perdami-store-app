import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  console.log("📊 Admin bundles API - Fixed Version")
  
  try {
    // Simple connection test
    const connectionTest = await prisma.user.count().catch(() => -1)
    if (connectionTest === -1) {
      throw new Error("Database connection failed")
    }
    
    console.log(`✅ Database connected`)

    // Get bundles with basic info
    const bundles = await prisma.productBundle.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        createdAt: true,
        updatedAt: true,
        storeId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    console.log(`✅ Found ${bundles.length} bundles`)

    // Get store details separately
    const storeIds = [...new Set(bundles.map(b => b.storeId).filter(Boolean))]
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: {
        id: true,
        name: true
      }
    })

    // Create store lookup map
    const storeMap = stores.reduce((acc, store) => {
      acc[store.id] = store
      return acc
    }, {} as Record<string, any>)

    // Combine bundles with store data
    const enrichedBundles = bundles.map(bundle => ({
      ...bundle,
      store: storeMap[bundle.storeId] || null
    }))

    const response = {
      success: true,
      data: enrichedBundles,
      total: bundles.length,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Admin bundles API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bundles',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
