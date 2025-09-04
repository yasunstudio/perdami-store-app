import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters } = body;
    
    if (!filters) {
      return NextResponse.json({ error: 'Filters are required' }, { status: 400 });
    }
    
    // Handle date range
    let dateFilter = null;
    if (filters.dateRange) {
      const dateRange = filters.dateRange;
      let startDate, endDate;
      
      if (dateRange.from && dateRange.to) {
        startDate = new Date(dateRange.from);
        endDate = new Date(dateRange.to);
      } else if (dateRange.startDate && dateRange.endDate) {
        startDate = new Date(dateRange.startDate);
        endDate = new Date(dateRange.endDate);
      }
      
      if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        endDate.setHours(23, 59, 59, 999);
        dateFilter = { gte: startDate, lte: endDate };
      }
    }
    
    // Build query
    const whereClause: any = { orderStatus: 'CONFIRMED' };
    
    if (dateFilter) {
      whereClause.createdAt = dateFilter;
    }
    
    if (filters.storeIds && filters.storeIds.length > 0) {
      whereClause.orderItems = {
        some: {
          bundle: {
            storeId: { in: filters.storeIds }
          }
        }
      };
    }
    
    // Get orders
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
      orderBy: { createdAt: 'desc' }
    });
    
    // Apply batch filtering
    let filteredOrders = orders;
    if (filters.batchIds && filters.batchIds.length > 0) {
      filteredOrders = orders.filter(order => {
        const orderHour = order.createdAt.getHours();
        return filters.batchIds.some((batchId: string) => {
          if (batchId === 'batch_1') return orderHour >= 6 && orderHour < 18;
          if (batchId === 'batch_2') return orderHour >= 18 || orderHour < 6;
          return false;
        });
      });
    }
    
    // Calculate statistics
    const totalOrders = filteredOrders.length;
    const totalValue = filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Store statistics
    const storeStats: Record<string, any> = {};
    filteredOrders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.bundle?.store) {
          const store = item.bundle.store;
          const storeId = store.id;
          
          if (!storeStats[storeId]) {
            storeStats[storeId] = {
              id: store.id,
              name: store.name,
              ordersCount: 0,
              totalValue: 0,
              orderIds: new Set()
            };
          }
          
          if (!storeStats[storeId].orderIds.has(order.id)) {
            storeStats[storeId].orderIds.add(order.id);
            storeStats[storeId].ordersCount++;
            storeStats[storeId].totalValue += Number(order.totalAmount);
          }
        }
      });
    });
    
    const stores = Object.values(storeStats).map((store: any) => ({
      id: store.id,
      name: store.name,
      ordersCount: store.ordersCount,
      totalValue: store.totalValue
    }));
    
    // Handle empty results with suggestions
    if (totalOrders === 0) {
      const sampleOrder = await prisma.order.findFirst({
        where: { orderStatus: 'CONFIRMED' },
        include: {
          orderItems: {
            include: {
              bundle: {
                include: { store: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      const availableStores = await prisma.store.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      });
      
      return NextResponse.json({
        summary: {
          totalOrders: 0,
          totalValue: 0,
          averageOrderValue: 0,
          storeCount: 0,
          batchCount: 0
        },
        storeBreakdown: [],
        batchBreakdown: [],
        topProducts: [],
        timeAnalysis: {
          peakHours: [],
          distribution: { morning: 0, afternoon: 0, evening: 0, night: 0 }
        },
        stores: [],
        orders: [],
        filters,
        suggestions: {
          message: "No orders found with current filters. Try adjusting your search criteria.",
          availableStores: availableStores.slice(0, 5),
          sampleOrder: sampleOrder ? {
            date: sampleOrder.createdAt.toISOString().split('T')[0],
            stores: [...new Set(sampleOrder.orderItems.map(item => item.bundle?.store?.name).filter(Boolean))]
          } : null,
          tips: [
            "Try expanding your date range to include August 2025",
            "Select stores that have existing orders",
            "Try selecting both Batch 1 and Batch 2"
          ]
        }
      });
    }
    
    // Return successful result
    const result = {
      summary: {
        totalOrders,
        totalValue,
        averageOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0,
        storeCount: stores.length,
        batchCount: filters.batchIds ? filters.batchIds.length : 2
      },
      storeBreakdown: stores.map(store => ({
        store: {
          id: store.id,
          name: store.name,
          status: 'active' as const,
          lastUpdated: new Date()
        },
        orders: [],
        metrics: {
          totalOrders: store.ordersCount,
          totalValue: store.totalValue,
          averageOrderValue: store.ordersCount > 0 ? store.totalValue / store.ordersCount : 0,
          completionRate: 100,
          preparationTime: 0
        }
      })),
      batchBreakdown: [],
      topProducts: [],
      timeAnalysis: {
        peakHours: [],
        distribution: { morning: 0, afternoon: 0, evening: 0, night: 0 }
      },
      stores,
      orders: filteredOrders.slice(0, 20).map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        stores: [...new Set(order.orderItems.map(item => item.bundle?.store?.name).filter(Boolean))]
      })),
      filters
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[Preview] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
