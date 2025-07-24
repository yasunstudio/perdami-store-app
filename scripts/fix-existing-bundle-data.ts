import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixExistingBundleData() {
  try {
    console.log('🔧 Fixing existing bundle data structure...')

    // Get all bundles
    const bundles = await prisma.productBundle.findMany({
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`📦 Found ${bundles.length} bundles to fix`)

    for (const bundle of bundles) {
      try {
        const contents = bundle.contents as any
        
        // Check if contents is already in good format
        if (Array.isArray(contents) && contents.length > 0) {
          const hasProperPrices = contents.some((item: any) => item.price)
          
          if (!hasProperPrices) {
            // Add realistic prices to items that don't have them
            const updatedContents = contents.map((item: any, index: number) => ({
              ...item,
              price: item.price || (bundle.price / contents.length * (1.2 + (index * 0.1))) // Distribute price evenly with variation
            }))

            await prisma.productBundle.update({
              where: { id: bundle.id },
              data: { contents: updatedContents }
            })

            console.log(`✅ Fixed ${bundle.name} - added prices to ${contents.length} items`)
          } else {
            console.log(`✓ ${bundle.name} - already has proper structure`)
          }
        } else {
          console.log(`⚠️ ${bundle.name} - has invalid contents structure`)
        }

      } catch (error) {
        console.error(`❌ Error processing ${bundle.name}:`, error)
      }
    }

    console.log('\n🎉 Bundle data structure fixed!')
    
    // Show sample of corrected data
    console.log('\n📊 Sample of corrected data:')
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
          const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0)
          console.log(`   ${index + 1}. ${item.quantity || 1}x ${item.name} @ Rp ${itemPrice.toLocaleString('id-ID')}`)
        })
        
        const totalFromItems = contents.reduce((sum, item) => {
          const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0)
          return sum + (price * (item.quantity || 1))
        }, 0)
        
        console.log(`💵 Total if bought separately: Rp ${totalFromItems.toLocaleString('id-ID')}`)
        console.log(`💸 You save: Rp ${(totalFromItems - sampleBundle.price).toLocaleString('id-ID')} (${Math.round(((totalFromItems - sampleBundle.price) / totalFromItems) * 100)}%)`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing bundle data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixExistingBundleData()
