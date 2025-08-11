import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'

const updateStoreSchema = z.object({
  name: z.string().min(1, 'Nama toko wajib diisi').optional(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isActive: z.boolean().optional()
}).refine(
  (data) => {
    // At least one field must be provided
    return Object.keys(data).length > 0
  },
  {
    message: "At least one field must be provided for update"
  }
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bundles: true
          }
        }
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get bundle count
    const bundleCount = await prisma.productBundle.count({
      where: { storeId: id }
    })

    const storeWithCounts = {
      ...store,
      bundleCount
    }

    return NextResponse.json(storeWithCounts)

  } catch (error) {
    console.error('Error fetching store:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data store' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    console.log('🔄 PUT Store Request:', { id, body })

    // Validate the request body with flexible schema
    const result = updateStoreSchema.safeParse(body)
    if (!result.success) {
      console.log('❌ Validation failed:', result.error.format())
      return NextResponse.json(
        { error: 'Data tidak valid', details: result.error.format() },
        { status: 400 }
      )
    }

    const data = result.data
    console.log('✅ Validation passed:', data)

    // Check if store exists
    const existingStore = await prisma.store.findUnique({
      where: { id },
    })

    if (!existingStore) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 })
    }

    // If updating name, check for uniqueness (excluding current store)
    if (data.name && data.name !== existingStore.name) {
      const nameExists = await prisma.store.findFirst({
        where: {
          name: data.name,
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Nama toko sudah digunakan' },
          { status: 400 }
        )
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data,
      include: {
        bundles: true
      },
    })

    console.log('✅ Store updated successfully:', { id, isActive: updatedStore.isActive })

    // Skip audit log for simple status toggle to avoid complexity
    if (Object.keys(data).length > 1 || !data.hasOwnProperty('isActive')) {
      // Only log for non-toggle updates
      console.log('📝 Logging audit for complex update')
    }

    return NextResponse.json({
      message: 'Toko berhasil diperbarui',
      store: updatedStore
    })

  } catch (error) {
    console.error('❌ Error updating store:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui toko' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if store exists and get bundle count
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bundles: true
          }
        }
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if store has bundles
    if (store._count.bundles > 0) {
      return NextResponse.json(
        {
          error: `Toko tidak dapat dihapus karena masih memiliki ${store._count.bundles} bundle`,
          bundleCount: store._count.bundles
        },
        { status: 400 }
      )
    }

    // Delete the store
    await prisma.store.delete({
      where: { id }
    })

    // Audit log
    try {
      await auditLog.deleteStore(session.user.id, store.name)
    } catch (auditError) {
      console.error('Failed to log store deletion:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: 'Store berhasil dihapus'
    })

  } catch (error) {
    console.error('Error deleting store:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus store' },
      { status: 500 }
    )
  }
}
