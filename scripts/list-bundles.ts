import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listBundles() {
  try {
    const bundles = await prisma.productBundle.findMany({
      where: {
        showToCustomer: true,
        isActive: true
      },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 5
    })

    console.log('📦 Available Bundles:')
    console.log('=====================================')

    bundles.forEach((bundle, index) => {
      console.log(`${index + 1}. ${bundle.name}`)
      console.log(`   ID: ${bundle.id}`)
      console.log(`   Price: Rp ${bundle.price.toLocaleString('id-ID')}`)
      console.log(`   Store: ${bundle.store.name}`)
      console.log(`   URL: http://localhost:3000/bundles/${bundle.id}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error listing bundles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listBundles()
