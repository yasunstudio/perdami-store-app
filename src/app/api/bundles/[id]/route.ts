import { NextResponse } from 'next/server'
import { createPrismaClient } from '@/lib/prisma-serverless'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Create fresh prisma client for serverless environment to avoid prepared statement conflicts
    const prisma = createPrismaClient()
    
    try {
      const params = await context.params
      const { id } = params
      const bundle = await prisma.productBundle.findUnique({
        where: { 
          id,
          isActive: true 
        },
        include: {
          store: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      if (!bundle) {
        return NextResponse.json(
          { error: 'Bundle not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(bundle)
    } finally {
      // Clean up prisma client
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('Error fetching bundle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bundle' },
      { status: 500 }
    )
  }
}
