import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pickupScheduler } from '@/lib/pickup-scheduler'

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
                price: true,
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
        bank: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
            accountName: true
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            amount: true,
            proofUrl: true,
            notes: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    // Transform the response to match expected format
    const transformedOrder = {
      ...order,
      // Map orderItems to items for backward compatibility
      items: order.orderItems.map(item => ({
        id: item.id,
        bundleId: item.bundleId,
        quantity: item.quantity,
        price: item.price,
        bundle: {
          ...item.bundle,
          store: item.bundle.store
        }
      })),
      // Also include orderItems for new components
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        orderId: order.id,
        bundleId: item.bundleId,
        quantity: item.quantity,
        price: item.price,
        bundle: {
          ...item.bundle,
          storeId: item.bundle.storeId,
          store: item.bundle.store
        }
      })),
      // Add derived payment fields for backward compatibility
      paymentStatus: order.payment?.status || 'PENDING',
      paymentMethod: order.payment?.method || 'BANK_TRANSFER',
      paymentProof: order.payment?.proofUrl || undefined
    }

    return NextResponse.json(transformedOrder)

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderStatus, paymentStatus, notes, pickupStatus } = body

    // Get current order to check status changes
    const currentOrder = await prisma.order.findUnique({
      where: { id }
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    // Update the order
    const updateData: any = {
      updatedAt: new Date()
    }

    if (orderStatus !== undefined) updateData.orderStatus = orderStatus
    if (notes !== undefined) updateData.notes = notes
    if (pickupStatus !== undefined) updateData.pickupStatus = pickupStatus

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
                price: true,
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
        bank: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
            accountName: true
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            amount: true,
            proofUrl: true,
            notes: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    // If paymentStatus is provided, update the payment record
    if (paymentStatus && updatedOrder.payment) {
      await prisma.payment.update({
        where: { id: updatedOrder.payment.id },
        data: {
          status: paymentStatus,
          updatedAt: new Date()
        }
      })
    }

    // Trigger pickup notifications based on status changes
    try {
      // When order status changes to READY, send pickup ready notification
      if (orderStatus === 'READY' && currentOrder.orderStatus !== 'READY') {
        await pickupScheduler.sendPickupReadyNotification(id)
        console.log(`✅ Pickup ready notification sent for order: ${id}`)
      }

      // When pickup status changes to PICKED_UP, send pickup completed notification
      if (pickupStatus === 'PICKED_UP' && currentOrder.pickupStatus !== 'PICKED_UP') {
        await pickupScheduler.sendPickupCompletedNotification(id)
        console.log(`✅ Pickup completed notification sent for order: ${id}`)
      }
    } catch (notificationError) {
      console.error('Error sending pickup notifications:', notificationError)
      // Don't fail the order update if notifications fail
    }

    // Transform the response to match expected format
    const transformedOrder = {
      ...updatedOrder,
      // Map orderItems to items for backward compatibility
      items: updatedOrder.orderItems.map(item => ({
        id: item.id,
        bundleId: item.bundleId,
        quantity: item.quantity,
        price: item.price,
        bundle: {
          ...item.bundle,
          store: item.bundle.store
        }
      })),
      // Also include orderItems for new components
      orderItems: updatedOrder.orderItems.map(item => ({
        id: item.id,
        orderId: updatedOrder.id,
        bundleId: item.bundleId,
        quantity: item.quantity,
        price: item.price,
        bundle: {
          ...item.bundle,
          storeId: item.bundle.storeId,
          store: item.bundle.store
        }
      })),
      // Add derived payment fields for backward compatibility
      paymentStatus: updatedOrder.payment?.status || 'PENDING',
      paymentMethod: updatedOrder.payment?.method || 'BANK_TRANSFER',
      paymentProof: updatedOrder.payment?.proofUrl || undefined
    }

    return NextResponse.json({
      success: true,
      message: 'Order berhasil diperbarui',
      order: transformedOrder
    })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui order' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderStatus, notes } = body

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        orderStatus,
        notes,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            bundle: {
              include: {
                store: true
              }
            }
          }
        },
        payment: true
      }
    })

    return NextResponse.json({
      success: true,
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
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    // Delete order items first (due to foreign key constraints)
    await prisma.orderItem.deleteMany({
      where: { orderId: id }
    })

    // Delete payment records if any
    await prisma.payment.deleteMany({
      where: { orderId: id }
    })

    // Delete the order
    await prisma.order.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dihapus'
    })

  } catch (error) {
    console.error('Error deleting order:', error)
    
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus pesanan karena masih memiliki data terkait' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Gagal menghapus pesanan' },
      { status: 500 }
    )
  }
}
