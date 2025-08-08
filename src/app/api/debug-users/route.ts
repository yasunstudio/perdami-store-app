import { NextRequest, NextResponse } from 'next/server'
import { createPrismaClient } from '@/lib/prisma-serverless'

export async function GET(request: NextRequest) {
  const prisma = createPrismaClient()
  
  try {
    console.log('🔍 DEBUG: Checking users table...')
    
    // Raw count query
    const userCount = await prisma.user.count()
    console.log(`Raw user count: ${userCount}`)
    
    // Simple findMany
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    console.log(`Found ${users.length} users`)
    
    // Check table name specifically
    const rawQuery = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`
    console.log('Raw query result:', rawQuery)
    
    return NextResponse.json({
      debug: 'users-check',
      userCount,
      users,
      rawQuery,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
