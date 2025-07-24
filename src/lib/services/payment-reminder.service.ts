// Payment Reminder Service
// Handles payment reminders, deadline warnings, and automatic cancellations

import { prisma } from '../prisma'
import { notificationService } from '../notification'
import { auditLog } from '../audit'
import { getPaymentDeadline, isPaymentOverdue, getPaymentTimeRemaining } from '../utils/payment.utils'

export interface PaymentReminderData {
  orderId: string
  userId: string
  orderNumber: string
  totalAmount: number
  createdAt: Date
  user?: {
    email: string
    name: string
  }
}

export interface PaymentReminderResult {
  success: boolean
  message?: string
  error?: string
  remindersProcessed?: number
  warningsProcessed?: number
  cancellationsProcessed?: number
}

export class PaymentReminderService {
  
  // Send payment reminder (1 hour before deadline)
  async sendPaymentReminders(): Promise<PaymentReminderResult> {
    try {
      console.log('🔔 Processing payment reminders...')
      
      // Get orders that need payment reminders (23 hours after creation)
      const now = new Date()
      const reminderTime = new Date(now.getTime() - 23 * 60 * 60 * 1000) // 23 hours ago
      const reminderTimeEnd = new Date(now.getTime() - 22.5 * 60 * 60 * 1000) // 22.5 hours ago
      
      const ordersNeedingReminders = await prisma.order.findMany({
        where: {
          orderStatus: 'PENDING',
          createdAt: {
            gte: reminderTime,
            lte: reminderTimeEnd
          },
          payment: {
            status: 'PENDING'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          payment: true
        }
      })

      console.log(`📊 Found ${ordersNeedingReminders.length} orders needing reminders`)

      let remindersProcessed = 0
      
      for (const order of ordersNeedingReminders) {
        try {
          const timeRemaining = getPaymentTimeRemaining(order)
          
          // Check if reminder already sent
          const existingReminder = await prisma.inAppNotification.findFirst({
            where: {
              userId: order.user.id,
              type: 'PAYMENT_REMINDER',
              data: {
                path: ['orderId'],
                equals: order.id
              }
            }
          })

          if (existingReminder) {
            console.log(`⏭️  Reminder already sent for order ${order.orderNumber}`)
            continue
          }

          // TODO: Implement sendPaymentReminder in notification service
          // await notificationService.sendPaymentReminder({
          //   userId: order.user.id,
          //   order: {
          //     id: order.id,
          //     orderNumber: order.orderNumber,
          //     totalAmount: order.totalAmount,
          //     user: order.user
          //   },
          //   timeRemaining
          // })

          remindersProcessed++
          console.log(`✅ Sent payment reminder for order ${order.orderNumber}`)
          
        } catch (error) {
          console.error(`❌ Error sending reminder for order ${order.orderNumber}:`, error)
        }
      }

      return {
        success: true,
        message: `Payment reminders processed: ${remindersProcessed}`,
        remindersProcessed
      }
      
    } catch (error) {
      console.error('❌ Error processing payment reminders:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Send payment deadline warnings (30 minutes before deadline)
  async sendPaymentDeadlineWarnings(): Promise<PaymentReminderResult> {
    try {
      console.log('⚠️  Processing payment deadline warnings...')
      
      // Get orders that need deadline warnings (23.5 hours after creation)
      const now = new Date()
      const warningTime = new Date(now.getTime() - 23.5 * 60 * 60 * 1000) // 23.5 hours ago
      const warningTimeEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000) // 23 hours ago
      
      const ordersNeedingWarnings = await prisma.order.findMany({
        where: {
          orderStatus: 'PENDING',
          createdAt: {
            gte: warningTime,
            lte: warningTimeEnd
          },
          payment: {
            status: 'PENDING'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          payment: true
        }
      })

      console.log(`📊 Found ${ordersNeedingWarnings.length} orders needing deadline warnings`)

      let warningsProcessed = 0
      
      for (const order of ordersNeedingWarnings) {
        try {
          const timeRemaining = getPaymentTimeRemaining(order)
          
          // Check if warning already sent
          const existingWarning = await prisma.inAppNotification.findFirst({
            where: {
              userId: order.user.id,
              type: 'PAYMENT_DEADLINE_WARNING',
              data: {
                path: ['orderId'],
                equals: order.id
              }
            }
          })

          if (existingWarning) {
            console.log(`⏭️  Warning already sent for order ${order.orderNumber}`)
            continue
          }

          // TODO: Implement sendPaymentDeadlineWarning in notification service
          // await notificationService.sendPaymentDeadlineWarning({
          //   userId: order.user.id,
          //   order: {
          //     id: order.id,
          //     orderNumber: order.orderNumber,
          //     totalAmount: order.totalAmount,
          //     user: order.user
          //   },
          //   timeRemaining
          // })

          warningsProcessed++
          console.log(`✅ Sent deadline warning for order ${order.orderNumber}`)
          
        } catch (error) {
          console.error(`❌ Error sending warning for order ${order.orderNumber}:`, error)
        }
      }

      return {
        success: true,
        message: `Payment deadline warnings processed: ${warningsProcessed}`,
        warningsProcessed
      }
      
    } catch (error) {
      console.error('❌ Error processing payment deadline warnings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Process expired payments and auto-cancel orders
  async processExpiredPayments(): Promise<PaymentReminderResult> {
    try {
      console.log('🚫 Processing expired payments...')
      
      // Get orders with expired payments (24+ hours after creation)
      const now = new Date()
      const expiredTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
      
      const expiredOrders = await prisma.order.findMany({
        where: {
          orderStatus: 'PENDING',
          createdAt: {
            lte: expiredTime
          },
          payment: {
            status: 'PENDING'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          payment: true,
          orderItems: {
            include: {
              bundle: {
                include: {
                  store: true
                }
              }
            }
          }
        }
      })

      console.log(`📊 Found ${expiredOrders.length} orders with expired payments`)

      let cancellationsProcessed = 0
      
      for (const order of expiredOrders) {
        try {
          // Process the cancellation
          const result = await prisma.$transaction(async (tx) => {
            // Update payment status
            await tx.payment.update({
              where: { id: order.payment!.id },
              data: {
                status: 'FAILED',
                notes: 'Payment expired - auto-cancelled',
                updatedAt: new Date()
              }
            })

            // Update order status
            const updatedOrder = await tx.order.update({
              where: { id: order.id },
              data: {
                orderStatus: 'CANCELLED',
                notes: 'Auto-cancelled due to payment timeout',
                updatedAt: new Date()
              },
              include: {
                user: true,
                payment: true,
                orderItems: {
                  include: {
                    bundle: {
                      include: {
                        store: true
                      }
                    }
                  }
                }
              }
            })

            // Skip stock restoration for bundles (bundles don't use stock)
            // Bundles are assembled on-demand, so no stock management needed

            return updatedOrder
          })

          // Send notifications
          // TODO: Implement notification methods in notification service
          // await Promise.all([
          //   // Notify customer
          //   notificationService.sendPaymentExpiredNotification({
          //     userId: order.user.id,
          //     order: {
          //       id: order.id,
          //       orderNumber: order.orderNumber,
          //       totalAmount: order.totalAmount,
          //       user: order.user
          //     }
          //   }),
          //   // Notify admin
          //   notificationService.sendAutoCancelNotification({
          //     order: {
          //       id: order.id,
          //       orderNumber: order.orderNumber,
          //       totalAmount: order.totalAmount,
          //       user: order.user
          //     },
          //     reason: 'payment timeout'
          //   })
          // ])

          // Log audit trail
          await auditLog.updatePaymentStatus(
            'SYSTEM',
            order.id,
            'PENDING',
            'FAILED'
          )

          cancellationsProcessed++
          console.log(`✅ Auto-cancelled order ${order.orderNumber} due to payment timeout`)
          
        } catch (error) {
          console.error(`❌ Error cancelling order ${order.orderNumber}:`, error)
        }
      }

      return {
        success: true,
        message: `Expired payments processed: ${cancellationsProcessed}`,
        cancellationsProcessed
      }
      
    } catch (error) {
      console.error('❌ Error processing expired payments:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Process all payment reminders and cancellations
  async processAllPaymentReminders(): Promise<PaymentReminderResult> {
    try {
      console.log('🔄 Processing all payment reminders...')
      
      const [reminderResult, warningResult, cancellationResult] = await Promise.all([
        this.sendPaymentReminders(),
        this.sendPaymentDeadlineWarnings(),
        this.processExpiredPayments()
      ])

      return {
        success: true,
        message: 'All payment reminders processed',
        remindersProcessed: reminderResult.remindersProcessed || 0,
        warningsProcessed: warningResult.warningsProcessed || 0,
        cancellationsProcessed: cancellationResult.cancellationsProcessed || 0
      }
      
    } catch (error) {
      console.error('❌ Error processing all payment reminders:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get payment reminder statistics
  async getPaymentReminderStats(): Promise<{
    pendingOrders: number
    ordersNeedingReminders: number
    ordersNeedingWarnings: number
    expiredOrders: number
  }> {
    try {
      const now = new Date()
      const reminderTime = new Date(now.getTime() - 23 * 60 * 60 * 1000) // 23 hours ago
      const warningTime = new Date(now.getTime() - 23.5 * 60 * 60 * 1000) // 23.5 hours ago
      const expiredTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago

      const [pendingOrders, ordersNeedingReminders, ordersNeedingWarnings, expiredOrders] = await Promise.all([
        prisma.order.count({
          where: {
            orderStatus: 'PENDING',
            payment: { status: 'PENDING' }
          }
        }),
        prisma.order.count({
          where: {
            orderStatus: 'PENDING',
            createdAt: {
              gte: reminderTime,
              lte: new Date(now.getTime() - 22.5 * 60 * 60 * 1000)
            },
            payment: { status: 'PENDING' }
          }
        }),
        prisma.order.count({
          where: {
            orderStatus: 'PENDING',
            createdAt: {
              gte: warningTime,
              lte: new Date(now.getTime() - 23 * 60 * 60 * 1000)
            },
            payment: { status: 'PENDING' }
          }
        }),
        prisma.order.count({
          where: {
            orderStatus: 'PENDING',
            createdAt: { lte: expiredTime },
            payment: { status: 'PENDING' }
          }
        })
      ])

      return {
        pendingOrders,
        ordersNeedingReminders,
        ordersNeedingWarnings,
        expiredOrders
      }
      
    } catch (error) {
      console.error('❌ Error getting payment reminder stats:', error)
      return {
        pendingOrders: 0,
        ordersNeedingReminders: 0,
        ordersNeedingWarnings: 0,
        expiredOrders: 0
      }
    }
  }
}

export const paymentReminderService = new PaymentReminderService()
