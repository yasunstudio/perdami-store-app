import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createAdditionalBundles() {
  console.log('🌱 Creating additional product bundles...')

  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true }
    })

    if (stores.length === 0) {
      console.log('❌ No active stores found.')
      return
    }

    // Additional bundles with different stores
    const additionalBundles = [
      {
        name: 'Paket Bisnis Corporate Gift',
        description: 'Paket khusus untuk corporate gift atau hadiah bisnis. Kemasan mewah dan produk berkualitas tinggi.',
        image: '/images/products/placeholder.jpg',
        price: 450000,
        isActive: true,
        isFeatured: true,
        storeId: stores[0].id,
        contents: [
          { item: 'Item Corporate 1', quantity: 2 },
          { item: 'Item Corporate 2', quantity: 1 },
          { item: 'Item Corporate 3', quantity: 3 },
        ]
      },
      {
        name: 'Paket Kudapan Sore',
        description: 'Koleksi makanan ringan yang sempurna untuk menemani waktu santai di sore hari. Rasa autentik Bandung.',
        image: '/images/products/placeholder.jpg',
        price: 85000,
        isActive: true,
        isFeatured: false,
        storeId: stores[Math.floor(Math.random() * stores.length)].id,
        contents: [
          { item: 'Kudapan Sore 1', quantity: 2 },
          { item: 'Kudapan Sore 2', quantity: 1 },
        ]
      },
      {
        name: 'Paket Festival Kuliner',
        description: 'Paket spesial yang menampilkan beragam cita rasa kuliner Bandung. Dari manis hingga gurih, semua ada disini.',
        image: '/images/products/placeholder.jpg',
        price: 195000,
        isActive: true,
        isFeatured: true,
        storeId: stores[Math.floor(Math.random() * stores.length)].id,
        contents: [
          { item: 'Item Festival 1', quantity: 1 },
          { item: 'Item Festival 2', quantity: 2 },
          { item: 'Item Festival 3', quantity: 1 },
          { item: 'Item Festival 4', quantity: 2 },
        ]
      },
      {
        name: 'Paket Mini Tasting',
        description: 'Paket kecil untuk mencicipi berbagai produk unggulan. Cocok untuk hadiah kecil atau personal tasting.',
        image: '/images/products/placeholder.jpg',
        price: 45000,
        isActive: true,
        isFeatured: false,
        storeId: stores[Math.floor(Math.random() * stores.length)].id,
        contents: [
          { item: 'Mini Tasting 1', quantity: 1 },
          { item: 'Mini Tasting 2', quantity: 1 },
        ]
      },
      {
        name: 'Paket Celebration Special',
        description: 'Paket istimewa untuk merayakan momen spesial. Berisi produk premium dengan packaging eksklusif.',
        image: '/images/products/placeholder.jpg',
        price: 275000,
        isActive: true,
        isFeatured: true,
        storeId: stores[Math.floor(Math.random() * stores.length)].id,
        contents: [
          { item: 'Celebration Item 1', quantity: 2 },
          { item: 'Celebration Item 2', quantity: 1 },
          { item: 'Celebration Item 3', quantity: 3 },
          { item: 'Celebration Item 4', quantity: 1 },
        ]
      },
      {
        name: 'Paket Weekend Relax',
        description: 'Paket santai untuk weekend yang menyenangkan. Berisi camilan enak untuk menemani waktu bersantai.',
        image: '/images/products/placeholder.jpg',
        price: 125000,
        isActive: true,
        isFeatured: false,
        storeId: stores[Math.floor(Math.random() * stores.length)].id,
        contents: [
          { item: 'Weekend Item 1', quantity: 2 },
          { item: 'Weekend Item 2', quantity: 2 },
          { item: 'Weekend Item 3', quantity: 1 },
        ]
      }
    ]

    let createdCount = 0

    for (const bundleData of additionalBundles) {
      try {
        // Create the bundle
        const bundle = await prisma.productBundle.create({
          data: {
            name: bundleData.name,
            description: bundleData.description,
            image: bundleData.image,
            price: bundleData.price,
            contents: bundleData.contents,
            isActive: bundleData.isActive,
            isFeatured: bundleData.isFeatured,
            storeId: bundleData.storeId,
          }
        })

        createdCount++
        console.log(`✅ Created bundle: ${bundle.name}`)
      } catch (error) {
        console.error(`❌ Error creating bundle "${bundleData.name}":`, error)
      }
    }

    console.log(`🎉 Successfully created ${createdCount} additional bundles!`)

    // Display final summary
    const totalBundles = await prisma.productBundle.count()
    const featuredBundles = await prisma.productBundle.count({
      where: { isFeatured: true }
    })
    const activeBundles = await prisma.productBundle.count({
      where: { isActive: true }
    })

    console.log('\n📊 Final Database Summary:')
    console.log(`   Total Bundles: ${totalBundles}`)
    console.log(`   Featured Bundles: ${featuredBundles}`)
    console.log(`   Active Bundles: ${activeBundles}`)

  } catch (error) {
    console.error('❌ Error creating additional bundles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdditionalBundles()
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
