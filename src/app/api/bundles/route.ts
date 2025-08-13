import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const store = searchParams.get('store')
    const storeId = searchParams.get('storeId')
    const limit = parseInt(searchParams.get('limit') || '12')
    const page = parseInt(searchParams.get('page') || '1')
    const sort = searchParams.get('sort') || 'newest'

    // 🚨 BUNDLE-ONLY LOGIC: Role-based filtering for bundles
    const session = await auth()
    const where: any = {
      isActive: true,
      ...(featured === 'true' && { isFeatured: true }),
      ...(store && { storeId: store }),
      ...(storeId && { storeId: storeId }),
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

    return NextResponse.json({
      bundles: bundles,
      pagination: {
        page,
        limit,
        total: total,
        pages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Error in GET /api/bundles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bundles' },
      { status: 500 }
    )
  }
}
