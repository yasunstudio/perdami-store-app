import { NextRequest, NextResponse } from 'next/server'
import { createPrismaClient } from '@/lib/prisma-serverless'
import { withDatabaseRetry, createErrorResponse } from '@/lib/database-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/quick-actions called')
    
    const result = await withDatabaseRetry(async () => {
      const prisma = createPrismaClient()
      
      try {
        console.log('Fetching quick actions from database...')
        const quickActions = await prisma.quickAction.findMany({
          orderBy: { createdAt: 'desc' }
        })
        console.log(`Found ${quickActions.length} quick actions`)
        return quickActions
      } finally {
        await prisma.$disconnect()
      }
    })

    console.log('Returning quick actions:', result.length)
    
    return NextResponse.json({
      success: true,
      data: result,
      total: result.length
    })
  } catch (error) {
    return createErrorResponse(error, 'GET /api/quick-actions')
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/quick-actions called')
    const body = await request.json()
    
    const result = await withDatabaseRetry(async () => {
      const prisma = createPrismaClient()
      
      try {
        const quickAction = await prisma.quickAction.create({
          data: {
            id: body.id || `action-${Date.now()}`,
            title: body.title,
            description: body.description,
            icon: body.icon,
            action: body.action || body.href, // Support both action and href
            color: body.color || '#3B82F6',
            updatedAt: new Date()
          }
        })
        console.log('Created quick action:', quickAction.id)
        return quickAction
      } finally {
        await prisma.$disconnect()
      }
    })

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 })
  } catch (error) {
    return createErrorResponse(error, 'POST /api/quick-actions')
  }
}
