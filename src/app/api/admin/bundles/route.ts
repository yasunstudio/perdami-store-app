import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const createBundleSchema = z.object({
  name: z.string().min(1, 'Nama paket harus diisi'),
  description: z.string().optional(),
  costPrice: z.number().positive('Harga modal harus lebih dari 0'),
  sellingPrice: z.number().positive('Harga jual harus lebih dari 0'),
  image: z.string().optional(),
  contents: z.array(z.object({
    name: z.string(),
    quantity: z.number()
  })).optional(),
  storeId: z.string().min(1, 'Store harus dipilih'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  showToCustomer: z.boolean().default(false)
})

const bundleFiltersSchema = z.object({
  search: z.string().optional(),
  storeId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  sortBy: z.enum(['name', 'sellingPrice', 'costPrice', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(10)
})

// GET /api/admin/bundles - Get all bundles with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = bundleFiltersSchema.parse(Object.fromEntries(searchParams.entries()))
    
    const { search, storeId, status, sortBy, sortOrder, page, limit } = filters
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (storeId) {
      where.storeId = storeId
    }

    if (status !== 'all') {
      where.isActive = status === 'active'
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'name':
        orderBy = { name: sortOrder }
        break
      case 'sellingPrice':
        orderBy = { sellingPrice: sortOrder }
        break
      case 'costPrice':
        orderBy = { costPrice: sortOrder }
        break
      default:
        orderBy = { createdAt: sortOrder }
    }

    // Get bundles with pagination
    const [bundles, total] = await Promise.all([
      prisma.productBundle.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          costPrice: true,
          sellingPrice: true,
          contents: true, // Explicitly include contents field
          isActive: true,
          isFeatured: true,
          showToCustomer: true,
          storeId: true,
          createdAt: true,
          updatedAt: true,
          store: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.productBundle.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      bundles,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data paket produk' },
      { status: 500 }
    )
  }
}

// POST /api/admin/bundles - Create new bundle
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createBundleSchema.parse(body)

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: validatedData.storeId }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store tidak ditemukan' },
        { status: 404 }
      )
    }

    // Create bundle in transaction
    const result = await prisma.$transaction(async (tx) => {
      const bundle = await tx.productBundle.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          costPrice: validatedData.costPrice,
          sellingPrice: validatedData.sellingPrice,
          image: validatedData.image,
          contents: validatedData.contents,
          isActive: validatedData.isActive,
          isFeatured: validatedData.isFeatured,
          showToCustomer: validatedData.showToCustomer,
          storeId: validatedData.storeId
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })

      return bundle
    })

    return NextResponse.json({
      message: 'Paket produk berhasil dibuat',
      bundle: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating bundle:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Gagal membuat paket produk' },
      { status: 500 }
    )
  }
}
