import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
  console.log('📊 GET /api/admin/sales/analytics called')
  
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Admin authenticated, fetching sales analytics...')

    // Get date range for last 7 days
    const endDate = new Date()
    const startDate = subDays(endDate, 6) // 7 days including today
    
    console.log(`📅 Fetching orders from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`)

    // Get all orders in the last 7 days (not just recent 5)
    const ordersLast7Days = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        orderStatus: { not: 'CANCELLED' } // Exclude cancelled orders
      },
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
              select: {
                name: true,
                sellingPrice: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 Found ${ordersLast7Days.length} orders in last 7 days`)

    // Initialize sales data for each day
    const salesByDate = new Map()
    for (let i = 0; i < 7; i++) {
      const date = format(subDays(endDate, 6 - i), 'yyyy-MM-dd')
      salesByDate.set(date, { 
        date, 
        sales: 0, 
        orders: 0, 
        revenue: 0,
        dayName: format(subDays(endDate, 6 - i), 'EEE') // Mon, Tue, etc
      })
    }

    // Aggregate orders by date
    ordersLast7Days.forEach((order: any) => {
      const orderDate = format(new Date(order.createdAt), 'yyyy-MM-dd')
      if (salesByDate.has(orderDate)) {
        const existing = salesByDate.get(orderDate)
        existing.orders += 1
        existing.revenue += parseFloat(order.totalAmount.toString())
        // Calculate total quantity from order items
        existing.sales += order.orderItems?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 1
      }
    })

    const dailySalesData = Array.from(salesByDate.values())

    // Calculate summary statistics
    const totalRevenue7Days = dailySalesData.reduce((sum, day) => sum + day.revenue, 0)
    const totalOrders7Days = dailySalesData.reduce((sum, day) => sum + day.orders, 0)
    const totalItems7Days = dailySalesData.reduce((sum, day) => sum + day.sales, 0)
    const avgRevenuePerDay = totalRevenue7Days / 7
    const avgOrdersPerDay = totalOrders7Days / 7

    // Get top performing days
    const bestRevenueDay = dailySalesData.reduce((max, day) => 
      day.revenue > max.revenue ? day : max, dailySalesData[0])
    
    const bestOrdersDay = dailySalesData.reduce((max, day) => 
      day.orders > max.orders ? day : max, dailySalesData[0])

    const analyticsData = {
      dailySales: dailySalesData,
      summary: {
        totalRevenue7Days,
        totalOrders7Days,
        totalItems7Days,
        avgRevenuePerDay: Math.round(avgRevenuePerDay * 100) / 100,
        avgOrdersPerDay: Math.round(avgOrdersPerDay * 100) / 100,
        bestRevenueDay: {
          date: bestRevenueDay.date,
          dayName: bestRevenueDay.dayName,
          revenue: bestRevenueDay.revenue
        },
        bestOrdersDay: {
          date: bestOrdersDay.date,
          dayName: bestOrdersDay.dayName,
          orders: bestOrdersDay.orders
        }
      },
      recentOrdersDetail: ordersLast7Days.slice(0, 10).map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || 'Unknown',
        customerEmail: order.user?.email || '',
        totalAmount: parseFloat(order.totalAmount.toString()),
        status: order.orderStatus,
        paymentStatus: order.paymentStatus,
        itemCount: order.orderItems?.length || 0,
        createdAt: order.createdAt,
        items: order.orderItems?.map((item: any) => ({
          productName: item.bundle?.name || 'Unknown Product',
          quantity: item.quantity,
          price: parseFloat(item.bundle?.sellingPrice?.toString() || '0')
        })) || []
      }))
    }

    console.log(`✅ Sales analytics prepared: ${totalOrders7Days} orders, ${totalRevenue7Days} revenue in 7 days`)

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('❌ Error in GET /api/admin/sales/analytics:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
