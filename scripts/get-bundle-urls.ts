import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getBundleIds() {
  try {
    const bundles = await prisma.productBundle.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        isFeatured: true
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('🔗 Sample Bundle URLs for testing:')
    bundles.forEach((bundle, index) => {
      const featuredText = bundle.isFeatured ? ' ⭐' : ''
      console.log(`${index + 1}. ${bundle.name}${featuredText}`)
      console.log(`   http://localhost:3000/bundles/${bundle.id}\n`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getBundleIds()
