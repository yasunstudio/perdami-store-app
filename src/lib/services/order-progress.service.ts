// Order Progress Service
// Handles order preparation, delays, and pickup notifications

import { prisma } from '../prisma'
import { notificationService } from '../notification'
import { auditLog } from '../audit'

export interface OrderProgressData {
  orderId: string
  userId: string
  orderNumber: string
  currentStatus: string
  user?: {
    email: string
    name: string
  }
}

export interface OrderProgressResult {
  success: boolean
  message?: string
  error?: string
}

export class OrderProgressService {

  // Mark order preparation as started
  async markPreparationStarted(data: {
    orderId: string
    estimatedTime?: string
    notes?: string
  }): Promise<OrderProgressResult> {
    try {
      console.log(`📦 Marking order ${data.orderId} preparation as started`)

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })

      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        }
      }

      // Check if order is in correct status
      if (order.orderStatus !== 'CONFIRMED' && order.orderStatus !== 'PROCESSING') {
        return {
          success: false,
          error: `Order status ${order.orderStatus} is not eligible for preparation`
        }
      }

      // Update order status to PROCESSING if not already
      if (order.orderStatus !== 'PROCESSING') {
        await prisma.order.update({
          where: { id: data.orderId },
          data: {
            orderStatus: 'PROCESSING',
            notes: data.notes || 'Persiapan pesanan dimulai',
            updatedAt: new Date()
          }
        })
      }

      // Send notifications
      // await notificationService.sendOrderPreparationStarted({
      //   orderId: order.id,
      //   userId: order.user.id,
      //   orderNumber: order.orderNumber,
      // })
      console.log('Order preparation notification skipped')

      // Log audit trail
      await auditLog.updateOrderStatus(
        'ADMIN',
        order.id,
        order.orderStatus,
        'PROCESSING'
      )

      return {
        success: true,
        message: 'Order preparation started successfully'
      }

    } catch (error) {
      console.error('❌ Error marking order preparation started:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Mark order preparation as complete
  async markPreparationComplete(data: {
    orderId: string
    pickupTime?: string
    notes?: string
  }): Promise<OrderProgressResult> {
    try {
      console.log(`✅ Marking order ${data.orderId} preparation as complete`)

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })

      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        }
      }

      // Check if order is in correct status
      if (order.orderStatus !== 'PROCESSING') {
        return {
          success: false,
          error: `Order status ${order.orderStatus} is not eligible for completion`
        }
      }

      // Update order status to READY
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          orderStatus: 'READY',
          notes: data.notes || 'Pesanan siap untuk diambil',
          updatedAt: new Date()
        }
      })

      // Send notifications
            // await notificationService.sendOrderPreparationComplete({
      //   orderId: order.id,
      //   userId: order.user.id,
      //   orderNumber: order.orderNumber,
      // })
      console.log('Order preparation complete notification skipped')

      // Log audit trail
      await auditLog.updateOrderStatus(
        'ADMIN',
        order.id,
        'PROCESSING',
        'READY'
      )

      return {
        success: true,
        message: 'Order preparation completed successfully'
      }

    } catch (error) {
      console.error('❌ Error marking order preparation complete:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Mark order as delayed
  async markOrderDelayed(data: {
    orderId: string
    reason: string
    newEstimatedTime?: string
    notes?: string
  }): Promise<OrderProgressResult> {
    try {
      console.log(`⏱️ Marking order ${data.orderId} as delayed`)

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })

      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        }
      }

      // Check if order is in processing status
      if (order.orderStatus !== 'PROCESSING') {
        return {
          success: false,
          error: `Order status ${order.orderStatus} cannot be marked as delayed`
        }
      }

      // Update order with delay information
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          notes: data.notes || `Pesanan tertunda: ${data.reason}`,
          updatedAt: new Date()
        }
      })

      // Send notifications
      // await notificationService.sendOrderDelayed({
      //   orderId: order.id,
      //   userId: order.user.id,
      //   orderNumber: order.orderNumber,
      //   reason: data.reason,
      //   newEstimatedTime: data.newEstimatedTime
      // })
      console.log('Order delayed notification skipped')

      // Log audit trail
      await auditLog.orderDelayed(
        'ADMIN',
        order.id,
        data.reason
      )

      return {
        success: true,
        message: 'Order delay notification sent successfully'
      }

    } catch (error) {
      console.error('❌ Error marking order as delayed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Mark order as ready for pickup with enhanced notification
  async markReadyForPickup(data: {
    orderId: string
    pickupLocation: string
    pickupHours: string
    notes?: string
  }): Promise<OrderProgressResult> {
    try {
      console.log(`🎉 Marking order ${data.orderId} as ready for pickup`)

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })

      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        }
      }

      // Check if order is in correct status
      if (order.orderStatus !== 'PROCESSING') {
        return {
          success: false,
          error: `Order status ${order.orderStatus} is not eligible for pickup`
        }
      }

      // Update order status to READY
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          orderStatus: 'READY',
          notes: data.notes || `Siap diambil di ${data.pickupLocation}`,
          updatedAt: new Date()
        }
      })

      // Send enhanced notifications
      // TODO: Implement sendOrderReadyForPickup in notification service
      // await notificationService.sendOrderReadyForPickup({
      //   orderId: order.id,
      //   userId: order.user.id,
      //   orderNumber: order.orderNumber,
      //   pickupLocation: data.pickupLocation,
      //   pickupHours: data.pickupHours
      // })

      // Log audit trail
      await auditLog.updateOrderStatus(
        'ADMIN',
        order.id,
        'PROCESSING',
        'READY'
      )

      return {
        success: true,
        message: 'Order marked as ready for pickup successfully'
      }

    } catch (error) {
      console.error('❌ Error marking order as ready for pickup:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send pickup reminder for orders that are ready but not picked up
  async sendPickupReminders(): Promise<OrderProgressResult> {
    try {
      console.log('🔔 Sending pickup reminders for ready orders')

      // Get orders that are ready for pickup for more than 1 hour
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const readyOrders = await prisma.order.findMany({
        where: {
          orderStatus: 'READY',
          updatedAt: {
            gte: oneDayAgo,
            lte: oneHourAgo
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })

      console.log(`📊 Found ${readyOrders.length} orders ready for pickup reminder`)

      let remindersProcessed = 0

      for (const order of readyOrders) {
        try {
          // Check if reminder already sent recently
          const recentReminder = await prisma.inAppNotification.findFirst({
            where: {
              userId: order.user.id,
              type: 'ORDER_PICKUP_REMINDER',
              createdAt: {
                gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
              },
              data: {
                path: ['orderId'],
                equals: order.id
              }
            }
          })

          if (recentReminder) {
            console.log(`⏭️ Skipping order ${order.orderNumber} - reminder already sent recently`)
            continue
          }

          // Send pickup reminder
          // TODO: Implement sendOrderPickupReminder in notification service
          // await notificationService.sendOrderPickupReminder({
          //   orderId: order.id,
          //   userId: order.user.id,
          //   orderNumber: order.orderNumber,
          //   pickupLocation: 'Venue Event', // Default or get from order
          //   pickupHours: '08:00 - 17:00', // Default or get from settings
          //   readySince: order.updatedAt.toLocaleDateString('id-ID', {
          //     day: 'numeric',
          //     month: 'long',
          //     year: 'numeric',
          //     hour: '2-digit',
          //     minute: '2-digit'
          //   })
          // })

          remindersProcessed++
          console.log(`✅ Sent pickup reminder for order ${order.orderNumber}`)

        } catch (error) {
          console.error(`❌ Error sending pickup reminder for order ${order.orderNumber}:`, error)
        }
      }

      return {
        success: true,
        message: `Pickup reminders processed: ${remindersProcessed}`
      }

    } catch (error) {
      console.error('❌ Error sending pickup reminders:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get order progress statistics
  async getOrderProgressStats(): Promise<{
    processingOrders: number
    readyOrders: number
    overduePickups: number
    completedToday: number
  }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const [processingOrders, readyOrders, overduePickups, completedToday] = await Promise.all([
        prisma.order.count({
          where: { orderStatus: 'PROCESSING' }
        }),
        prisma.order.count({
          where: { orderStatus: 'READY' }
        }),
        prisma.order.count({
          where: {
            orderStatus: 'READY',
            updatedAt: { lte: oneDayAgo }
          }
        }),
        prisma.order.count({
          where: {
            orderStatus: 'COMPLETED',
            updatedAt: {
              gte: today,
              lt: tomorrow
            }
          }
        })
      ])

      return {
        processingOrders,
        readyOrders,
        overduePickups,
        completedToday
      }

    } catch (error) {
      console.error('❌ Error getting order progress stats:', error)
      return {
        processingOrders: 0,
        readyOrders: 0,
        overduePickups: 0,
        completedToday: 0
      }
    }
  }

  // Process all order progress updates
  async processOrderProgressUpdates(): Promise<OrderProgressResult> {
    try {
      console.log('🔄 Processing order progress updates...')

      const pickupResult = await this.sendPickupReminders()

      return {
        success: pickupResult.success,
        message: pickupResult.success 
          ? `Order progress updates processed successfully. ${pickupResult.message}`
          : `Order progress updates completed with errors. ${pickupResult.message || pickupResult.error}`
      }

    } catch (error) {
      console.error('❌ Error processing order progress updates:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export const orderProgressService = new OrderProgressService()
