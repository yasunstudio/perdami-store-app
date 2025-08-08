import { NextResponse } from 'next/server'
import { createPrismaClient } from '@/lib/prisma-serverless'
import { auth } from '@/lib/auth'
import { withDatabaseRetry, createErrorResponse } from '@/lib/database-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const store = searchParams.get('store')
    const limit = parseInt(searchParams.get('limit') || '12')
    const page = parseInt(searchParams.get('page') || '1')
    const sort = searchParams.get('sort') || 'newest'

    // Use retry logic for database operations
    const result = await withDatabaseRetry(async () => {
      // Create fresh prisma client for serverless environment to avoid prepared statement conflicts
      const prisma = createPrismaClient()
      
      try {
        // 🚨 BUNDLE-ONLY LOGIC: Role-based filtering for bundles
        const session = await auth()
        const where: any = {
          isActive: true,
          ...(featured === 'true' && { isFeatured: true }),
          ...(store && { storeId: store }),
        }

        // 🚨 BUNDLE-ONLY LOGIC: Customers can only see bundles marked as showToCustomer
        if (!session?.user || session.user.role === 'CUSTOMER') {
          where.showToCustomer = true
        }
        // Admins can see all bundles regardless of showToCustomer value

        let orderBy = {}
        switch (sort) {
          case 'price-low':
            orderBy = { price: 'asc' }
            break
          case 'price-high':
            orderBy = { price: 'desc' }
            break
          case 'name':
            orderBy = { name: 'asc' }
            break
          default:
            orderBy = { createdAt: 'desc' }
        }

        const [bundles, total] = await Promise.all([
          prisma.productBundle.findMany({
            where,
            include: {
              store: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy,
            take: limit,
            skip: (page - 1) * limit,
          }),
          prisma.productBundle.count({ where })
        ])

        return { bundles, total };
      } finally {
        // Clean up prisma client
        await prisma.$disconnect()
      }
    });

    return NextResponse.json({
      bundles: result.bundles,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      }
    })
  } catch (error) {
    return createErrorResponse(error, 'GET /api/bundles')
  }
}
