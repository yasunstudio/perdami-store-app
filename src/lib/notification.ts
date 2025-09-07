import { prisma } from './prisma'
import { NotificationType } from '@prisma/client'

export { NotificationType }

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
   * Pickup reminder notifications
   */
  async notifyPickupReminderH1(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        orderItems: { include: { bundle: true } }
      }
    })

    if (!order || !order.pickupDate) return

    const pickupDateStr = new Date(order.pickupDate).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    await this.sendToUser({
      userId: order.userId,
      type: 'PICKUP_REMINDER_H1',
      title: 'Reminder: Pickup Besok!',
      message: `Jangan lupa! Pesanan #${order.orderNumber} siap diambil besok (${pickupDateStr}) pukul 09:00-17:00 di Venue PIT PERDAMI 2025.`,
      data: { 
        orderId: order.id, 
        orderNumber: order.orderNumber,
        pickupDate: order.pickupDate,
        pickupLocation: 'Venue PIT PERDAMI 2025'
      }
    })
  }

  async notifyPickupReminderToday(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        orderItems: { include: { bundle: true } }
      }
    })

    if (!order || !order.pickupDate) return

    await this.sendToUser({
      userId: order.userId,
      type: 'PICKUP_REMINDER_TODAY',
      title: 'Hari Ini Pickup Day!',
      message: `Pesanan #${order.orderNumber} menunggu Anda! Ambil hari ini pukul 09:00-17:00 di Venue PIT PERDAMI 2025. Jangan sampai terlewat!`,
      data: { 
        orderId: order.id, 
        orderNumber: order.orderNumber,
        pickupDate: order.pickupDate,
        pickupLocation: 'Venue PIT PERDAMI 2025',
        operatingHours: '09:00-17:00'
      }
    })
  }

  async notifyPickupReady(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        orderItems: { include: { bundle: true } }
      }
    })

    if (!order) return

    await this.sendToUser({
      userId: order.userId,
      type: 'PICKUP_READY',
      title: 'Pesanan Siap Diambil!',
      message: `Great news! Pesanan #${order.orderNumber} sudah siap dan menunggu Anda. Silakan datang ke lokasi pickup sesuai jadwal yang Anda pilih.`,
      data: { 
        orderId: order.id, 
        orderNumber: order.orderNumber,
        pickupDate: order.pickupDate
      }
    })
  }

  async notifyPickupCompleted(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        orderItems: { include: { bundle: true } }
      }
    })

    if (!order) return

    await this.sendToUser({
      userId: order.userId,
      type: 'PICKUP_COMPLETED',
      title: 'Pickup Berhasil!',
      message: `Terima kasih! Pesanan #${order.orderNumber} telah berhasil diambil. Selamat menikmati oleh-oleh khas Bandung dan semoga acara PIT PERDAMI 2025 berjalan lancar!`,
      data: { 
        orderId: order.id, 
        orderNumber: order.orderNumber,
        completedAt: new Date()
      }
    })
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
