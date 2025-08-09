import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  console.log("🔍 SSL & Environment Debug")
  
  try {
    // Check environment variables (without exposing secrets)
    const dbUrl = process.env.DATABASE_URL
    const dbUrlInfo = dbUrl ? {
      hasUrl: true,
      protocol: dbUrl.split('://')[0],
      hostnameLength: dbUrl.split('@')[1]?.split('/')[0]?.length || 0,
      containsSslMode: dbUrl.includes('sslmode'),
      sslMode: dbUrl.match(/sslmode=([^&]*)/)?.[1] || 'not-specified'
    } : { hasUrl: false }

    console.log('🔗 Database URL info:', dbUrlInfo)

    // Try different connection approaches
    const results = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        ...dbUrlInfo
      },
      tests: {} as any
    }

    // Test 1: Simple $queryRaw with SSL bypass
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`
      results.tests.queryRaw = { success: true, result }
    } catch (error) {
      results.tests.queryRaw = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 2: Simple count query
    try {
      const userCount = await prisma.user.count()
      results.tests.userCount = { success: true, count: userCount }
    } catch (error) {
      results.tests.userCount = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 3: Connection with explicit SSL mode
    try {
      await prisma.$connect()
      results.tests.explicitConnect = { success: true }
    } catch (error) {
      results.tests.explicitConnect = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      status: 'debug-complete',
      timestamp: new Date().toISOString(),
      ...results
    })

  } catch (error) {
    console.error('❌ SSL Debug error:', error)
    
    return NextResponse.json({
      status: 'debug-failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
