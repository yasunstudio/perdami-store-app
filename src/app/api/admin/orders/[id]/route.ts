import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { generatePickupToken } from "@/lib/qr-code"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`[API] GET /api/admin/orders/${id}`)
    
    // Authentication check
    const session = await auth()
    console.log('[AUTH] Session check:', session ? 'authenticated' : 'not authenticated')
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[DB] Fetching order with ID:', id)

    // Get order details with all related data
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            bundle: {
              select: {
                id: true,
                name: true,
                sellingPrice: true,
                image: true,
                storeId: true,
                store: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            proofUrl: true,
            notes: true,
            createdAt: true,
            updatedAt: true
          }
        },
        bank: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
            accountName: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    console.log('[DB] Order found:', {
      id: order.id,
      orderNumber: order.orderNumber,
      paymentExists: !!order.payment,
      paymentProofUrl: order.payment?.proofUrl || 'NO_PROOF'
    })

    // Format response to match expected interface
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      bankId: order.bankId,
      subtotalAmount: order.subtotalAmount,
      serviceFee: order.serviceFee,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      pickupMethod: order.pickupMethod,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      
      // Backward compatibility fields
      paymentStatus: order.paymentStatus,
      paymentMethod: 'BANK_TRANSFER' as const,
      paymentProof: order.payment?.proofUrl || order.paymentProofUrl, // Use payment.proofUrl first, fallback to order.paymentProofUrl
      
      user: order.user,
      
      // Dual format for items to support both old and new component structures
      orderItems: order.orderItems.map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        bundleId: item.bundleId,
        quantity: item.quantity,
        price: item.unitPrice,
        bundle: {
          id: item.bundle.id,
          name: item.bundle.name,
          price: item.bundle.sellingPrice,
          image: item.bundle.image,
          storeId: item.bundle.storeId,
          store: item.bundle.store
        }
      })),
      
      items: order.orderItems.map((item: any) => ({
        id: item.id,
        bundleId: item.bundleId,
        quantity: item.quantity,
        price: item.unitPrice,
        bundle: {
          id: item.bundle.id,
          name: item.bundle.name,
          price: item.bundle.sellingPrice,
          image: item.bundle.image,
          store: item.bundle.store
        }
      })),
      
      bank: order.bank,
      payment: order.payment ? {
        id: order.payment.id,
        status: order.payment.status as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
        method: 'BANK_TRANSFER' as const,
        amount: order.payment.amount,
        proofUrl: order.payment.proofUrl,
        notes: order.payment.notes,
        createdAt: order.payment.createdAt.toISOString(),
        updatedAt: order.payment.updatedAt.toISOString()
      } : null
    }

    return NextResponse.json(formattedOrder)

  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json(
      { error: 'Gagal memuat detail order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { orderStatus, paymentStatus, pickupStatus, notes } = body

    // Validate status values
    const validOrderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED']
    const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
    const validPickupStatuses = ['NOT_PICKED_UP', 'PICKED_UP']

    if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
    }

    if (pickupStatus && !validPickupStatuses.includes(pickupStatus)) {
      return NextResponse.json({ error: 'Invalid pickup status' }, { status: 400 })
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      ...(paymentStatus && { paymentStatus: paymentStatus as PaymentStatus }),
      ...(pickupStatus && { pickupStatus }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date()
    }

    // Handle order status update
    if (orderStatus) {
      updateData.orderStatus = orderStatus as OrderStatus;
      
      // Auto-generate pickup verification token when order becomes READY
      if (orderStatus === 'READY' && !existingOrder.pickupVerificationToken) {
        updateData.pickupVerificationToken = generatePickupToken();
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            bundle: {
              select: {
                id: true,
                name: true,
                sellingPrice: true,
                image: true,
                storeId: true,
                store: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        payment: true,
        bank: true
      }
    })

    // Also update payment status if provided
    if (paymentStatus && updatedOrder.payment) {
      await prisma.payment.update({
        where: { id: updatedOrder.payment.id },
        data: {
          status: paymentStatus as PaymentStatus,
          updatedAt: new Date()
        }
      })
    }

    // Log the update
    console.log(`Order ${id} updated:`, {
      orderStatus: updatedOrder.orderStatus,
      paymentStatus: updatedOrder.paymentStatus,
      updatedBy: session.user?.email
    })

    return NextResponse.json({
      message: 'Order berhasil diperbarui',
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui order' },
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
    console.log(`[API] DELETE /api/admin/orders/${id}`)
    
    // Authentication check
    const session = await auth()
    console.log('[AUTH] Session check:', session ? 'authenticated' : 'not authenticated')
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[DB] Checking if order exists:', id)

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { 
        id: true, 
        orderNumber: true,
        orderItems: {
          select: { id: true }
        },
        payment: {
          select: { id: true }
        }
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log('[DB] Deleting order and related data:', {
      orderId: id,
      orderNumber: existingOrder.orderNumber,
      orderItemsCount: existingOrder.orderItems.length,
      hasPayment: !!existingOrder.payment
    })

    // Delete order and all related data (cascade delete)
    // Using transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete payment if exists
      if (existingOrder.payment) {
        await tx.payment.deleteMany({
          where: { orderId: id }
        })
      }

      // Delete order items
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      })

      // Finally delete the order
      await tx.order.delete({
        where: { id }
      })
    })

    console.log('[DB] Order deleted successfully:', existingOrder.orderNumber)

    return NextResponse.json({
      message: 'Order berhasil dihapus',
      deletedOrder: {
        id: existingOrder.id,
        orderNumber: existingOrder.orderNumber
      }
    })

  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus order' },
      { status: 500 }
    )
  }
}
