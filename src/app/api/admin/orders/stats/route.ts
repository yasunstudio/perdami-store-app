import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get orders with detailed product information for profit calculation
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { orderStatus: 'CONFIRMED' },
          { orderStatus: 'COMPLETED' }
        ]
      },
      include: {
        orderItems: {
          include: {
            bundle: {
              select: {
                costPrice: true,
                sellingPrice: true
              }
            }
          }
        }
      }
    })

    // Calculate comprehensive statistics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    
    // Calculate product costs and profits
    let totalProductCost = 0
    let totalProductProfit = 0
    
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.bundle && item.bundle.costPrice && item.bundle.costPrice > 0) {
          const itemCost = item.bundle.costPrice * item.quantity
          const itemRevenue = item.totalPrice
          
          totalProductCost += itemCost
          totalProductProfit += (itemRevenue - itemCost)
        }
      })
    })

    // Service fee calculation (25,000 per order)
    const serviceFeeRevenue = totalOrders * 25000
    
    // Total platform profit = product profit + service fees
    const totalPlatformProfit = totalProductProfit + serviceFeeRevenue

    // Completion rate calculation
    const pendingPayments = await prisma.order.count({
      where: { orderStatus: 'PENDING' }
    })
    const allOrders = await prisma.order.count()
    const completionRate = allOrders > 0 ? (totalOrders / allOrders) * 100 : 0

    // Get order status breakdown
    const orderStatusBreakdown = await Promise.all([
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.count({ where: { orderStatus: 'CONFIRMED' } }),
      prisma.order.count({ where: { orderStatus: 'PROCESSING' } }),
      prisma.order.count({ where: { orderStatus: 'READY' } }),
      prisma.order.count({ where: { orderStatus: 'COMPLETED' } }),
      prisma.order.count({ where: { orderStatus: 'CANCELLED' } })
    ])

    const [pendingOrders, confirmedOrders, processingOrders, readyOrders, completedOrders, cancelledOrders] = orderStatusBreakdown

    // Response data
    const stats = {
      totalOrders,
      totalRevenue,
      totalPurchases: totalProductCost, // Total pembelian ke toko
      grossProfit: totalPlatformProfit, // Gross profit including service fees
      productProfit: totalProductProfit, // Profit from products only
      serviceFeeRevenue, // Revenue from service fees
      completionRate: Math.round(completionRate * 10) / 10,
      pendingPayments,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      profitMargin: totalRevenue > 0 ? (totalPlatformProfit / totalRevenue) * 100 : 0,
      // Order status breakdown
      orderStatusBreakdown: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        processing: processingOrders,
        ready: readyOrders,
        completed: completedOrders,
        cancelled: cancelledOrders
      }
    }

    return NextResponse.json({ success: true, data: stats })
    
  } catch (error) {
    console.error('Error fetching order statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order statistics' }, 
      { status: 500 }
    )
  }
}
