import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBundleSchema = z.object({
  name: z.string().min(1, 'Nama paket harus diisi').optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive('Harga harus lebih dari 0').optional(),
  image: z.string().optional().nullable(),
  contents: z.array(z.object({
    name: z.string(),
    quantity: z.number()
  })).optional(),
  storeId: z.string().min(1, 'Store harus dipilih').optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  showToCustomer: z.boolean().optional()
}).refine(
  (data) => {
    // At least one field must be provided
    return Object.keys(data).length > 0
  },
  {
    message: "At least one field must be provided for update"
  }
)

// GET /api/admin/bundles/[id] - Get bundle by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bundle = await prisma.productBundle.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        }
      }
    })

    if (!bundle) {
      return NextResponse.json(
        { error: 'Paket produk tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      bundle
    })

  } catch (error) {
    console.error('Error fetching bundle:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data paket produk' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/bundles/[id] - Update bundle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    console.log('🔄 PUT Bundle Request:', { id, body })

    // Validate the request body
    const result = updateBundleSchema.safeParse(body)
    if (!result.success) {
      console.log('❌ Validation failed:', result.error.format())
      return NextResponse.json(
        { error: 'Data tidak valid', details: result.error.format() },
        { status: 400 }
      )
    }

    const data = result.data
    console.log('✅ Validation passed:', data)

    // Check if bundle exists
    const existingBundle = await prisma.productBundle.findUnique({
      where: { id },
    })

    if (!existingBundle) {
      return NextResponse.json({ error: 'Paket produk tidak ditemukan' }, { status: 404 })
    }

    // If updating name, check for uniqueness within the same store
    if (data.name && data.name !== existingBundle.name) {
      const storeId = data.storeId || existingBundle.storeId
      const nameExists = await prisma.productBundle.findFirst({
        where: {
          name: data.name,
          storeId: storeId,
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Nama paket sudah digunakan di toko ini' },
          { status: 400 }
        )
      }
    }

    // If changing store, check name uniqueness in new store
    if (data.storeId && data.storeId !== existingBundle.storeId) {
      const bundleName = data.name || existingBundle.name
      const nameExists = await prisma.productBundle.findFirst({
        where: {
          name: bundleName,
          storeId: data.storeId,
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Nama paket sudah digunakan di toko tujuan' },
          { status: 400 }
        )
      }
    }

    const updatedBundle = await prisma.productBundle.update({
      where: { id },
      data,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        }
      },
    })

    console.log('✅ Bundle updated successfully:', { id, name: updatedBundle.name })

    return NextResponse.json({
      success: true,
      message: 'Paket produk berhasil diperbarui',
      bundle: updatedBundle
    })

  } catch (error) {
    console.error('❌ Error updating bundle:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui paket produk' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/bundles/[id] - Delete bundle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if bundle exists and get order count
    const bundle = await prisma.productBundle.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    })

    if (!bundle) {
      return NextResponse.json(
        { error: 'Paket produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if bundle has orders
    if (bundle._count.orderItems > 0) {
      return NextResponse.json(
        {
          error: `Paket produk tidak dapat dihapus karena sudah memiliki ${bundle._count.orderItems} pesanan`,
          orderCount: bundle._count.orderItems
        },
        { status: 400 }
      )
    }

    // Delete the bundle
    await prisma.productBundle.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Paket produk berhasil dihapus'
    })

  } catch (error) {
    console.error('Error deleting bundle:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus paket produk' },
      { status: 500 }
    )
  }
}
