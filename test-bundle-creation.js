const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testBundleCreation() {
  try {
    console.log('🔍 Testing bundle-only transformation...')
    
    // First, let's check if there's a category
    let category = await prisma.category.findFirst()
    
    if (!category) {
      console.log('📦 Creating test category...')
      category = await prisma.category.create({
        data: {
          name: 'Test Category',
          slug: 'test-category',
          description: 'Test category for bundle testing',
          isActive: true
        }
      })
      console.log('✅ Category created:', category.name)
    } else {
      console.log('✅ Using existing category:', category.name)
    }

    // Create test bundles
    console.log('🎁 Creating test bundles...')
    
    const timestamp = Date.now()
    
    const bundle1 = await prisma.productBundle.create({
      data: {
        name: `Premium Bundle ${timestamp}`,
        description: 'A premium bundle with multiple products',
        price: 150000,
        stock: 50,
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        categoryId: category.id,
        contents: {
          description: 'Includes 3 premium items',
          items: [
            { name: 'Product A', quantity: 1 },
            { name: 'Product B', quantity: 2 },
            { name: 'Product C', quantity: 1 }
          ]
        }
      }
    })

    const bundle2 = await prisma.productBundle.create({
      data: {
        name: `Basic Bundle ${timestamp}`,
        description: 'A basic starter bundle',
        price: 75000,
        stock: 100,
        isActive: true,
        isFeatured: false,
        showToCustomer: true,
        categoryId: category.id,
        contents: {
          description: 'Includes 2 essential items',
          items: [
            { name: 'Essential A', quantity: 1 },
            { name: 'Essential B', quantity: 1 }
          ]
        }
      }
    })

    console.log('✅ Test bundles created:')
    console.log('  1.', bundle1.name, '- Rp', bundle1.price.toLocaleString())
    console.log('  2.', bundle2.name, '- Rp', bundle2.price.toLocaleString())

    // Now create some test orders with these bundles to test the bundle-only transformation
    console.log('🛒 Creating test orders with bundle items...')
    
    // Get or create a test user
    let user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@customer.com',
          name: 'Test Customer',
          role: 'CUSTOMER',
          password: 'hashedpassword'
        }
      })
      console.log('✅ Test customer created:', user.email)
    } else {
      console.log('✅ Using existing customer:', user.email)
    }

    // Create test orders
    const order1 = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}-001`,
        userId: user.id,
        orderStatus: 'COMPLETED',
        totalAmount: 150000,
        orderItems: {
          create: [
            {
              bundleId: bundle1.id,
              quantity: 1,
              price: bundle1.price
            }
          ]
        }
      }
    })

    const order2 = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}-002`,
        userId: user.id,
        orderStatus: 'COMPLETED',
        totalAmount: 225000,
        orderItems: {
          create: [
            {
              bundleId: bundle1.id,
              quantity: 1,
              price: bundle1.price
            },
            {
              bundleId: bundle2.id,
              quantity: 1,
              price: bundle2.price
            }
          ]
        }
      }
    })

    console.log('✅ Test orders created:')
    console.log('  Order 1: Rp', order1.totalAmount.toLocaleString())
    console.log('  Order 2: Rp', order2.totalAmount.toLocaleString())

    // Test the bundle statistics that our API will use
    console.log('📊 Testing bundle statistics...')
    
    const totalBundles = await prisma.productBundle.count()
    const activeBundles = await prisma.productBundle.count({ where: { isActive: true } })
    const featuredBundles = await prisma.productBundle.count({ where: { isFeatured: true } })
    
    // Revenue from bundle orders - this is the key test for bundle-only transformation
    const bundleRevenue = await prisma.orderItem.aggregate({
      where: {
        order: { orderStatus: 'COMPLETED' }
      },
      _sum: {
        price: true
      },
      _count: true
    })

    console.log('📈 Bundle Statistics:')
    console.log('  Total Bundles:', totalBundles)
    console.log('  Active Bundles:', activeBundles)
    console.log('  Featured Bundles:', featuredBundles)
    console.log('  Bundle Revenue: Rp', bundleRevenue._sum.price?.toLocaleString() || '0')
    console.log('  Bundle Sales Count:', bundleRevenue._count || 0)

    console.log('🎉 Bundle-only transformation test completed successfully!')

  } catch (error) {
    console.error('❌ Error during bundle testing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBundleCreation()
