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

    // Build where clause for orders (customer purchases)
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

    // Get completed orders (purchases by customers)
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
    const totalPurchases = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalTransactions = orders.length
    const averageTransactionValue = totalTransactions > 0 ? totalPurchases / totalTransactions : 0

    // Get top customers by spending
    const customerSpending = new Map()
    orders.forEach(order => {
      const customerId = order.user.id
      const existing = customerSpending.get(customerId) || {
        id: order.user.id,
        name: order.user.name || 'User',
        email: order.user.email || '',
        totalSpent: 0,
        orderCount: 0
      }
      existing.totalSpent += order.totalAmount
      existing.orderCount += 1
      customerSpending.set(customerId, existing)
    })

    const topCustomers = Array.from(customerSpending.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    // Purchases by day (based on pickup date)
    const purchasesByDay = new Map()
    orders.forEach(order => {
      if (order.pickupDate) {
        const day = format(order.pickupDate, 'yyyy-MM-dd')
        const existing = purchasesByDay.get(day) || { date: day, purchases: 0, transactions: 0 }
        existing.purchases += order.totalAmount
        existing.transactions += 1
        purchasesByDay.set(day, existing)
      }
    })

    const purchasesByDayArray = Array.from(purchasesByDay.values())
      .sort((a, b) => a.date.localeCompare(b.date))

    // Purchases by store
    const storePurchases = new Map()
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (!item.bundle?.store) return
        const storeKey = item.bundle.store.id
        const existing = storePurchases.get(storeKey) || {
          storeId: item.bundle.store.id,
          storeName: item.bundle.store.name,
          purchases: 0,
          transactions: 0
        }
        existing.purchases += item.totalPrice
        storePurchases.set(storeKey, existing)
      })
    })

    // Count transactions per store
    const transactionsByStore = new Map()
    orders.forEach(order => {
      const storeIds = [...new Set(order.orderItems
        .filter(item => item.bundle?.store)
        .map(item => item.bundle!.store.id))]
      storeIds.forEach(storeId => {
        transactionsByStore.set(storeId, (transactionsByStore.get(storeId) || 0) + 1)
      })
    })

    const purchasesByStoreArray = Array.from(storePurchases.values()).map(store => ({
      ...store,
      transactions: transactionsByStore.get(store.storeId) || 0
    })).sort((a, b) => b.purchases - a.purchases)

    const reportData = {
      totalPurchases,
      totalTransactions,
      averageTransactionValue,
      topCustomers,
      purchasesByDay: purchasesByDayArray,
      purchasesByStore: purchasesByStoreArray,
      period: {
        from: format(fromDate, 'yyyy-MM-dd'),
        to: format(toDate, 'yyyy-MM-dd')
      }
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Purchase report error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
