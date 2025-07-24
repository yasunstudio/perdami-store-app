import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestBundles() {
  try {
    // Get first store
    const store = await prisma.store.findFirst()
    if (!store) {
      console.log('No store found. Please create a store first.')
      return
    }

    console.log(`Using store: ${store.name} (${store.id})`)

    // Create test bundles with different content structures
    const bundles = [
      {
        name: 'Bundle Elektronik Gaming',
        description: 'Paket lengkap untuk gaming setup dengan harga terjangkau',
        price: 2500000,
        contents: {
          items: [
            { name: 'Gaming Mouse', quantity: 1, price: '350000' },
            { name: 'Mechanical Keyboard', quantity: 1, price: '750000' },
            { name: 'Gaming Headset', quantity: 1, price: '450000' },
            { name: 'Mouse Pad Gaming', quantity: 1, price: '150000' }
          ]
        },
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: store.id
      },
      {
        name: 'Bundle Skincare Daily',
        description: 'Perawatan kulit harian untuk wajah bersih dan sehat',
        price: 450000,
        contents: {
          items: [
            { name: 'Facial Wash', quantity: 1, price: '85000' },
            { name: 'Toner', quantity: 1, price: '120000' },
            { name: 'Moisturizer', quantity: 1, price: '150000' },
            { name: 'Sunscreen SPF 30', quantity: 1, price: '95000' },
            { name: 'Serum Vitamin C', quantity: 1, price: '180000' }
          ]
        },
        isActive: true,
        isFeatured: false,
        showToCustomer: true,
        storeId: store.id
      },
      {
        name: 'Bundle Fashion Casual',
        description: 'Outfit casual untuk kegiatan sehari-hari yang nyaman',
        price: 750000,
        contents: {
          items: [
            { name: 'Kaos Cotton Premium', quantity: 2, price: '125000' },
            { name: 'Celana Chino', quantity: 1, price: '275000' },
            { name: 'Jaket Hoodie', quantity: 1, price: '225000' },
            { name: 'Sneakers Canvas', quantity: 1, price: '350000' }
          ]
        },
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: store.id
      },
      {
        name: 'Bundle Office Essentials',
        description: 'Perlengkapan kantor lengkap untuk produktivitas maksimal',
        price: 650000,
        contents: {
          items: [
            { name: 'Notebook A5', quantity: 3, price: '45000' },
            { name: 'Pen Set Premium', quantity: 1, price: '125000' },
            { name: 'Desk Organizer', quantity: 1, price: '85000' },
            { name: 'Table Lamp LED', quantity: 1, price: '175000' },
            { name: 'Document Folder', quantity: 5, price: '25000' }
          ]
        },
        isActive: true,
        isFeatured: false,
        showToCustomer: true,
        storeId: store.id
      }
    ]

    // Create bundles
    for (const bundleData of bundles) {
      const bundle = await prisma.productBundle.create({
        data: bundleData,
        include: {
          store: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      console.log(`✅ Created bundle: ${bundle.name}`)
      console.log(`   Price: Rp ${bundle.price.toLocaleString('id-ID')}`)
      console.log(`   Items: ${(bundle.contents as any).items.length}`)
      console.log(`   Store: ${bundle.store.name}`)
      console.log(`   ---`)
    }

    console.log('\n🎉 All test bundles created successfully!')
    
  } catch (error) {
    console.error('❌ Error creating test bundles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestBundles()
