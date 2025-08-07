// Pickup Notification Scheduler
import { prisma } from './prisma'
import { notificationService } from './notification'

export class PickupScheduler {
  /**
   * Send H-1 pickup reminders
   * Should be run daily at a specific time (e.g., 18:00)
   */
  async sendH1PickupReminders(): Promise<void> {
    try {
      console.log('🔔 Starting H-1 pickup reminders...')
      
      // Get orders with pickup date = tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const endOfTomorrow = new Date(tomorrow)
      endOfTomorrow.setHours(23, 59, 59, 999)

      const ordersForTomorrow = await prisma.order.findMany({
        where: {
          pickupDate: {
            gte: tomorrow,
            lte: endOfTomorrow
          },
          orderStatus: {
            in: ['CONFIRMED', 'PROCESSING', 'READY']
          },
          pickupStatus: 'NOT_PICKED_UP'
        },
        include: {
          user: true
        }
      })

      console.log(`📋 Found ${ordersForTomorrow.length} orders for tomorrow pickup`)

      // Send H-1 reminders
      for (const order of ordersForTomorrow) {
        try {
          await notificationService.notifyPickupReminderH1(order.id)
          console.log(`✅ H-1 reminder sent for order ${order.orderNumber}`)
        } catch (error) {
          console.error(`❌ Failed to send H-1 reminder for order ${order.orderNumber}:`, error)
        }
      }

      console.log(`🎉 H-1 pickup reminders completed: ${ordersForTomorrow.length} notifications sent`)
    } catch (error) {
      console.error('❌ Error in sendH1PickupReminders:', error)
    }
  }

  /**
   * Send same-day pickup reminders
   * Should be run daily in the morning (e.g., 08:00)
   */
  async sendTodayPickupReminders(): Promise<void> {
    try {
      console.log('🔔 Starting today pickup reminders...')
      
      // Get orders with pickup date = today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const endOfToday = new Date(today)
      endOfToday.setHours(23, 59, 59, 999)

      const ordersForToday = await prisma.order.findMany({
        where: {
          pickupDate: {
            gte: today,
            lte: endOfToday
          },
          orderStatus: {
            in: ['CONFIRMED', 'PROCESSING', 'READY']
          },
          pickupStatus: 'NOT_PICKED_UP'
        },
        include: {
          user: true
        }
      })

      console.log(`📋 Found ${ordersForToday.length} orders for today pickup`)

      // Send today reminders
      for (const order of ordersForToday) {
        try {
          await notificationService.notifyPickupReminderToday(order.id)
          console.log(`✅ Today reminder sent for order ${order.orderNumber}`)
        } catch (error) {
          console.error(`❌ Failed to send today reminder for order ${order.orderNumber}:`, error)
        }
      }

      console.log(`🎉 Today pickup reminders completed: ${ordersForToday.length} notifications sent`)
    } catch (error) {
      console.error('❌ Error in sendTodayPickupReminders:', error)
    }
  }

  /**
   * Send pickup ready notifications when order status changes to READY
   */
  async sendPickupReadyNotification(orderId: string): Promise<void> {
    try {
      console.log(`🔔 Sending pickup ready notification for order: ${orderId}`)
      await notificationService.notifyPickupReady(orderId)
      console.log(`✅ Pickup ready notification sent for order: ${orderId}`)
    } catch (error) {
      console.error(`❌ Failed to send pickup ready notification for order ${orderId}:`, error)
    }
  }

  /**
   * Send pickup completed notification when pickup status changes to PICKED_UP
   */
  async sendPickupCompletedNotification(orderId: string): Promise<void> {
    try {
      console.log(`🔔 Sending pickup completed notification for order: ${orderId}`)
      await notificationService.notifyPickupCompleted(orderId)
      console.log(`✅ Pickup completed notification sent for order: ${orderId}`)
    } catch (error) {
      console.error(`❌ Failed to send pickup completed notification for order ${orderId}:`, error)
    }
  }

  /**
   * Manual trigger for testing - send reminders for specific date
   */
  async sendPickupRemindersForDate(targetDate: Date): Promise<void> {
    try {
      console.log(`🔔 Sending pickup reminders for date: ${targetDate.toISOString()}`)
      
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      const orders = await prisma.order.findMany({
        where: {
          pickupDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          orderStatus: {
            in: ['CONFIRMED', 'PROCESSING', 'READY']
          },
          pickupStatus: 'NOT_PICKED_UP'
        },
        include: {
          user: true
        }
      })

      console.log(`📋 Found ${orders.length} orders for date ${targetDate.toDateString()}`)

      for (const order of orders) {
        try {
          await notificationService.notifyPickupReminderToday(order.id)
          console.log(`✅ Reminder sent for order ${order.orderNumber}`)
        } catch (error) {
          console.error(`❌ Failed to send reminder for order ${order.orderNumber}:`, error)
        }
      }

      console.log(`🎉 Manual pickup reminders completed: ${orders.length} notifications sent`)
    } catch (error) {
      console.error('❌ Error in sendPickupRemindersForDate:', error)
    }
  }
}

// Export singleton instance
export const pickupScheduler = new PickupScheduler()
