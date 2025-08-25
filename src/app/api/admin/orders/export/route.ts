import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Staff access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    const orderStatus = searchParams.get('orderStatus')
    const paymentStatus = searchParams.get('paymentStatus')

    // Build where clause
    const where: any = {}

    if (orderStatus && orderStatus !== 'all') {
      where.orderStatus = orderStatus
    }

    if (paymentStatus && paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus
    }

    // Fetch all orders with full relations
    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        [sortField]: sortDirection
      },
      include: {
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

    // Format response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      subtotalAmount: order.subtotalAmount,
      serviceFee: order.serviceFee,
      totalAmount: order.totalAmount,
      pickupDate: order.pickupDate,
      createdAt: order.createdAt,
      items: order.orderItems.map(item => ({
        bundle: item.bundle ? {
          id: item.bundle.id,
          name: item.bundle.name,
          store: item.bundle.store
        } : null,
        quantity: item.quantity,
        price: item.unitPrice
      }))
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error('Error exporting orders:', error)
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}
