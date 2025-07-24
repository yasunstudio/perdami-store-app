import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBundleData() {
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

    console.log('📊 BUNDLE DATA FROM DATABASE:')
    console.log('=====================================')

    bundles.forEach((bundle, index) => {
      console.log(`\n${index + 1}. ${bundle.name}`)
      console.log(`   ID: ${bundle.id}`)
      console.log(`   Price: Rp ${bundle.price.toLocaleString('id-ID')}`)
      console.log(`   Store: ${bundle.store.name}`)
      console.log(`   Description: ${bundle.description?.substring(0, 50)}...`)
      
      try {
        const contents = bundle.contents as any
        if (contents && typeof contents === 'object') {
          console.log(`   Contents Type: ${typeof contents}`)
          console.log(`   Contents Structure:`, JSON.stringify(contents, null, 2))
          
          // Check if it has items array
          if (contents.items && Array.isArray(contents.items)) {
            console.log(`   Items Count: ${contents.items.length}`)
            console.log(`   Sample Items:`)
            contents.items.slice(0, 3).forEach((item: any, i: number) => {
              console.log(`     - ${item.quantity}x ${item.name} @ Rp ${parseFloat(item.price || '0').toLocaleString('id-ID')}`)
            })
            
            // Calculate total from items
            const totalFromItems = contents.items.reduce((sum: number, item: any) => {
              return sum + (parseFloat(item.price || '0') * parseInt(item.quantity || '1'))
            }, 0)
            console.log(`   Calculated Total from Items: Rp ${totalFromItems.toLocaleString('id-ID')}`)
            console.log(`   Bundle Price: Rp ${bundle.price.toLocaleString('id-ID')}`)
            console.log(`   Savings: Rp ${(totalFromItems - bundle.price).toLocaleString('id-ID')} (${Math.round(((totalFromItems - bundle.price) / totalFromItems) * 100)}%)`)
          }
        } else {
          console.log(`   Contents: ${contents}`)
        }
      } catch (error) {
        console.log(`   Contents parsing error:`, error)
      }
      
      console.log(`   ---`)
    })

  } catch (error) {
    console.error('❌ Error checking bundle data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBundleData()
