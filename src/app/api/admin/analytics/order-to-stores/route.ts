import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // For now, skip authentication to get basic functionality working
    // Later we can add authentication back

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const storeIds = searchParams.get('storeIds')?.split(',').filter(Boolean) || [];
    const batchIds = searchParams.get('batchIds')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date range
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      dateFilter.lte = end;
    }

    // Build where clause
    const whereClause: any = {
      orderStatus: 'CONFIRMED',
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    };

    // Fetch orders with related data
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
    });

    // Calculate summary statistics based on cost price (what we pay to stores)
    const totalOrders = orders.length;
    
    // Calculate total value based on cost price
    let totalValue = 0;
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.bundle?.costPrice) {
          totalValue += Number(item.bundle.costPrice) * item.quantity;
        }
      });
    });
    
    // Get unique stores from order items
    const storeSet = new Set();
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.bundle?.store) {
          storeSet.add(item.bundle.store.id);
        }
      });
    });
    const storeCount = storeSet.size;
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    // Group orders by store based on their items
    const storeGroups: any = {};
    orders.forEach(order => {
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
          
          // Only add order once per store
          if (!storeGroups[store.id].orderIds.has(order.id)) {
            storeGroups[store.id].orders.push(order);
            storeGroups[store.id].orderIds.add(order.id);
          }
        }
      });
    });

    // Calculate store metrics based on cost price (what we pay to stores)
    const storeBreakdown = Object.values(storeGroups).map((group: any) => {
      const storeOrders = group.orders;
      
      // Calculate store value based on cost price of items for this store
      let storeValue = 0;
      storeOrders.forEach((order: any) => {
        order.orderItems.forEach((item: any) => {
          if (item.bundle?.store?.id === group.store.id && item.bundle?.costPrice) {
            storeValue += Number(item.bundle.costPrice) * item.quantity;
          }
        });
      });
      
      return {
        store: {
          id: group.store.id,
          name: group.store.name,
          orderCount: storeOrders.length,
          totalValue: storeValue,
          status: 'active',
          address: group.store.address,
          lastUpdated: new Date()
        },
        orders: storeOrders.map((order: any) => {
          // Calculate order value for this store based on cost price
          let orderValueForStore = 0;
          const storeItems = order.orderItems
            .filter((item: any) => item.bundle?.store?.id === group.store.id)
            .map((item: any) => {
              const costPrice = Number(item.bundle?.costPrice || 0);
              const totalCostPrice = costPrice * item.quantity;
              orderValueForStore += totalCostPrice;
              
              return {
                productId: item.bundleId,
                productName: item.bundle?.name || 'N/A',
                quantity: item.quantity,
                unitPrice: costPrice, // Use cost price instead of selling price
                totalPrice: totalCostPrice // Total cost price for this item
              };
            });
          
          return {
            id: order.id,
            customerName: order.user?.name || 'N/A',
            items: storeItems,
            totalValue: orderValueForStore, // Total amount to pay to this store
            status: order.orderStatus,
            pickupTime: order.pickupDate,
            specialRequests: order.notes
          };
        }),
        metrics: {
          totalOrders: storeOrders.length,
          totalValue: storeValue,
          averageOrderValue: storeOrders.length > 0 ? storeValue / storeOrders.length : 0,
          completionRate: 100, // Simplified - all confirmed orders
          preparationTime: 30 // Simplified - default 30 minutes
        }
      };
    });

    // Calculate top products based on cost price
    const productStats: any = {};
    orders.forEach(order => {
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
          // Use cost price instead of selling price
          const costPrice = Number(item.bundle.costPrice || 0);
          productStats[key].totalValue += costPrice * item.quantity;
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
    orders.forEach(order => {
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

    // Build response
    const responseData = {
      summary: {
        totalOrders,
        totalValue,
        averageOrderValue,
        storeCount,
        batchCount: batchIds.length || 1
      },
      storeBreakdown: storeBreakdown.sort((a, b) => b.metrics.totalValue - a.metrics.totalValue),
      batchBreakdown: [], // Simplified for now
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
      data: responseData
    });

  } catch (error) {
    console.error('Error in order-to-stores API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
