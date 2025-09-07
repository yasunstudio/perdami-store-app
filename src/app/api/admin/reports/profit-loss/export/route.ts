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

    // Build where clause - consistent with main profit-loss API
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

    // Transform data for export - consistent calculations with main API
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
      items: order.orderItems.map(item => {
        const salesRevenue = item.totalPrice // Revenue from customer payment
        const storeCost = item.quantity * (item.bundle?.costPrice || 0) // Cost paid to store
        const profit = salesRevenue - storeCost // Platform profit
        const margin = salesRevenue > 0 ? (profit / salesRevenue) * 100 : 0 // Profit margin
        
        return {
          productName: item.bundle?.name || 'Unknown Product',
          storeName: item.bundle?.store?.name || 'Unknown Store',
          storeId: item.bundle?.store?.id || 'N/A',
          quantity: item.quantity,
          unitPrice: item.unitPrice, // Use actual unitPrice from database
          totalPrice: salesRevenue,
          costPrice: item.bundle?.costPrice || 0,
          totalCost: storeCost,
          profit,
          margin
        }
      })
    }))

    // Calculate summary statistics for export - consistent with main API
    let totalSalesRevenue = 0 // Revenue from product sales only
    let totalServiceFee = 0   // Revenue from service fees
    let totalCosts = 0        // Costs paid to stores
    let totalOrders = orders.length

    transactions.forEach(order => {
      totalServiceFee += order.serviceFee
      order.items.forEach(item => {
        totalSalesRevenue += item.totalPrice
        totalCosts += item.totalCost
      })
    })

    const totalIncome = totalSalesRevenue + totalServiceFee // Total platform income
    const netProfit = totalIncome - totalCosts              // Platform net profit
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    return NextResponse.json({
      transactions,
      summary: {
        totalOrders,
        totalSalesRevenue,    // Product sales only
        totalServiceFee,      // Service fees only
        totalRevenue: totalIncome,  // Sales + Service Fee (same as main API totalRevenue)
        totalCosts,           // Store payments
        netProfit,            // Platform profit
        profitMargin          // Profit percentage
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
