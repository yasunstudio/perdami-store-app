import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupAndFixBundleData() {
  try {
    // Delete all existing bundles first
    await prisma.productBundle.deleteMany()
    console.log('🗑️ Deleted all existing bundles')

    // Get first store
    const store = await prisma.store.findFirst()
    if (!store) {
      console.log('❌ No store found. Please create a store first.')
      return
    }

    console.log(`📍 Using store: ${store.name} (${store.id})`)

    // Create consistent bundle data with proper pricing
    const consistentBundles = [
      {
        name: 'Bundle Gaming Setup',
        description: 'Paket lengkap untuk gaming dengan harga hemat',
        price: 2500000,
        contents: [
          { name: 'Gaming Mouse Logitech', quantity: 1, price: 450000 },
          { name: 'Mechanical Keyboard', quantity: 1, price: 850000 },
          { name: 'Gaming Headset', quantity: 1, price: 650000 },
          { name: 'Mouse Pad Gaming XL', quantity: 1, price: 150000 },
          { name: 'Webcam HD', quantity: 1, price: 400000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: store.id,
        image: '/images/products/placeholder.jpg'
      },
      {
        name: 'Bundle Skincare Complete',
        description: 'Rangkaian perawatan kulit harian yang lengkap',
        price: 425000,
        contents: [
          { name: 'Facial Cleanser', quantity: 1, price: 95000 },
          { name: 'Toner Brightening', quantity: 1, price: 135000 },
          { name: 'Serum Vitamin C', quantity: 1, price: 185000 },
          { name: 'Moisturizer Day Cream', quantity: 1, price: 165000 },
          { name: 'Sunscreen SPF 50', quantity: 1, price: 125000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: store.id,
        image: '/images/products/placeholder.jpg'
      },
      {
        name: 'Bundle Fashion Casual',
        description: 'Outfit santai untuk sehari-hari dengan style trendy',
        price: 650000,
        contents: [
          { name: 'Kaos Premium Cotton', quantity: 2, price: 150000 },
          { name: 'Celana Chino Slim Fit', quantity: 1, price: 285000 },
          { name: 'Jaket Bomber', quantity: 1, price: 325000 },
          { name: 'Sneakers Classic', quantity: 1, price: 450000 }
        ],
        isActive: true,
        isFeatured: false,
        showToCustomer: true,
        storeId: store.id,
        image: '/images/products/placeholder.jpg'
      },
      {
        name: 'Bundle Office Essentials',
        description: 'Perlengkapan kantor untuk produktivitas maksimal',
        price: 320000,
        contents: [
          { name: 'Notebook Premium A5', quantity: 3, price: 55000 },
          { name: 'Pen Set Executive', quantity: 1, price: 95000 },
          { name: 'Desk Organizer Kayu', quantity: 1, price: 125000 },
          { name: 'Lampu Meja LED', quantity: 1, price: 175000 },
          { name: 'Folder Dokumen Set', quantity: 5, price: 35000 }
        ],
        isActive: true,
        isFeatured: false,
        showToCustomer: true,
        storeId: store.id,
        image: '/images/products/placeholder.jpg'
      },
      {
        name: 'Bundle Fitness Starter',
        description: 'Paket awal untuk memulai hidup sehat dan aktif',
        price: 480000,
        contents: [
          { name: 'Resistance Band Set', quantity: 1, price: 125000 },
          { name: 'Yoga Mat Premium', quantity: 1, price: 185000 },
          { name: 'Water Bottle Stainless', quantity: 1, price: 95000 },
          { name: 'Gym Towel Microfiber', quantity: 2, price: 45000 },
          { name: 'Protein Shaker', quantity: 1, price: 85000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: store.id,
        image: '/images/products/placeholder.jpg'
      }
    ]

    // Create bundles with consistent data
    for (const bundleData of consistentBundles) {
      // Calculate total price from items to show proper discount
      const totalItemPrice = bundleData.contents.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      )
      const savings = totalItemPrice - bundleData.price
      const discountPercentage = Math.round((savings / totalItemPrice) * 100)

      const bundle = await prisma.productBundle.create({
        data: {
          ...bundleData,
          contents: bundleData.contents // This will be stored as JSON
        },
        include: {
          store: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      console.log(`✅ Created: ${bundle.name}`)
      console.log(`   💰 Bundle Price: Rp ${bundle.price.toLocaleString('id-ID')}`)
      console.log(`   🛒 Original Price: Rp ${totalItemPrice.toLocaleString('id-ID')}`)
      console.log(`   💸 You Save: Rp ${savings.toLocaleString('id-ID')} (${discountPercentage}%)`)
      console.log(`   📦 Items: ${bundleData.contents.length}`)
      console.log(`   🏪 Store: ${bundle.store.name}`)
      console.log(`   ---`)
    }

    console.log('\n🎉 All consistent bundle data created successfully!')
    
  } catch (error) {
    console.error('❌ Error creating bundle data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupAndFixBundleData()
