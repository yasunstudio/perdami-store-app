// Minimal Notification Service for Bundle-Only Architecture
import { prisma } from './prisma'

export type NotificationType = 
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'

export class NotificationService {
  /**
   * Send notification to a specific user
   */
  async sendToUser(payload: {
    userId: string
    type: NotificationType
    title: string
    message: string
    data?: any
  }): Promise<void> {
    try {
      await prisma.inAppNotification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data || {},
          isRead: false,
          readAt: null
        }
      })
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  /**
   * Send notification to all admin users
   */
  async sendToAdmins(payload: {
    type: NotificationType
    title: string
    message: string
    data?: any
  }): Promise<void> {
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: 'ADMIN'
        }
      })

      for (const admin of adminUsers) {
        await this.sendToUser({
          userId: admin.id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data
        })
      }
    } catch (error) {
      console.error('Error sending admin notification:', error)
    }
  }

  /**
   * Order notifications
   */
  async notifyOrderConfirmed(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, orderItems: { include: { bundle: true } } }
    })

    if (!order) return

    await this.sendToUser({
      userId: order.userId,
      type: 'ORDER_CONFIRMED',
      title: 'Pesanan Dikonfirmasi',
      message: `Pesanan #${order.orderNumber} telah dikonfirmasi`,
      data: { orderId: order.id, orderNumber: order.orderNumber }
    })
  }

  /**
   * Payment notifications
   */
  async notifyPaymentConfirmed(paymentId: string): Promise<void> {
    // Simple implementation
    console.log('Payment confirmed notification:', paymentId)
  }

  /**
   * Bundle-only architecture - no stock notifications needed
   */
  async notifyStockLow(bundleId: string, currentStock: number): Promise<void> {
    // Bundle-only architecture doesn't track individual stock
    return
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
