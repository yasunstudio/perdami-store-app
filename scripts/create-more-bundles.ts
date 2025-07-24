import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createMoreBundles() {
  console.log('🌱 Creating more product bundles...')

  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true }
    })

    if (stores.length === 0) {
      console.log('❌ No active stores found. Please run the main seed script first.')
      return
    }

    // More bundles with simplified contents structure
    const moreBundles = [
      {
        name: 'Paket Anniversary Special',
        description: 'Paket istimewa untuk merayakan anniversary atau moment berharga. Kemasan mewah dengan produk pilihan terbaik.',
        image: '/images/products/placeholder.jpg',
        price: 385000,
        isActive: true,
        isFeatured: true,
        storeId: stores[0].id,
        contents: [
          { item: 'Anniversary Cake', quantity: 1 },
          { item: 'Premium Chocolate', quantity: 2 },
          { item: 'Champagne Cookies', quantity: 1 },
          { item: 'Special Gift Box', quantity: 1 }
        ]
      },
      {
        name: 'Paket Student Budget',
        description: 'Paket hemat untuk mahasiswa atau pelajar. Harga terjangkau tapi tetap berkualitas tinggi.',
        image: '/images/products/placeholder.jpg',
        price: 55000,
        isActive: true,
        isFeatured: false,
        storeId: stores[Math.floor(Math.random() * stores.length)].id,
        contents: [
          { item: 'Indomie Goreng', quantity: 5 },
          { item: 'Kerupuk', quantity: 1 },
          { item: 'Sambal Sachhet', quantity: 3 }
        ]
      },
      {
        name: 'Paket Corporate Meeting',
        description: 'Paket khusus untuk meeting atau acara kantor. Kemasan praktis dan mudah dibagikan.',
        image: '/images/products/placeholder.jpg',
        price: 295000,
        isActive: true,
        isFeatured: true,
        storeId: stores[Math.floor(Math.random() * stores.length)].id,
        contents: [
          { item: 'Mini Sandwiches', quantity: 10 },
          { item: 'Coffee Sachets', quantity: 15 },
          { item: 'Tea Bags', quantity: 10 },
          { item: 'Sugar Packets', quantity: 20 }
        ]
      },
      {
        name: 'Paket Picnic Family',
        description: 'Paket lengkap untuk piknik keluarga. Berisi berbagai makanan yang mudah dibawa dan disantap.',
        image: '/images/products/placeholder.jpg',
        price: 165000,
        isActive: true,
        isFeatured: false,
        storeId: stores[Math.floor(Math.random() * stores.length)].id,
        contents: [
          { item: 'Sandwich Wraps', quantity: 4 },
          { item: 'Fresh Fruits', quantity: 1 },
          { item: 'Juice Boxes', quantity: 4 },
          { item: 'Cookies Pack', quantity: 2 }
        ]
      },
      {
        name: 'Paket Luxury Gift',
        description: 'Paket hadiah mewah dengan produk premium. Cocok untuk hadiah special occasion.',
        image: '/images/products/placeholder.jpg',
        price: 525000,
        isActive: true,
        isFeatured: true,
        storeId: stores[Math.floor(Math.random() * stores.length)].id,
        contents: [
          { item: 'Premium Wine', quantity: 1 },
          { item: 'Imported Cheese', quantity: 2 },
          { item: 'Artisan Crackers', quantity: 1 },
          { item: 'Luxury Chocolate Box', quantity: 1 },
          { item: 'Gift Wrapping', quantity: 1 }
        ]
      }
    ]

    let createdCount = 0

    for (const bundleData of moreBundles) {
      try {
        // Check if bundle with same name already exists
        const existingBundle = await prisma.productBundle.findFirst({
          where: { name: bundleData.name }
        })

        if (existingBundle) {
          console.log(`⏭️  Bundle "${bundleData.name}" already exists, skipping...`)
          continue
        }

        // Create the bundle with simplified contents
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
        console.log(`✅ Created bundle: ${bundle.name} with ${bundleData.contents.length} items`)
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

    console.log('\n📊 Database Summary:')
    console.log(`   Total Bundles: ${totalBundles}`)
    console.log(`   Featured Bundles: ${featuredBundles}`)
    console.log(`   Active Bundles: ${activeBundles}`)

  } catch (error) {
    console.error('❌ Error in creating more bundles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Execute if this file is run directly
if (require.main === module) {
  createMoreBundles()
    .catch(console.error)
}

export default createMoreBundles
