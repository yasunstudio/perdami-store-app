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
      createdAt: { // Use createdAt instead of pickupDate to include all completed orders
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
        if (!item.bundle) {
          console.log(`Warning: OrderItem ${item.id} has no bundle`)
          return
        }

        const revenue = item.totalPrice // Penjualan ke customer
        const storeCost = item.quantity * (item.bundle.costPrice || 0) // Pembayaran ke toko
        const profit = revenue - storeCost

        // Debug logging for the specific product
        if (item.bundle.name && item.bundle.name.includes('Bebek Frozen')) {
          console.log(`Bebek Frozen Debug:`, {
            productName: item.bundle.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            costPrice: item.bundle.costPrice,
            bundleId: item.bundle.id,
            orderId: order.id
          })
        }

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
          margin: 0,
          quantity: 0,
          costPrice: item.bundle.costPrice || 0, // Bundle cost price (should be consistent)
          transactions: [] // Store all transaction details for verification
        }
        
        // Add this transaction to the list
        existingProduct.transactions.push({
          orderId: order.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          costPrice: item.bundle.costPrice
        })
        
        existingProduct.revenue += revenue
        existingProduct.cost += storeCost
        existingProduct.profit += profit
        existingProduct.quantity += item.quantity
        
        // Calculate average unit price as total revenue divided by total quantity
        existingProduct.avgUnitPrice = existingProduct.quantity > 0 ? 
          existingProduct.revenue / existingProduct.quantity : 0
          
        existingProduct.margin = existingProduct.revenue > 0 ? 
          (existingProduct.profit / existingProduct.revenue) * 100 : 0
          
        // Debug logging for problematic products
        if (item.bundle.name && item.bundle.name.includes('Bebek Frozen')) {
          console.log(`Product aggregation for ${item.bundle.name}:`, {
            totalRevenue: existingProduct.revenue,
            totalQuantity: existingProduct.quantity,
            calculatedAvgPrice: existingProduct.avgUnitPrice,
            transactionCount: existingProduct.transactions.length,
            lastTransaction: {
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.totalPrice
            }
          })
        }
        
        productProfitability.set(productKey, existingProduct)

        // Store profitability
        if (item.bundle.store) {
          const storeKey = item.bundle.store.id
          const existingStore = storeProfitability.get(storeKey) || {
            storeId: item.bundle.store.id,
            storeName: item.bundle.store.name,
            revenue: 0,
            costs: 0,
            profit: 0,
            orderCount: 0 // Add order count tracking
          }
          existingStore.revenue += revenue
          existingStore.costs += storeCost
          existingStore.profit += profit
          storeProfitability.set(storeKey, existingStore)
        }
      })
      
      // Count unique orders per store
      const ordersByStore = new Map()
      order.orderItems.forEach(item => {
        if (item.bundle && item.bundle.store) {
          const storeKey = item.bundle.store.id
          if (!ordersByStore.has(storeKey)) {
            ordersByStore.set(storeKey, new Set())
          }
          ordersByStore.get(storeKey).add(order.id)
        }
      })
      
      // Update order counts
      ordersByStore.forEach((orderSet, storeKey) => {
        const store = storeProfitability.get(storeKey)
        if (store) {
          store.orderCount += orderSet.size
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

    // Calculate monthly data (based on pickup date or created date if not picked up yet)
    orders.forEach(order => {
      const dateToUse = order.pickupDate || order.createdAt // Use pickup date if available, otherwise creation date
      const monthKey = format(dateToUse, 'yyyy-MM')
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
    })

    const revenueByMonth = Array.from(monthlyData.values())

    // Top profitable products - show all products, not just top 10
    // Calculate final margin for each product after all transactions are processed
    const topProfitableProducts = Array.from(productProfitability.values())
      .map(product => {
        // Calculate accurate margin: (profit / revenue) * 100
        const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0
        return {
          ...product,
          margin
        }
      })
      .sort((a, b) => b.profit - a.profit)

    // Profit by store - calculate accurate margins
    const profitByStore = Array.from(storeProfitability.values())
      .map(store => {
        // Calculate accurate margin for store
        const margin = store.revenue > 0 ? (store.profit / store.revenue) * 100 : 0
        return {
          ...store,
          margin
        }
      })
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
