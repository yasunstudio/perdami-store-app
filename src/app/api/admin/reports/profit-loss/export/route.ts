import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { startOfDay, endOfDay, subDays } from 'date-fns'

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user || !hasPermission(session.user.role as any, PERMISSIONS.REPORTS_READ)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const storeId = searchParams.get('storeId')

    // Default date range: last 30 days
    const fromDate = from ? new Date(from) : subDays(new Date(), 30)
    const toDate = to ? new Date(to) : new Date()

    // Build where clause
    const whereClause: any = {
      orderStatus: 'COMPLETED',
      pickupDate: {
        gte: startOfDay(fromDate),
        lte: endOfDay(toDate)
      }
    }

    if (storeId && storeId !== 'all') {
      whereClause.orderItems = {
        some: {
          bundle: {
            storeId: storeId
          }
        }
      }
    }

    // Get detailed transaction data for export
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            bundle: {
              include: {
                store: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for export
    const transactions = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber, // Add orderNumber for display
      createdAt: order.createdAt,
      pickupDate: order.pickupDate,
      customerName: order.user?.name || 'Guest',
      customerEmail: order.user?.email || 'N/A',
      serviceFee: order.serviceFee || 0,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      items: order.orderItems.map(item => ({
        productName: item.bundle?.name || 'Unknown Product',
        storeName: item.bundle?.store?.name || 'Unknown Store',
        storeId: item.bundle?.store?.id || 'N/A',
        quantity: item.quantity,
        unitPrice: item.unitPrice, // Use actual unitPrice from database
        totalPrice: item.totalPrice,
        costPrice: item.bundle?.costPrice || 0,
        totalCost: item.quantity * (item.bundle?.costPrice || 0),
        profit: item.totalPrice - (item.quantity * (item.bundle?.costPrice || 0)),
        margin: item.totalPrice > 0 ? ((item.totalPrice - (item.quantity * (item.bundle?.costPrice || 0))) / item.totalPrice) * 100 : 0
      }))
    }))

    // Calculate summary statistics for export
    let totalSalesRevenue = 0
    let totalServiceFee = 0
    let totalCosts = 0
    let totalOrders = orders.length

    transactions.forEach(order => {
      totalServiceFee += order.serviceFee
      order.items.forEach(item => {
        totalSalesRevenue += item.totalPrice
        totalCosts += item.totalCost
      })
    })

    return NextResponse.json({
      transactions,
      summary: {
        totalOrders,
        totalSalesRevenue,
        totalServiceFee,
        totalRevenue: totalSalesRevenue + totalServiceFee,
        totalCosts,
        netProfit: (totalSalesRevenue + totalServiceFee) - totalCosts,
        profitMargin: (totalSalesRevenue + totalServiceFee) > 0 ? (((totalSalesRevenue + totalServiceFee) - totalCosts) / (totalSalesRevenue + totalServiceFee)) * 100 : 0
      }
    })

  } catch (error) {
    console.error('Error fetching export data:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
