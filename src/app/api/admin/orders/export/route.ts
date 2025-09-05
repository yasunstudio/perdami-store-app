import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Prisma, OrderStatus, PaymentStatus } from "@prisma/client"

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
    const sortField = searchParams.get('sortField') || 'pickupDate'
    const sortDirection = searchParams.get('sortDirection') || 'asc'
    const orderStatus = searchParams.get('orderStatus')
    const paymentStatus = searchParams.get('paymentStatus')

    // Build where clause
    const where: Prisma.OrderWhereInput = {}

    if (orderStatus && orderStatus !== 'all') {
      where.orderStatus = orderStatus as OrderStatus
    }

    if (paymentStatus && paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus as PaymentStatus
    }

    // Fetch all orders with full relations, sorted by pickup date ascending
    const orders = await prisma.order.findMany({
      where,
      orderBy: [
        {
          pickupDate: 'asc' // Orders sorted by pickup date ascending (earliest first)
        },
        {
          createdAt: 'desc' // Secondary sort by creation date for orders with same pickup date
        }
      ],
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
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

    type OrderWithRelations = Prisma.OrderGetPayload<{
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
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
        }
        payment: true
      }
    }>

    // Format response with proper typing
    const formattedOrders = orders.map((order: OrderWithRelations) => {
      const { 
        id, 
        orderNumber, 
        orderStatus, 
        paymentStatus, 
        subtotalAmount, 
        serviceFee, 
        totalAmount, 
        pickupDate, 
        createdAt, 
        notes,
        orderItems,
        user 
      } = order

      return {
        id,
        orderNumber,
        orderStatus,
        paymentStatus,
        subtotalAmount,
        serviceFee,
        totalAmount,
        pickupDate,
        createdAt,
        notes,
        user,
        items: orderItems.map(item => ({
          bundle: item.bundle ? {
            id: item.bundle.id,
            name: item.bundle.name,
            store: item.bundle.store
          } : null,
          quantity: item.quantity,
          price: item.unitPrice
        }))
      }
    })

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error('Error exporting orders:', error)
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}
