const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Create a test store
    const store = await prisma.store.create({
      data: {
        name: 'Test Store',
        description: 'Store untuk testing toggle functionality',
        address: 'Jl. Test No. 123',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        isActive: true
      }
    })
    
    console.log('✅ Store created:', store)

    // Create some test bundles for the store
    const bundle = await prisma.productBundle.create({
      data: {
        name: 'Test Bundle',
        description: 'Bundle untuk testing',
        price: 50000,
        contents: JSON.stringify([
          { name: 'Item 1', quantity: 2 },
          { name: 'Item 2', quantity: 1 }
        ]),
        storeId: store.id,
        isActive: true,
        showToCustomer: true
      }
    })
    
    console.log('✅ Bundle created:', bundle)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
