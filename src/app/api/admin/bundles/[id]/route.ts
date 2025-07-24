import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for updating bundle
const UpdateBundleSchema = z.object({
  name: z.string().min(1, 'Nama paket harus diisi'),
  description: z.string().optional(),
  price: z.number().positive('Harga harus lebih dari 0'),
  image: z.string().optional(),
  contents: z.array(z.object({
    name: z.string(),
    quantity: z.number().positive()
  })).optional(),
  storeId: z.string().cuid('ID store tidak valid'),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  showToCustomer: z.boolean().optional()
})

// GET /api/admin/bundles/[id] - Get bundle by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    const bundle = await prisma.productBundle.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            city: true
          }
        },
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

    return NextResponse.json({ bundle })

  } catch (error) {
    console.error('Error fetching bundle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }
    
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateBundleSchema.parse(body)

    // Check if bundle exists
    const existingBundle = await prisma.productBundle.findUnique({
      where: { id }
    })

    if (!existingBundle) {
      return NextResponse.json(
        { error: 'Paket produk tidak ditemukan' },
        { status: 404 }
      )
    }

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

    // Check for duplicate name (excluding current bundle)
    const duplicateBundle = await prisma.productBundle.findFirst({
      where: {
        name: validatedData.name,
        storeId: validatedData.storeId,
        id: { not: id }
      }
    })

    if (duplicateBundle) {
      return NextResponse.json(
        { error: 'Nama paket sudah ada dalam store ini' },
        { status: 409 }
      )
    }

    // Update bundle in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update bundle
      const bundle = await tx.productBundle.update({
        where: { id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          price: validatedData.price,
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
              description: true,
              address: true,
              city: true
            }
          }
        }
      })

      return bundle
    })

    return NextResponse.json({
      message: 'Paket produk berhasil diperbarui',
      bundle: result
    })

  } catch (error) {
    console.error('Error updating bundle:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Gagal memperbarui paket produk' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/bundles/[id] - Update bundle status
export async function PATCH(
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
    
    // Simple validation for partial updates
    const { isActive, isFeatured, showToCustomer } = body
    
    // Validate input data
    const updateData: { isActive?: boolean; isFeatured?: boolean; showToCustomer?: boolean } = {}
    
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive harus berupa boolean' },
          { status: 400 }
        )
      }
      updateData.isActive = isActive
    }
    
    if (isFeatured !== undefined) {
      if (typeof isFeatured !== 'boolean') {
        return NextResponse.json(
          { error: 'isFeatured harus berupa boolean' },
          { status: 400 }
        )
      }
      updateData.isFeatured = isFeatured
    }
    
    if (showToCustomer !== undefined) {
      if (typeof showToCustomer !== 'boolean') {
        return NextResponse.json(
          { error: 'showToCustomer harus berupa boolean' },
          { status: 400 }
        )
      }
      updateData.showToCustomer = showToCustomer
    }
    
    // Check if any update field is provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada field yang akan diupdate' },
        { status: 400 }
      )
    }

    // Check if bundle exists
    const existingBundle = await prisma.productBundle.findUnique({
      where: { id }
    })

    if (!existingBundle) {
      return NextResponse.json(
        { error: 'Paket produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update bundle with provided fields
    const updatedBundle = await prisma.productBundle.update({
      where: { id },
      data: updateData,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            city: true
          }
        },
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    })

    // Generate appropriate success message
    let message = 'Paket produk berhasil diperbarui'
    if (updateData.isActive !== undefined) {
      message = `Paket produk berhasil ${updateData.isActive ? 'diaktifkan' : 'dinonaktifkan'}`
    } else if (updateData.isFeatured !== undefined) {
      message = `Paket produk berhasil ${updateData.isFeatured ? 'dijadikan featured' : 'dihapus dari featured'}`
    } else if (updateData.showToCustomer !== undefined) {
      message = `Paket produk berhasil ${updateData.showToCustomer ? 'ditampilkan ke customer' : 'disembunyikan dari customer'}`
    }

    return NextResponse.json({
      message,
      bundle: updatedBundle
    })

  } catch (error) {
    console.error('Error updating bundle:', error)
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
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    
    // Check if bundle exists
    const existingBundle = await prisma.productBundle.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    })

    if (!existingBundle) {
      return NextResponse.json(
        { error: 'Paket produk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if bundle has orders (prevent deletion if it has order history)
    if (existingBundle._count.orderItems > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus paket yang sudah memiliki riwayat pesanan. Silakan nonaktifkan paket sebagai gantinya.' },
        { status: 409 }
      )
    }

    // Delete bundle (cascade will handle bundle items)
    await prisma.productBundle.delete({
      where: { id }
    })

    // TODO: Delete image from storage if exists
    if (existingBundle.image) {
      try {
        // Add image deletion logic here
        console.log('Bundle image should be deleted:', existingBundle.image)
      } catch (error) {
        console.error('Failed to delete bundle image:', error)
        // Continue with bundle deletion even if image deletion fails
      }
    }

    return NextResponse.json({
      message: 'Paket produk berhasil dihapus'
    })

  } catch (error) {
    console.error('Error deleting bundle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
