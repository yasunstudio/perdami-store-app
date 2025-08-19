import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'

const createStoreSchema = z.object({
  name: z.string().min(1, 'Nama toko wajib diisi'),
  description: z.string().optional(),
  image: z.string().optional(),
  whatsappNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        include: {
          _count: {
            select: {
              bundles: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.store.count({ where })
    ])

    // Get bundle counts for each store
    const storesWithCounts = await Promise.all(
      stores.map(async (store) => {
        const bundleCount = await prisma.productBundle.count({
          where: { storeId: store.id }
        })

        return {
          ...store,
          bundleCount
        }
      })
    )

    return NextResponse.json({
      stores: storesWithCounts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    })

  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data toko' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createStoreSchema.parse(body)

    // Check if store name already exists
    const existingStore = await prisma.store.findUnique({
      where: { name: validatedData.name }
    })

    if (existingStore) {
      return NextResponse.json(
        { error: 'Nama toko sudah digunakan' },
        { status: 400 }
      )
    }

    // Create new store
    const newStore = await prisma.store.create({
      data: validatedData
    })

    // Audit log
    try {
      await auditLog.createStore(session.user.id, newStore.id, { name: newStore.name })
    } catch (auditError) {
      console.error('Failed to log store creation:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: 'Toko berhasil dibuat',
      store: newStore
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating store:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Gagal membuat toko' },
      { status: 500 }
    )
  }
}
