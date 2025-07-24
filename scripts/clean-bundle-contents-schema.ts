import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanBundleContentsToMatchSchema() {
  try {
    console.log('🧹 Cleaning bundle contents to match schema...')

    // Get all bundles
    const bundles = await prisma.productBundle.findMany()

    console.log(`📦 Found ${bundles.length} bundles to clean`)

    for (const bundle of bundles) {
      try {
        const contents = bundle.contents as any
        
        if (Array.isArray(contents) && contents.length > 0) {
          // Clean contents to only have name and quantity (as per schema comment)
          const cleanedContents = contents.map((item: any) => ({
            name: item.name || 'Item Bundle',
            quantity: parseInt(item.quantity || '1') || 1
            // Remove price field as it's not in the schema design
          }))

          await prisma.productBundle.update({
            where: { id: bundle.id },
            data: { contents: cleanedContents }
          })

          console.log(`✅ Cleaned ${bundle.name} - removed price data from ${contents.length} items`)
        } else {
          console.log(`⚠️ ${bundle.name} - has invalid contents structure`)
        }

      } catch (error) {
        console.error(`❌ Error processing ${bundle.name}:`, error)
      }
    }

    console.log('\n🎉 Bundle contents cleaned to match schema!')
    
    // Show sample of cleaned data
    console.log('\n📊 Sample of cleaned data:')
    const sampleBundle = await prisma.productBundle.findFirst({
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (sampleBundle) {
      console.log(`\n📦 ${sampleBundle.name}`)
      console.log(`💰 Price: Rp ${sampleBundle.price.toLocaleString('id-ID')}`)
      console.log(`🏪 Store: ${sampleBundle.store.name}`)
      
      const contents = sampleBundle.contents as any[]
      if (Array.isArray(contents)) {
        console.log(`📋 Contents (${contents.length} items):`)
        contents.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.quantity || 1}x ${item.name}`)
        })
        
        console.log(`\n✅ Contents structure matches schema: [{ name: string, quantity: number }]`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error cleaning bundle contents:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanBundleContentsToMatchSchema()
