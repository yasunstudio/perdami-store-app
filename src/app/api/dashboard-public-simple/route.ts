import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('📊 Dashboard Public API - Simplified Version')
  
  try {
    // Simple test - just return basic data
    const testData = {
      stats: {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalStores: 0
      },
      message: 'Dashboard public API is working',
      timestamp: new Date().toISOString()
    }

    console.log('✅ Returning test data:', testData)
    return NextResponse.json(testData)
    
  } catch (error) {
    console.error('❌ Dashboard Public API error:', error)
    
    return NextResponse.json({
      error: 'Dashboard API failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
