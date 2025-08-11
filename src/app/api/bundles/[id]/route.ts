import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()

    console.log(`🔍 Getting bundle with ID: ${id}`)

    // Build where condition based on user role
    const where: any = {
      id,
      isActive: true
    }

    // 🚨 BUNDLE-ONLY LOGIC: Customers can only see bundles marked as showToCustomer
    if (!session?.user || session.user.role === 'CUSTOMER') {
      where.showToCustomer = true
    }
    // Admins can see all bundles regardless of showToCustomer value

    const bundle = await prisma.productBundle.findFirst({
      where,
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

    if (!bundle) {
      return NextResponse.json(
        { error: 'Bundle not found or not accessible' },
        { status: 404 }
      )
    }

    console.log(`✅ Bundle found: ${bundle.name}`)

    return NextResponse.json({
      success: true,
      bundle
    })

  } catch (error) {
    console.error('❌ Error in GET /api/bundles/[id]:', error)
    return NextResponse.json({
      error: 'Failed to fetch bundle',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update bundles via public API
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const {
      name,
      description,
      image,
      price,
      contents,
      isActive,
      isFeatured,
      showToCustomer,
      storeId
    } = body

    console.log(`🔄 Updating bundle with ID: ${id}`)

    // Verify store exists if provided
    if (storeId) {
      const store = await prisma.store.findUnique({
        where: { id: storeId }
      })

      if (!store) {
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 400 }
        )
      }
    }

    const updatedBundle = await prisma.productBundle.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(price && { price: parseFloat(price) }),
        ...(contents !== undefined && { contents }),
        ...(isActive !== undefined && { isActive }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(showToCustomer !== undefined && { showToCustomer }),
        ...(storeId && { storeId }),
        updatedAt: new Date()
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true
          }
        }
      }
    })

    console.log(`✅ Bundle updated: ${updatedBundle.name}`)

    return NextResponse.json({
      success: true,
      message: 'Bundle updated successfully',
      bundle: updatedBundle
    })

  } catch (error) {
    console.error('❌ Error in PUT /api/bundles/[id]:', error)
    return NextResponse.json({
      error: 'Failed to update bundle',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete bundles via public API
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params

    console.log(`🗑️ Deleting bundle with ID: ${id}`)

    // Check if bundle exists
    const existingBundle = await prisma.productBundle.findUnique({
      where: { id }
    })

    if (!existingBundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      )
    }

    // Check if bundle is used in any orders
    const orderItemCount = await prisma.orderItem.count({
      where: { bundleId: id }
    })

    if (orderItemCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete bundle that is referenced in orders',
        details: `Bundle is used in ${orderItemCount} order items`
      }, { status: 400 })
    }

    // Delete the bundle
    await prisma.productBundle.delete({
      where: { id }
    })

    console.log(`✅ Bundle deleted: ${existingBundle.name}`)

    return NextResponse.json({
      success: true,
      message: 'Bundle deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error in DELETE /api/bundles/[id]:', error)
    return NextResponse.json({
      error: 'Failed to delete bundle',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
