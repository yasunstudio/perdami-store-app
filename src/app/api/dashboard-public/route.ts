import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database for dashboard public stats')

    // Get comprehensive dashboard stats
    const [
      usersStats,
      bundlesStats, 
      storesStats,
      ordersStats,
      recentOrders,
      popularBundles
    ] = await Promise.all([
      // Users stats
      client.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as total_admins,
          COUNT(CASE WHEN role = 'CUSTOMER' THEN 1 END) as total_customers,
          COUNT(CASE WHEN "createdAt" >= date_trunc('month', CURRENT_DATE) THEN 1 END) as new_this_month
        FROM users
      `),
      
      // Bundles stats  
      client.query(`
        SELECT 
          COUNT(*) as total_bundles,
          COUNT(CASE WHEN "showToCustomer" = true THEN 1 END) as active_bundles,
          AVG(price) as avg_price
        FROM bundles
      `),
      
      // Stores stats
      client.query(`
        SELECT 
          COUNT(*) as total_stores,
          COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_stores
        FROM stores
      `),
      
      // Orders stats
      client.query(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM("totalAmount"), 0) as total_revenue,
          COUNT(CASE WHEN "createdAt" >= date_trunc('month', CURRENT_DATE) THEN 1 END) as orders_this_month
        FROM orders
      `),
      
      // Recent orders
      client.query(`
        SELECT 
          o.id, o."orderNumber", o."totalAmount", o."orderStatus", o."createdAt",
          u.name as customer_name, u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o."userId" = u.id
        ORDER BY o."createdAt" DESC
        LIMIT 5
      `),
      
      // Popular bundles
      client.query(`
        SELECT 
          b.id, b.name, b.price, b.image, b."showToCustomer",
          s.name as store_name, s."isActive" as store_active
        FROM bundles b
        LEFT JOIN stores s ON b."storeId" = s.id
        WHERE b."showToCustomer" = true
        ORDER BY b.price DESC
        LIMIT 5
      `)
    ])

    // Process results
    const users = usersStats.rows[0]
    const bundles = bundlesStats.rows[0] 
    const stores = storesStats.rows[0]
    const orders = ordersStats.rows[0]

    const dashboardData = {
      success: true,
      stats: {
        totalUsers: parseInt(users.total_users),
        totalAdmins: parseInt(users.total_admins),
        totalCustomers: parseInt(users.total_customers),
        newUsersThisMonth: parseInt(users.new_this_month),
        
        totalBundles: parseInt(bundles.total_bundles),
        activeBundles: parseInt(bundles.active_bundles),
        avgBundlePrice: parseFloat(bundles.avg_price) || 0,
        
        totalStores: parseInt(stores.total_stores),
        activeStores: parseInt(stores.active_stores),
        
        totalOrders: parseInt(orders.total_orders),
        totalRevenue: parseFloat(orders.total_revenue) || 0,
        ordersThisMonth: parseInt(orders.orders_this_month),
        
        // Growth rates (mock data for now)
        userGrowthRate: 12.5,
        bundleGrowthRate: 8.3,
        orderGrowthRate: 15.7,
        storeGrowthRate: 5.2
      },
      
      recentOrders: recentOrders.rows.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer_name || 'Unknown',
        customerEmail: order.customer_email,
        totalAmount: parseFloat(order.totalAmount),
        status: order.orderStatus,
        createdAt: order.createdAt
      })),
      
      popularBundles: popularBundles.rows.map((bundle, index) => ({
        id: bundle.id,
        name: bundle.name,
        price: parseFloat(bundle.price),
        image: bundle.image,
        storeName: bundle.store_name,
        storeActive: bundle.store_active,
        showToCustomer: bundle.showToCustomer,
        // Mock sales data
        totalSold: Math.floor(Math.random() * 50) + 10,
        isFeatured: index < 2
      }))
    }

    console.log('Public dashboard stats generated:', {
      users: dashboardData.stats.totalUsers,
      bundles: dashboardData.stats.totalBundles,
      stores: dashboardData.stats.totalStores,
      orders: dashboardData.stats.totalOrders
    })

    return NextResponse.json(dashboardData)
    
  } catch (error) {
    console.error('❌ Dashboard public API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard stats',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}
