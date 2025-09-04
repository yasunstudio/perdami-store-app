import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { filters } = await request.json();
    
    if (!filters) {
      return NextResponse.json(
        { error: 'Filters are required' },
        { status: 400 }
      );
    }

    const { storeIds, batchIds, dateRange } = filters;

    // Build base where clause
    const whereClause: any = {
      orderStatus: 'CONFIRMED'
    };

    // Build date range filter
    if (dateRange?.startDate) {
      whereClause.createdAt = {
        gte: new Date(dateRange.startDate)
      };
    }
    if (dateRange?.endDate) {
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: end
      };
    }

    // Build batch filter if specified
    if (batchIds && batchIds.length > 0) {
      const batchConditions = batchIds.map((batchId: string) => {
        const today = new Date();
        
        if (batchId === 'batch_1') {
          // Batch 1: 06:00-18:00
          const batchStart = new Date(today);
          batchStart.setHours(6, 0, 0, 0);
          const batchEnd = new Date(today);
          batchEnd.setHours(18, 0, 0, 0);
          
          return {
            AND: [
              { createdAt: { gte: batchStart } },
              { createdAt: { lt: batchEnd } }
            ]
          };
        } else if (batchId === 'batch_2') {
          // Batch 2: 18:00-06:00 (spans midnight)
          const batchStart = new Date(today);
          batchStart.setHours(18, 0, 0, 0);
          const batchEndTomorrow = new Date(today);
          batchEndTomorrow.setDate(today.getDate() + 1);
          batchEndTomorrow.setHours(6, 0, 0, 0);
          
          // Also include yesterday's evening to today's morning
          const batchStartYesterday = new Date(today);
          batchStartYesterday.setDate(today.getDate() - 1);
          batchStartYesterday.setHours(18, 0, 0, 0);
          const batchEndToday = new Date(today);
          batchEndToday.setHours(6, 0, 0, 0);
          
          return {
            OR: [
              {
                AND: [
                  { createdAt: { gte: batchStart } },
                  { createdAt: { lt: batchEndTomorrow } }
                ]
              },
              {
                AND: [
                  { createdAt: { gte: batchStartYesterday } },
                  { createdAt: { lt: batchEndToday } }
                ]
              }
            ]
          };
        }
        return {};
      });

      if (batchConditions.length > 0) {
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({ OR: batchConditions });
      }
    }

    // Store filter (through orderItems -> bundle -> store relationship)
    if (storeIds && storeIds.length > 0) {
      whereClause.orderItems = {
        some: {
          bundle: {
            storeId: {
              in: storeIds
            }
          }
        }
      };
    }

    // Fetch orders with related data
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: true,
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
    });

    // Filter by store if specified
    let filteredOrders = orders;
    if (storeIds && storeIds.length > 0) {
      filteredOrders = orders.filter(order => 
        order.orderItems.some(item => 
          item.bundle?.store && storeIds.includes(item.bundle.store.id)
        )
      );
    }

    // Calculate summary statistics
    const totalOrders = filteredOrders.length;
    const totalValue = filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Get unique stores
    const storeSet = new Set();
    filteredOrders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.bundle?.store) {
          storeSet.add(item.bundle.store.id);
        }
      });
    });
    const storeCount = storeSet.size;
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    // Group orders by store
    const storeGroups: any = {};
    filteredOrders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.bundle?.store) {
          const store = item.bundle.store;
          if (!storeGroups[store.id]) {
            storeGroups[store.id] = {
              store: store,
              orders: [],
              orderIds: new Set()
            };
          }
          
          if (!storeGroups[store.id].orderIds.has(order.id)) {
            storeGroups[store.id].orders.push(order);
            storeGroups[store.id].orderIds.add(order.id);
          }
        }
      });
    });

    // Calculate store metrics
    const storeBreakdown = Object.values(storeGroups).map((group: any) => {
      const storeOrders = group.orders;
      const storeValue = storeOrders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);
      
      return {
        store: {
          id: group.store.id,
          name: group.store.name,
          orderCount: storeOrders.length,
          totalValue: storeValue,
          status: 'active',
          address: group.store.description || '',
          lastUpdated: new Date()
        },
        orders: storeOrders.map((order: any) => ({
          id: order.id,
          customerName: order.user?.name || 'N/A',
          items: order.orderItems
            .filter((item: any) => item.bundle?.store?.id === group.store.id)
            .map((item: any) => ({
              productId: item.bundleId,
              productName: item.bundle?.name || 'N/A',
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice)
            })),
          totalValue: Number(order.totalAmount),
          status: order.orderStatus,
          pickupTime: order.pickupDate,
          specialRequests: order.notes
        })),
        metrics: {
          totalOrders: storeOrders.length,
          totalValue: storeValue,
          averageOrderValue: storeOrders.length > 0 ? storeValue / storeOrders.length : 0,
          completionRate: 100,
          preparationTime: 30
        }
      };
    });

    // Calculate top products
    const productStats: any = {};
    filteredOrders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.bundle && item.bundleId) {
          const key = item.bundleId;
          if (!productStats[key]) {
            productStats[key] = {
              productId: key,
              productName: item.bundle.name || 'N/A',
              totalQuantity: 0,
              totalValue: 0,
              storeCount: new Set()
            };
          }
          productStats[key].totalQuantity += item.quantity;
          productStats[key].totalValue += Number(item.totalPrice);
          if (item.bundle.store) {
            productStats[key].storeCount.add(item.bundle.store.id);
          }
        }
      });
    });

    const topProducts = Object.values(productStats)
      .map((product: any) => ({
        ...product,
        storeCount: product.storeCount.size,
        rank: 0
      }))
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)
      .map((product: any, index: number) => ({
        ...product,
        rank: index + 1
      }));

    // Calculate time analysis
    const hourlyStats: any = {};
    filteredOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = 0;
      }
      hourlyStats[hour]++;
    });

    const peakHours = Object.entries(hourlyStats)
      .map(([hour, count]: [string, any]) => ({
        hour,
        orderCount: count,
        percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);

    // Calculate real batch breakdown
    const batchBreakdown = [];
    
    if (batchIds && batchIds.length > 0) {
      for (const batchId of batchIds) {
        // Get orders specifically for this batch
        const batchOrders = filteredOrders.filter(order => {
          const orderHour = new Date(order.createdAt).getHours();
          
          if (batchId === 'batch_1') {
            return orderHour >= 6 && orderHour < 18;
          } else if (batchId === 'batch_2') {
            return orderHour >= 18 || orderHour < 6;
          }
          return false;
        });

        const batchOrderCount = batchOrders.length;
        const batchTotalValue = batchOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        
        // Get unique stores in this batch
        const batchStoreSet = new Set();
        batchOrders.forEach(order => {
          order.orderItems.forEach(item => {
            if (item.bundle?.store) {
              batchStoreSet.add(item.bundle.store.id);
            }
          });
        });

        batchBreakdown.push({
          batch: {
            id: batchId,
            name: batchId === 'batch_1' ? 'Batch 1 (06:00-18:00)' : 'Batch 2 (18:00-06:00)',
            orderCount: batchOrderCount,
            totalValue: batchTotalValue
          },
          storeCount: batchStoreSet.size,
          orderDistribution: [],
          peakTime: batchId === 'batch_1' ? '12:00' : '20:00'
        });
      }
    }

    const reportData = {
      summary: {
        totalOrders,
        totalValue,
        averageOrderValue,
        storeCount,
        batchCount: batchIds?.length || 1
      },
      storeBreakdown: storeBreakdown.sort((a, b) => b.metrics.totalValue - a.metrics.totalValue),
      batchBreakdown,
      topProducts,
      timeAnalysis: {
        peakHours,
        distribution: {
          morning: 0,
          afternoon: 0,
          evening: 0,
          night: 0
        }
      }
    };

    return NextResponse.json({
      success: true,
      reportData
    });

  } catch (error) {
    console.error('Error generating report preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
