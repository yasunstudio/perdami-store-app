import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateBundleImages() {
  try {
    const bundles = await prisma.productBundle.findMany({
      where: {
        showToCustomer: true
      }
    })

    // Sample images - using local placeholder only for consistency
    const sampleImages = [
      '/images/products/placeholder.jpg',
      '/images/products/placeholder.jpg',
      '/images/products/placeholder.jpg',
      '/images/products/placeholder.jpg'
    ]

    for (let i = 0; i < bundles.length; i++) {
      const bundle = bundles[i]
      const imageUrl = sampleImages[i % sampleImages.length]
      
      await prisma.productBundle.update({
        where: { id: bundle.id },
        data: { image: imageUrl }
      })

      console.log(`✅ Updated ${bundle.name} with image`)
    }

    console.log('\n🎉 All bundle images updated!')
    
  } catch (error) {
    console.error('❌ Error updating bundle images:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateBundleImages()
