const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateOrdersForTesting() {
  try {
    console.log('🔄 Updating some orders to PICKED_UP status for testing...\n')

    // Get some completed orders
    const ordersToUpdate = await prisma.order.findMany({
      where: {
        orderStatus: 'COMPLETED',
        pickupStatus: 'NOT_PICKED_UP'
      },
      take: 10,
      orderBy: {
        pickupDate: 'desc'
      }
    })

    console.log(`Found ${ordersToUpdate.length} orders to update`)

    // Update them to PICKED_UP
    for (const order of ordersToUpdate) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          pickupStatus: 'PICKED_UP',
          // Ensure pickup date is set
          pickupDate: order.pickupDate || new Date()
        }
      })
      console.log(`✅ Updated order ${order.id} to PICKED_UP`)
    }

    // Check updated count
    const pickedUpCount = await prisma.order.count({
      where: {
        pickupStatus: 'PICKED_UP'
      }
    })

    console.log(`\n📊 Total orders now with PICKED_UP status: ${pickedUpCount}`)

  } catch (error) {
    console.error('❌ Error updating orders:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateOrdersForTesting()
