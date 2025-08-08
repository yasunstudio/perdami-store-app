import { NextRequest, NextResponse } from 'next/server'
import { createPrismaClient } from '@/lib/prisma-serverless'
import { z } from 'zod'

const validateBundlesSchema = z.object({
  bundleIds: z.array(z.string())
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bundleIds } = validateBundlesSchema.parse(body)

    if (bundleIds.length === 0) {
      return NextResponse.json({
        success: true,
        invalidBundles: []
      })
    }

    // Create fresh prisma client for serverless environment to avoid prepared statement conflicts
    const prisma = createPrismaClient()
    
    try {
      // Check which bundles exist and are active
      const validBundles = await prisma.productBundle.findMany({
        where: {
          id: { in: bundleIds },
          isActive: true
        },
        select: { id: true }
      })

      const validBundleIds = validBundles.map((bundle: any) => bundle.id)
      const invalidBundles = bundleIds.filter(bundleId => !validBundleIds.includes(bundleId))

      return NextResponse.json({
        success: true,
        invalidBundles
      })
    } finally {
      // Clean up prisma client
      await prisma.$disconnect()
    }

  } catch (error) {
    console.error('Error validating bundles:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
