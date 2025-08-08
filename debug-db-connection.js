const { PrismaClient } = require('@prisma/client')

async function debugDatabaseConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

  try {
    console.log('🔍 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully!')

    console.log('\n📊 Testing basic counts...')
    
    const userCount = await prisma.user.count()
    console.log(`👥 Users: ${userCount}`)
    
    const bundleCount = await prisma.productBundle.count()
    console.log(`🎁 Product Bundles: ${bundleCount}`)
    
    const orderCount = await prisma.order.count()
    console.log(`📦 Orders: ${orderCount}`)
    
    const storeCount = await prisma.store.count()
    console.log(`🏪 Stores: ${storeCount}`)

    console.log('\n💰 Testing order data...')
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
      },
      take: 5
    })
    
    console.log(`📋 Sample orders (${orders.length}):`)
    orders.forEach(order => {
      console.log(`  - ${order.orderNumber}: Rp ${order.totalAmount} (${order.orderStatus}/${order.paymentStatus})`)
    })

    console.log('\n🎁 Testing bundle data...')
    const bundles = await prisma.productBundle.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        showToCustomer: true,
      },
      take: 5
    })
    
    console.log(`🛍️ Sample bundles (${bundles.length}):`)
    bundles.forEach(bundle => {
      console.log(`  - ${bundle.name}: Rp ${bundle.price} (visible: ${bundle.showToCustomer})`)
    })

    console.log('\n👥 Testing user data...')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      take: 5
    })
    
    console.log(`🔑 Sample users (${users.length}):`)
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
    })

  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Database disconnected')
  }
}

debugDatabaseConnection()
