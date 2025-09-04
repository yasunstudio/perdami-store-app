import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  console.log('📊 Admin Dashboard API - Fixed Version (Prisma Postgres)');
  
  try {
    // Test connection using simple Prisma ORM call
    const userCount = await prisma.user.count();
    console.log(`✅ Prisma Postgres connected, ${userCount} users found`);

    // Get basic stats using Prisma ORM (no more prepared statement issues!)
    const [totalUsers, totalBundles, totalOrdersAll, totalStores] = await Promise.all([
      prisma.user.count(),
      prisma.productBundle.count(),
      prisma.order.count({ where: { orderStatus: { not: 'CANCELLED' } } }), // Exclude cancelled orders
      prisma.store.count()
    ]);

    console.log('📊 Stats retrieved via Prisma ORM:', { totalUsers, totalBundles, totalOrders: totalOrdersAll, totalStores });

    // Get recent orders with user details (Prisma ORM works perfectly now)
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Get popular bundles with store details and calculate actual sales
    const popularBundles = await prisma.productBundle.findMany({
      where: { showToCustomer: true },
      include: {
        store: {
          select: {
            name: true
          }
        },
        orderItems: {
          select: {
            quantity: true,
            order: {
              select: {
                orderStatus: true
              }
            }
          }
        }
      }
    });

    // Format recent orders
    const formattedOrders = recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user?.name || 'Unknown',
      customerEmail: order.user?.email || '',
      totalAmount: parseFloat(order.totalAmount.toString()),
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      itemCount: 1,
      createdAt: order.createdAt
    }));

    // Format bundles with actual sales calculation and sort by totalSold
    const formattedBundles = popularBundles.map((bundle) => {
      // Calculate total sold from valid orders (COMPLETED and CONFIRMED)
      const totalSold = bundle.orderItems
        .filter(item => item.order.orderStatus === 'COMPLETED' || item.order.orderStatus === 'CONFIRMED')
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const actualRevenue = parseFloat(bundle.sellingPrice.toString()) * totalSold;

      return {
        id: bundle.id,
        name: bundle.name,
        price: parseFloat(bundle.sellingPrice.toString()),
        image: bundle.image,
        storeName: bundle.store?.name || 'Unknown Store',
        description: bundle.description?.substring(0, 100) || 'No description',
        totalSold,
        revenue: actualRevenue,
        isFeatured: bundle.isFeatured // Use actual database value instead of artificial ranking
      };
    })
    .sort((a, b) => b.totalSold - a.totalSold) // Sort by totalSold descending
    .slice(0, 5); // Take top 5

    // Calculate real growth rates from database
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get this month vs last month counts for real growth calculation
    const [thisMonthUsers, lastMonthUsers, thisMonthOrders, lastMonthOrders, thisMonthBundles, lastMonthBundles, thisMonthStores, lastMonthStores] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
      prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.order.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
      prisma.productBundle.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.productBundle.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
      prisma.store.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.store.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } })
    ]);

    // Calculate growth rates (avoid division by zero)
    const calculateGrowthRate = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const userGrowthRate = calculateGrowthRate(thisMonthUsers, lastMonthUsers);
    const productGrowthRate = calculateGrowthRate(thisMonthBundles, lastMonthBundles);
    const orderGrowthRate = calculateGrowthRate(thisMonthOrders, lastMonthOrders);
    const storeGrowthRate = calculateGrowthRate(thisMonthStores, lastMonthStores);

    // Calculate revenue stats - include both COMPLETED and CONFIRMED orders
    const allValidOrders = await prisma.order.findMany({
      where: { 
        orderStatus: { in: ['COMPLETED', 'CONFIRMED'] }
      },
      select: {
        totalAmount: true,
        orderStatus: true
      }
    });

    const totalRevenue = allValidOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0);
    
    // Get order status counts for dashboard stats - CONSISTENT LOGIC
    const [pendingOrdersCount, completedOrdersCount, cancelledOrdersCount, todayOrdersCount] = await Promise.all([
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.count({ where: { orderStatus: 'COMPLETED' } }),
      prisma.order.count({ where: { orderStatus: 'CANCELLED' } }),
      // Today's orders (exclude cancelled) - consistent with total orders logic
      prisma.order.count({ 
        where: { 
          createdAt: { 
            gte: new Date(new Date().setHours(0, 0, 0, 0)) // Start of today
          },
          orderStatus: { not: 'CANCELLED' }
        } 
      })
    ]);

    console.log(`📊 Growth Analysis - Current vs Previous Month:`);
    console.log(`Users: ${thisMonthUsers} vs ${lastMonthUsers} = ${userGrowthRate.toFixed(1)}%`);
    console.log(`Orders: ${thisMonthOrders} vs ${lastMonthOrders} = ${orderGrowthRate.toFixed(1)}%`);
    console.log(`Products: ${thisMonthBundles} vs ${lastMonthBundles} = ${productGrowthRate.toFixed(1)}%`);
    console.log(`Stores: ${thisMonthStores} vs ${lastMonthStores} = ${storeGrowthRate.toFixed(1)}%`);
    console.log(`💰 Revenue Analysis: Total Revenue from ${allValidOrders.length} valid orders = ${totalRevenue}`);
    console.log(`📊 Order Status: Pending=${pendingOrdersCount}, Completed=${completedOrdersCount}, Cancelled=${cancelledOrdersCount}`);
    console.log(`📅 Today's Orders (exclude cancelled): ${todayOrdersCount}`);

    const dashboardData = {
      stats: {
        totalUsers,
        totalProducts: totalBundles,
        totalOrders: totalOrdersAll, // Exclude cancelled orders - CONSISTENT
        totalStores,
        totalRevenue,
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        todayOrders: todayOrdersCount, // New field for today's orders
        userGrowthRate: Math.round(userGrowthRate * 10) / 10, // Round to 1 decimal
        productGrowthRate: Math.round(productGrowthRate * 10) / 10,
        orderGrowthRate: Math.round(orderGrowthRate * 10) / 10,
        storeGrowthRate: Math.round(storeGrowthRate * 10) / 10
      },
      recentOrders: formattedOrders,
      popularProducts: formattedBundles
    };

    console.log(`✅ Dashboard data prepared successfully - ${totalUsers} users, ${totalBundles} bundles, ${totalOrdersAll} orders (exclude cancelled), ${totalStores} stores`);

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('❌ Dashboard API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
