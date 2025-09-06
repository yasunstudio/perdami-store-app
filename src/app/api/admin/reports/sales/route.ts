import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { startOfDay, endOfDay, format, subDays } from 'date-fns'

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
      pickupStatus: 'PICKED_UP', // Only include picked up orders
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

    // Get orders with related data
    const orders = await prisma.order.findMany({
      where: whereClause,
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
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate total metrics
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // Get top products
    const productSales = new Map()
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (!item.bundle) return
        const productKey = item.bundle.id
        const existing = productSales.get(productKey) || {
          id: item.bundle.id,
          name: item.bundle.name,
          quantity: 0,
          revenue: 0
        }
        existing.quantity += item.quantity
        existing.revenue += item.totalPrice
        productSales.set(productKey, existing)
      })
    })

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Sales by day (based on pickup date)
    const salesByDay = new Map()
    orders.forEach(order => {
      if (order.pickupDate) {
        const day = format(order.pickupDate, 'yyyy-MM-dd')
        const existing = salesByDay.get(day) || { date: day, sales: 0, orders: 0 }
        existing.sales += order.totalAmount
        existing.orders += 1
        salesByDay.set(day, existing)
      }
    })

    const salesByDayArray = Array.from(salesByDay.values())
      .sort((a, b) => a.date.localeCompare(b.date))

    // Sales by store
    const storeSales = new Map()
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (!item.bundle?.store) return
        const storeKey = item.bundle.store.id
        const existing = storeSales.get(storeKey) || {
          storeId: item.bundle.store.id,
          storeName: item.bundle.store.name,
          sales: 0,
          orders: 0
        }
        existing.sales += item.totalPrice
        storeSales.set(storeKey, existing)
      })
    })

    // Count orders per store
    const ordersByStore = new Map()
    orders.forEach(order => {
      const storeIds = [...new Set(order.orderItems
        .filter(item => item.bundle?.store)
        .map(item => item.bundle!.store.id))]
      storeIds.forEach(storeId => {
        ordersByStore.set(storeId, (ordersByStore.get(storeId) || 0) + 1)
      })
    })

    const salesByStoreArray = Array.from(storeSales.values()).map(store => ({
      ...store,
      orders: ordersByStore.get(store.storeId) || 0
    })).sort((a, b) => b.sales - a.sales)

    const reportData = {
      totalSales,
      totalOrders,
      averageOrderValue,
      topProducts,
      salesByDay: salesByDayArray,
      salesByStore: salesByStoreArray,
      period: {
        from: format(fromDate, 'yyyy-MM-dd'),
        to: format(toDate, 'yyyy-MM-dd')
      }
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Sales report error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
