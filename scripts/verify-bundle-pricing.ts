import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyBundlePricing() {
  try {
    const bundle = await prisma.productBundle.findFirst({
      where: {
        name: 'Paket Batagor & Siomay'
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

    if (!bundle) {
      console.log('Bundle not found')
      return
    }

    console.log('🔍 BUNDLE PRICING VERIFICATION')
    console.log('=====================================')
    console.log(`Bundle: ${bundle.name}`)
    console.log(`Bundle Price: Rp ${bundle.price.toLocaleString('id-ID')}`)
    console.log('')

    const contents = bundle.contents as any[]
    let totalOriginalPrice = 0

    console.log('📋 Items in bundle:')
    contents.forEach((item, index) => {
      const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0)
      const itemQuantity = parseInt(item.quantity || '1') || 1
      const itemTotal = itemPrice * itemQuantity
      
      totalOriginalPrice += itemTotal
      
      console.log(`${index + 1}. ${itemQuantity}x ${item.name}`)
      console.log(`   Price per item: Rp ${itemPrice.toLocaleString('id-ID')}`)
      console.log(`   Subtotal: Rp ${itemTotal.toLocaleString('id-ID')}`)
      console.log('')
    })

    const savings = totalOriginalPrice - bundle.price
    const discountPercentage = Math.round((savings / totalOriginalPrice) * 100)

    console.log('💰 PRICING SUMMARY:')
    console.log(`Original Price: Rp ${totalOriginalPrice.toLocaleString('id-ID')}`)
    console.log(`Bundle Price: Rp ${bundle.price.toLocaleString('id-ID')}`)
    console.log(`You Save: Rp ${savings.toLocaleString('id-ID')}`)
    console.log(`Discount: ${discountPercentage}%`)
    
  } catch (error) {
    console.error('Error verifying bundle pricing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyBundlePricing()
