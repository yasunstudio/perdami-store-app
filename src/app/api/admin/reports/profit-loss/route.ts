import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/permissions'
import { startOfDay, endOfDay, format, subDays, startOfMonth, endOfMonth } from 'date-fns'

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
      orderStatus: 'COMPLETED', // Only include completed orders
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

    // Get orders with detailed cost information
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate revenue and costs
    let totalRevenue = 0
    let totalCosts = 0
    const productProfitability = new Map()
    const storeProfitability = new Map()

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (!item.bundle) return

        const revenue = item.totalPrice
        const cost = item.quantity * (item.bundle.costPrice || 0)
        const profit = revenue - cost

        totalRevenue += revenue
        totalCosts += cost

        // Product profitability
        const productKey = item.bundle.id
        const existingProduct = productProfitability.get(productKey) || {
          id: item.bundle.id,
          name: item.bundle.name,
          revenue: 0,
          cost: 0,
          profit: 0,
          margin: 0
        }
        existingProduct.revenue += revenue
        existingProduct.cost += cost
        existingProduct.profit += profit
        existingProduct.margin = existingProduct.revenue > 0 ? 
          (existingProduct.profit / existingProduct.revenue) * 100 : 0
        productProfitability.set(productKey, existingProduct)

        // Store profitability
        if (item.bundle.store) {
          const storeKey = item.bundle.store.id
          const existingStore = storeProfitability.get(storeKey) || {
            storeId: item.bundle.store.id,
            storeName: item.bundle.store.name,
            revenue: 0,
            costs: 0,
            profit: 0
          }
          existingStore.revenue += revenue
          existingStore.costs += cost
          existingStore.profit += profit
          storeProfitability.set(storeKey, existingStore)
        }
      })
    })

    const grossProfit = totalRevenue - totalCosts
    
    // Assuming operational costs are 10% of revenue (can be made configurable)
    const operationalCosts = totalRevenue * 0.1
    const netProfit = grossProfit - operationalCosts
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Revenue by month for the last 12 months
    const monthlyData = new Map()
    const last12Months = Array.from({length: 12}, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        key: format(date, 'yyyy-MM')
      }
    }).reverse()

    // Initialize months with zero data
    last12Months.forEach(month => {
      monthlyData.set(month.key, {
        month: format(month.start, 'MMM yyyy'),
        revenue: 0,
        costs: 0,
        profit: 0
      })
    })

    // Calculate monthly data (based on pickup date)
    orders.forEach(order => {
      if (order.pickupDate) {
        const monthKey = format(order.pickupDate, 'yyyy-MM')
        if (monthlyData.has(monthKey)) {
          const monthData = monthlyData.get(monthKey)
          
          order.orderItems.forEach(item => {
            if (!item.bundle) return
            const revenue = item.totalPrice
            const cost = item.quantity * (item.bundle.costPrice || 0)
            
            monthData.revenue += revenue
            monthData.costs += cost
            monthData.profit = monthData.revenue - monthData.costs
          })
        }
      }
    })

    const revenueByMonth = Array.from(monthlyData.values())

    // Top profitable products
    const topProfitableProducts = Array.from(productProfitability.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)

    // Profit by store
    const profitByStore = Array.from(storeProfitability.values())
      .sort((a, b) => b.profit - a.profit)

    const reportData = {
      totalRevenue,
      totalCosts: totalCosts + operationalCosts,
      grossProfit,
      netProfit,
      profitMargin,
      revenueByMonth,
      topProfitableProducts,
      profitByStore,
      period: {
        from: format(fromDate, 'yyyy-MM-dd'),
        to: format(toDate, 'yyyy-MM-dd')
      },
      breakdown: {
        costOfGoodsSold: totalCosts,
        operationalCosts,
        grossProfitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
      }
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Profit loss report error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
