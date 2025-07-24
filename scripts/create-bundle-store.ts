import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createBundleStore() {
  console.log('🏪 Creating dedicated Bundle Store...')
  
  try {
    // Check if Bundle Store already exists
    const existingStore = await prisma.store.findFirst({
      where: {
        name: 'Bundle Store'
      }
    })

    if (existingStore) {
      console.log('ℹ️ Bundle Store already exists:')
      console.log(`   Store ID: ${existingStore.id}`)
      console.log(`   Store Name: ${existingStore.name}`)
      
      // Count bundles in this store
      const bundleCount = await prisma.productBundle.count({
        where: {
          storeId: existingStore.id
        }
      })
      
      return {
        store: existingStore,
        bundleCount,
        existed: true
      }
    }

    // Create Bundle Store
    const bundleStore = await prisma.store.create({
      data: {
        name: 'Bundle Store',
        description: 'Toko khusus untuk paket produk dan bundle offerings',
        image: '/images/stores/bundle-store.jpg',
        address: 'Venue PIT PERDAMI 2025',
        city: 'Bandung',
        province: 'Jawa Barat',
        isActive: true
      }
    })

    console.log('✅ Bundle Store created successfully!')
    console.log(`   Store ID: ${bundleStore.id}`)
    console.log(`   Store Name: ${bundleStore.name}`)
    console.log(`   Description: ${bundleStore.description}`)

    // Update existing bundles to use the new bundle store
    const updatedBundles = await prisma.productBundle.updateMany({
      data: {
        storeId: bundleStore.id
      }
    })

    console.log(`✅ Updated ${updatedBundles.count} existing bundles to use Bundle Store`)

    return {
      store: bundleStore,
      bundleCount: updatedBundles.count,
      existed: false
    }

  } catch (error) {
    console.error('❌ Error creating Bundle Store:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createBundleStore()
  .then((result) => {
    console.log('\n🎉 Bundle Store setup completed!')
    console.log('\n📋 Summary:')
    console.log(`   Bundle Store ID: ${result.store.id}`)
    console.log(`   Bundles in Store: ${result.bundleCount}`)
    console.log(`   Store Existed: ${result.existed ? 'Yes' : 'No'}`)
    console.log('\n🔗 Next steps:')
    console.log('   1. Update bundle components to use real store data')
    console.log('   2. Test bundle cart functionality')
    console.log('   3. Verify store analytics include bundle sales')
  })
  .catch((error) => {
    console.error('Failed to create Bundle Store:', error)
    process.exit(1)
  })
