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

    // Calculate revenue and costs based on correct business model
    let totalRevenue = 0 // Hasil penjualan ke customer
    let serviceFeeRevenue = 0 // Biaya ongkos kirim (juga pemasukan)
    let storeCosts = 0 // Pembayaran ke toko (satu-satunya pengeluaran)
    const productProfitability = new Map()
    const storeProfitability = new Map()

    orders.forEach(order => {
      // Service fee adalah pemasukan tambahan
      serviceFeeRevenue += order.serviceFee || 0
      
      order.orderItems.forEach(item => {
        if (!item.bundle) return

        const revenue = item.totalPrice // Penjualan ke customer
        const storeCost = item.quantity * (item.bundle.costPrice || 0) // Pembayaran ke toko
        const profit = revenue - storeCost

        totalRevenue += revenue
        storeCosts += storeCost

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
        existingProduct.cost += storeCost
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
          existingStore.costs += storeCost
          existingStore.profit += profit
          storeProfitability.set(storeKey, existingStore)
        }
      })
    })

    // Business calculation:
    // Total Income = Sales Revenue + Service Fee Revenue
    // Total Costs = Store Costs only
    // Net Profit = Total Income - Total Costs
    const totalIncome = totalRevenue + serviceFeeRevenue
    const netProfit = totalIncome - storeCosts
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

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
          
          // Add service fee to monthly revenue
          const monthlyServiceFee = order.serviceFee || 0
          
          order.orderItems.forEach(item => {
            if (!item.bundle) return
            const salesRevenue = item.totalPrice // Penjualan ke customer
            const storeCost = item.quantity * (item.bundle.costPrice || 0) // Pembayaran ke toko
            
            monthData.revenue += salesRevenue
            monthData.costs += storeCost
          })
          
          // Add service fee to monthly revenue and recalculate profit
          monthData.revenue += monthlyServiceFee
          monthData.profit = monthData.revenue - monthData.costs
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
      totalRevenue: totalIncome, // Sales + Service Fee
      totalCosts: storeCosts, // Only store payments
      grossProfit: totalRevenue, // Sales revenue only
      netProfit, // Total income - store costs
      profitMargin,
      revenueByMonth,
      topProfitableProducts,
      profitByStore,
      period: {
        from: format(fromDate, 'yyyy-MM-dd'),
        to: format(toDate, 'yyyy-MM-dd')
      },
      breakdown: {
        salesRevenue: totalRevenue, // Penjualan ke customer
        serviceFeeRevenue, // Biaya ongkos kirim
        storeCosts, // Pembayaran ke toko
        totalIncome, // Sales + Service Fee
        profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
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
