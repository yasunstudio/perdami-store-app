import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeCostData() {
  console.log('🔍 ANALYZING COST DATA FOR PROFIT CALCULATION...')
  console.log('===============================================\n')
  
  try {
    // Check bundle cost data
    const bundles = await prisma.productBundle.findMany({
      select: {
        id: true,
        name: true,
        costPrice: true,
        sellingPrice: true,
        store: {
          select: {
            name: true
          }
        },
        orderItems: {
          select: {
            quantity: true,
            totalPrice: true,
            order: {
              select: {
                orderStatus: true
              }
            }
          }
        }
      }
    })

    console.log(`📦 Found ${bundles.length} product bundles`)
    
    let bundlesWithCost = 0
    let bundlesWithoutCost = 0
    let totalRevenue = 0
    let totalCost = 0
    let totalProfit = 0

    console.log('\n📊 COST DATA ANALYSIS:')
    console.log('===============================================')

    bundles.forEach((bundle, index) => {
      const validOrderItems = bundle.orderItems.filter(
        item => item.order.orderStatus === 'CONFIRMED' || item.order.orderStatus === 'COMPLETED'
      )
      
      const totalSold = validOrderItems.reduce((sum, item) => sum + item.quantity, 0)
      const itemRevenue = validOrderItems.reduce((sum, item) => sum + item.totalPrice, 0)
      
      if (totalSold > 0) {
        if (bundle.costPrice > 0) {
          bundlesWithCost++
          const itemCost = bundle.costPrice * totalSold
          const itemProfit = itemRevenue - itemCost
          
          totalRevenue += itemRevenue
          totalCost += itemCost
          totalProfit += itemProfit
          
          console.log(`${index + 1}. ${bundle.name} (${bundle.store.name})`)
          console.log(`   Sold: ${totalSold} units`)
          console.log(`   Revenue: ${itemRevenue.toLocaleString()} IDR`)
          console.log(`   Cost: ${itemCost.toLocaleString()} IDR (@ ${bundle.costPrice.toLocaleString()}/unit)`)
          console.log(`   Profit: ${itemProfit.toLocaleString()} IDR`)
          console.log(`   Margin: ${totalRevenue > 0 ? ((itemProfit / itemRevenue) * 100).toFixed(1) : 0}%`)
          console.log('')
        } else {
          bundlesWithoutCost++
          console.log(`${index + 1}. ${bundle.name} (${bundle.store.name}) - NO COST DATA`)
          console.log(`   Sold: ${totalSold} units, Revenue: ${itemRevenue.toLocaleString()} IDR`)
          console.log('')
        }
      }
    })

    // Service fee analysis  
    const totalOrders = await prisma.order.count({
      where: {
        OR: [
          { orderStatus: 'CONFIRMED' },
          { orderStatus: 'COMPLETED' }
        ]
      }
    })
    
    const totalServiceFee = totalOrders * 25000

    console.log('💰 PROFIT SUMMARY:')
    console.log('===============================================')
    console.log(`Products with cost data: ${bundlesWithCost}`)
    console.log(`Products without cost data: ${bundlesWithoutCost}`)
    console.log(`Total Product Revenue: ${totalRevenue.toLocaleString()} IDR`)
    console.log(`Total Product Cost: ${totalCost.toLocaleString()} IDR`)
    console.log(`Total Product Profit: ${totalProfit.toLocaleString()} IDR`)
    console.log(`Overall Margin: ${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%`)
    console.log('')
    console.log(`Service Fee Revenue: ${totalServiceFee.toLocaleString()} IDR (${totalOrders} orders x 25,000)`)
    console.log(`Total Platform Profit: ${(totalProfit + totalServiceFee).toLocaleString()} IDR`)

    console.log('\n🏪 STORE BREAKDOWN:')
    console.log('===============================================')
    
    // Calculate per store
    const storeStats = new Map()
    
    bundles.forEach(bundle => {
      const storeName = bundle.store.name
      const validOrderItems = bundle.orderItems.filter(
        item => item.order.orderStatus === 'CONFIRMED' || item.order.orderStatus === 'COMPLETED'
      )
      
      const totalSold = validOrderItems.reduce((sum, item) => sum + item.quantity, 0)
      const itemRevenue = validOrderItems.reduce((sum, item) => sum + item.totalPrice, 0)
      
      if (totalSold > 0 && bundle.costPrice > 0) {
        const itemCost = bundle.costPrice * totalSold
        const itemProfit = itemRevenue - itemCost
        
        if (!storeStats.has(storeName)) {
          storeStats.set(storeName, { revenue: 0, cost: 0, profit: 0 })
        }
        
        const store = storeStats.get(storeName)
        store.revenue += itemRevenue
        store.cost += itemCost  
        store.profit += itemProfit
      }
    })
    
    storeStats.forEach((stats, storeName) => {
      const margin = stats.revenue > 0 ? ((stats.profit / stats.revenue) * 100).toFixed(1) : 0
      console.log(`${storeName}:`)
      console.log(`  Revenue: ${stats.revenue.toLocaleString()} IDR`)
      console.log(`  Cost: ${stats.cost.toLocaleString()} IDR`) 
      console.log(`  Profit: ${stats.profit.toLocaleString()} IDR (${margin}% margin)`)
      console.log('')
    })

    console.log('✅ Cost data analysis complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeCostData().catch(console.error)
