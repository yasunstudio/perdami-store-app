import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 Dashboard Public Health Check')
  
  try {
    return NextResponse.json({ 
      status: 'dashboard-public-ok',
      timestamp: new Date().toISOString(),
      message: 'Dashboard public API is reachable'
    })
  } catch (error) {
    console.error('❌ Dashboard public health error:', error)
    return NextResponse.json({ 
      error: 'Dashboard public health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
