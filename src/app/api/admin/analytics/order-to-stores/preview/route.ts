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

    console.log('Preview filters received:', { storeIds, batchIds, dateRange });

    // Build base where clause
    const whereClause: any = {
      orderStatus: 'CONFIRMED'
    };

    // Add date range filter if provided
    if (dateRange?.startDate && dateRange?.endDate) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate
      };
      
      console.log('Date filter applied:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    } else {
      console.log('No date filter applied - using all dates');
    }

    // For store filtering, we'll use the relationship properly
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
      console.log('Store filter applied for stores:', storeIds);
    } else {
      console.log('No store filter applied - using all stores');
    }

    console.log('Database where clause:', JSON.stringify(whereClause, null, 2));

    // Fetch orders from database
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
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
                    name: true,
                    description: true,
                    whatsappNumber: true,
                    contactPerson: true,
                    isActive: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000 // Reasonable limit
    });

    console.log(`Found ${orders.length} orders before filtering`);
    
    // Log sample of orders found
    if (orders.length > 0) {
      console.log('Sample order data:', {
        orderId: orders[0].id,
        createdAt: orders[0].createdAt,
        totalAmount: orders[0].totalAmount,
        orderStatus: orders[0].orderStatus,
        orderItemsCount: orders[0].orderItems.length,
        firstBundleStore: orders[0].orderItems[0]?.bundle?.store?.name
      });
    }

    // Apply batch filtering after database query (simpler and more reliable)
    let filteredOrders = orders;
    
    if (batchIds && batchIds.length > 0) {
      console.log('Applying batch filter for batches:', batchIds);
      
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const orderHour = orderDate.getHours();
        
        console.log(`Order ${order.id} created at ${orderDate.toISOString()}, hour: ${orderHour}`);
        
        const matchesBatch = batchIds.some((batchId: string) => {
          if (batchId === 'batch_1') {
            const matches = orderHour >= 6 && orderHour < 18;
            console.log(`  Checking batch_1 (6-18): ${matches}`);
            return matches;
          } else if (batchId === 'batch_2') {
            const matches = orderHour >= 18 || orderHour < 6;
            console.log(`  Checking batch_2 (18-6): ${matches}`);
            return matches;
          }
          return false;
        });
        
        console.log(`  Order ${order.id} matches selected batches: ${matchesBatch}`);
        return matchesBatch;
      });
    } else {
      console.log('No batch filter applied - using all batches');
    }

    console.log(`Found ${filteredOrders.length} orders after batch filtering`);

    // Calculate summary statistics
    const totalOrders = filteredOrders.length;
    const totalValue = filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Get unique stores from the filtered orders
    const storeSet = new Set();
    const storeDetails: any[] = [];
    filteredOrders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.bundle?.store) {
          const storeId = item.bundle.store.id;
          if (!storeSet.has(storeId)) {
            storeSet.add(storeId);
            storeDetails.push({
              id: storeId,
              name: item.bundle.store.name
            });
          }
        }
      });
    });
    const storeCount = storeSet.size;
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    console.log('Summary stats:', { totalOrders, totalValue, storeCount, averageOrderValue });
    console.log('Stores found:', storeDetails);

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
          
          // Avoid duplicate orders for the same store
          if (!storeGroups[store.id].orderIds.has(order.id)) {
            storeGroups[store.id].orders.push(order);
            storeGroups[store.id].orderIds.add(order.id);
          }
        }
      });
    });

    console.log(`Grouped into ${Object.keys(storeGroups).length} stores`);

    // Calculate store breakdown
    const storeBreakdown = Object.values(storeGroups).map((group: any) => {
      const storeOrders = group.orders;
      const storeValue = storeOrders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);
      
      return {
        store: {
          id: group.store.id,
          name: group.store.name,
          orderCount: storeOrders.length,
          totalValue: storeValue,
          status: group.store.isActive ? 'active' : 'inactive',
          address: group.store.description || '',
          lastUpdated: new Date().toISOString()
        },
        orders: storeOrders.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.user?.name || 'Unknown',
          items: order.orderItems
            .filter((item: any) => item.bundle?.store?.id === group.store.id)
            .map((item: any) => ({
              productId: item.bundleId,
              productName: item.bundle?.name || 'Unknown Product',
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice || 0),
              totalPrice: Number(item.totalPrice || 0)
            })),
          totalValue: Number(order.totalAmount),
          status: order.orderStatus,
          pickupTime: order.pickupDate ? order.pickupDate.toISOString() : null,
          specialRequests: order.notes || null,
          createdAt: order.createdAt.toISOString()
        })),
        metrics: {
          totalOrders: storeOrders.length,
          totalValue: storeValue,
          averageOrderValue: storeOrders.length > 0 ? storeValue / storeOrders.length : 0,
          completionRate: 100, // Assuming confirmed orders are completed
          preparationTime: 30 // Default preparation time
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
        averageOrderValue: Math.round(averageOrderValue),
        storeCount,
        batchCount: batchIds?.length || 0
      },
      storeBreakdown: storeBreakdown.sort((a, b) => b.metrics.totalValue - a.metrics.totalValue),
      batchBreakdown,
      topProducts: topProducts || [],
      timeAnalysis: {
        peakHours: peakHours || [],
        distribution: {
          morning: Math.round((peakHours.filter(p => parseInt(p.hour) >= 6 && parseInt(p.hour) < 12).reduce((sum, p) => sum + p.orderCount, 0) / totalOrders) * 100) || 0,
          afternoon: Math.round((peakHours.filter(p => parseInt(p.hour) >= 12 && parseInt(p.hour) < 18).reduce((sum, p) => sum + p.orderCount, 0) / totalOrders) * 100) || 0,
          evening: Math.round((peakHours.filter(p => parseInt(p.hour) >= 18 && parseInt(p.hour) < 24).reduce((sum, p) => sum + p.orderCount, 0) / totalOrders) * 100) || 0,
          night: Math.round((peakHours.filter(p => parseInt(p.hour) >= 0 && parseInt(p.hour) < 6).reduce((sum, p) => sum + p.orderCount, 0) / totalOrders) * 100) || 0
        }
      }
    };

    console.log('Final report data summary:', {
      totalOrders: reportData.summary.totalOrders,
      totalValue: reportData.summary.totalValue,
      storeCount: reportData.summary.storeCount,
      storeBreakdownCount: reportData.storeBreakdown.length,
      batchBreakdownCount: reportData.batchBreakdown.length,
      topProductsCount: reportData.topProducts.length
    });

    return NextResponse.json({
      success: true,
      reportData,
      message: `Found ${totalOrders} orders across ${storeCount} stores`
    });

  } catch (error) {
    console.error('Error generating report preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
