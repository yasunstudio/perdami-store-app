const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function simulateAnalyticsAPI() {
  try {
    console.log('🔧 Simulating Analytics API Logic...\n');

    // Exact same filters as the dashboard uses
    const filters = {
      storeIds: ['cmeca7qsj0006infl0f0ok5cu'], // Bebek Si Kembar
      batchIds: [], // No batch filter
      dateRange: {
        startDate: '2025-09-04',
        endDate: '2025-09-04'
      }
    };

    console.log('Filters:', JSON.stringify(filters, null, 2));

    // Build base where clause (same as API)
    const whereClause = {
      orderStatus: 'CONFIRMED'
    };

    // Add date range filter
    if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate
      };
      
      console.log('Date filter applied:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    }

    // Store filtering
    if (filters.storeIds && filters.storeIds.length > 0) {
      whereClause.orderItems = {
        some: {
          bundle: {
            storeId: {
              in: filters.storeIds
            }
          }
        }
      };
      console.log('Store filter applied for stores:', filters.storeIds);
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    // Fetch orders (same as API)
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
      take: 1000
    });

    console.log(`\n📊 Found ${orders.length} orders`);

    if (orders.length === 0) {
      console.log('❌ No orders found - this explains the empty dashboard!');
      
      // Let's debug why no orders are found
      console.log('\n🔍 Debugging why no orders found...');
      
      // Check orders without date filter
      const ordersWithoutDate = await prisma.order.findMany({
        where: {
          orderStatus: 'CONFIRMED',
          orderItems: {
            some: {
              bundle: {
                storeId: {
                  in: filters.storeIds
                }
              }
            }
          }
        }
      });
      
      console.log(`Orders without date filter: ${ordersWithoutDate.length}`);
      
      // Check orders without store filter
      const ordersWithoutStore = await prisma.order.findMany({
        where: {
          orderStatus: 'CONFIRMED',
          createdAt: {
            gte: new Date(filters.dateRange.startDate),
            lte: new Date(filters.dateRange.endDate + 'T23:59:59.999Z')
          }
        }
      });
      
      console.log(`Orders without store filter: ${ordersWithoutStore.length}`);
      
      // Check orders without any filter
      const allOrders = await prisma.order.findMany({
        where: {
          orderStatus: 'CONFIRMED'
        }
      });
      
      console.log(`All confirmed orders: ${allOrders.length}`);
      
      return;
    }

    // Log first order details
    const firstOrder = orders[0];
    console.log('\n📦 First order details:');
    console.log(`   ID: ${firstOrder.id}`);
    console.log(`   Status: ${firstOrder.orderStatus}`);
    console.log(`   Created: ${firstOrder.createdAt.toISOString()}`);
    console.log(`   Order items: ${firstOrder.orderItems.length}`);
    
    firstOrder.orderItems.forEach((item, index) => {
      console.log(`   Item ${index + 1}: ${item.bundle?.name} (Store: ${item.bundle?.store?.name})`);
    });

    // Group by store (same as API)
    const storeGroups = {};
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
          
          // Avoid duplicate orders for the same store
          if (!storeGroups[store.id].orderIds.has(order.id)) {
            storeGroups[store.id].orders.push(order);
            storeGroups[store.id].orderIds.add(order.id);
          }
        }
      });
    });

    console.log(`\n🏪 Grouped into ${Object.keys(storeGroups).length} stores`);

    // Calculate store breakdown
    const storeBreakdown = Object.values(storeGroups).map((group) => {
      const storeOrders = group.orders;
      const storeValue = storeOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      
      return {
        store: {
          id: group.store.id,
          name: group.store.name,
          orderCount: storeOrders.length,
          totalValue: storeValue
        },
        orders: storeOrders.length,
        totalValue: storeValue
      };
    });

    console.log('\n📈 Store breakdown:');
    storeBreakdown.forEach(breakdown => {
      console.log(`   ${breakdown.store.name}:`);
      console.log(`     Orders: ${breakdown.orders}`);
      console.log(`     Total Value: Rp ${breakdown.totalValue.toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateAnalyticsAPI();
