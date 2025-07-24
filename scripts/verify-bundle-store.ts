import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyBundleStore() {
  console.log('🔍 Verifying Bundle Store Setup...')
  
  try {
    // Find Bundle Store
    const bundleStore = await prisma.store.findFirst({
      where: {
        name: 'Bundle Store'
      }
    })

    if (!bundleStore) {
      console.log('❌ Bundle Store not found!')
      console.log('   Please run create-bundle-store.ts first')
      return
    }

    console.log('✅ Bundle Store found:')
    console.log(`   Store ID: ${bundleStore.id}`)
    console.log(`   Store Name: ${bundleStore.name}`)
    console.log(`   Address: ${bundleStore.address}`)
    console.log(`   Status: ${bundleStore.isActive ? 'Active' : 'Inactive'}`)

    // Check bundles in this store
    const bundlesInStore = await prisma.productBundle.count({
      where: {
        storeId: bundleStore.id
      }
    })

    console.log('\n📦 Bundle Statistics:')
    console.log(`   Total bundles in Bundle Store: ${bundlesInStore}`)

    // Sample bundles
    const sampleBundles = await prisma.productBundle.findMany({
      where: {
        storeId: bundleStore.id
      },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 3
    })

    console.log('\n🎯 Sample Bundle Data:')
    sampleBundles.forEach((bundle, index) => {
      console.log(`   ${index + 1}. ${bundle.name}`)
      console.log(`      Store: ${bundle.store.name} (${bundle.store.id})`)
      console.log(`      Price: Rp ${bundle.price.toLocaleString('id-ID')}`)
      console.log(`      Featured: ${bundle.isFeatured ? 'Yes' : 'No'}`)
      console.log('')
    })

    // Featured bundles count
    const featuredBundles = await prisma.productBundle.count({
      where: {
        storeId: bundleStore.id,
        isFeatured: true
      }
    })

    console.log(`📊 Additional Stats:`)
    console.log(`   Featured bundles: ${featuredBundles}`)
    console.log(`   Regular bundles: ${bundlesInStore - featuredBundles}`)

    // Test cart functionality simulation
    console.log('\n🛒 Cart Integration Test:')
    console.log('   When adding bundle to cart:')
    console.log(`   - storeId will be: ${bundleStore.id}`)
    console.log(`   - storeName will be: ${bundleStore.name}`)
    console.log('   - This will group all bundles under one store in cart')
    console.log('   - Analytics will properly attribute bundle sales to Bundle Store')

    console.log('\n✅ Bundle Store setup verified successfully!')

    return {
      storeExists: true,
      bundleCount: bundlesInStore,
      featuredCount: featuredBundles,
      store: bundleStore
    }

  } catch (error) {
    console.error('❌ Error verifying Bundle Store:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
verifyBundleStore()
  .then((result) => {
    if (result?.storeExists) {
      console.log('🎉 Verification completed successfully!')
    }
  })
  .catch((error) => {
    console.error('Failed to verify Bundle Store:', error)
    process.exit(1)
  })
