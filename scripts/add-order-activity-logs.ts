import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addOrderActivityLogs() {
  console.log('📝 Adding order activity logs...')

  try {
    // Get some existing orders
    const orders = await prisma.order.findMany({
      take: 5,
      include: {
        user: true,
        payment: true
      }
    })

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN' 
      }
    })

    if (!adminUser) {
      console.log('No admin user found, creating one...')
      return
    }

    for (const order of orders) {
      // Add ORDER_CREATED log
      await prisma.userActivityLog.create({
        data: {
          userId: order.user.id,
          action: 'ORDER_CREATED',
          resource: 'ORDER',
          resourceId: order.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            message: `Order ${order.orderNumber} dibuat`
          }),
        }
      })

      // Add ORDER_STATUS_UPDATE log (if not PENDING)
      if (order.orderStatus !== 'PENDING') {
        await prisma.userActivityLog.create({
          data: {
            userId: adminUser.id,
            action: 'UPDATE_ORDER_STATUS',
            resource: 'ORDER',
            resourceId: order.id,
            details: JSON.stringify({
              previousStatus: 'PENDING',
              newStatus: order.orderStatus,
              adminNotes: `Status order diperbarui oleh admin`,
              message: `Status order diubah dari PENDING ke ${order.orderStatus}`
            }),
          }
        })
      }

      // Add PAYMENT_STATUS_UPDATE log (if payment exists and not PENDING)
      if (order.payment && order.payment.status !== 'PENDING') {
        await prisma.userActivityLog.create({
          data: {
            userId: adminUser.id,
            action: 'UPDATE_PAYMENT_STATUS',
            resource: 'PAYMENT',
            resourceId: order.payment.id,
            details: JSON.stringify({
              previousStatus: 'PENDING',
              newStatus: order.payment.status,
              adminNotes: `Status pembayaran diperbarui oleh admin`,
              message: `Status pembayaran diubah dari PENDING ke ${order.payment.status}`
            }),
          }
        })
      }

      console.log(`✅ Added activity logs for order ${order.orderNumber}`)
    }

    console.log('✅ Order activity logs added successfully!')

  } catch (error) {
    console.error('Error adding order activity logs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
addOrderActivityLogs()
  .then(() => {
    console.log('Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
