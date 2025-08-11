import { prisma } from '@/lib/prisma'

export interface CreateNotificationData {
  type: 'ORDER_UPDATE' | 'PAYMENT_REMINDER' | 'GENERAL'
  title: string
  message: string
  userId?: string
  orderId?: string
  data?: Record<string, any>
}

export class NotificationService {
  /**
   * Create a notification for admin users
   */
  static async createAdminNotification(data: Omit<CreateNotificationData, 'userId'>) {
    try {
      // Get all admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      })

      if (adminUsers.length === 0) {
        console.warn('No admin users found for notification')
        return []
      }

      // Create notifications for all admin users
      const notifications = await Promise.all(
        adminUsers.map(admin => 
          prisma.inAppNotification.create({
            data: {
              type: data.type,
              title: data.title,
              message: data.message,
              userId: admin.id,
              isRead: false,
              data: data.data || undefined
            }
          })
        )
      )

      return notifications
    } catch (error) {
      console.error('Failed to create admin notification:', error)
      throw error
    }
  }

  /**
   * Create notification for new order
   */
  static async notifyNewOrder(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { name: true, email: true } }
        }
      })

      if (!order) {
        throw new Error('Order not found')
      }

      return await this.createAdminNotification({
        type: 'ORDER_UPDATE',
        title: 'Pesanan Baru',
        message: `Pesanan baru #${order.orderNumber} dari ${order.user.name} sebesar Rp ${order.totalAmount.toLocaleString('id-ID')}`,
        data: { orderId: order.id, orderNumber: order.orderNumber }
      })
    } catch (error) {
      console.error('Failed to notify new order:', error)
      throw error
    }
  }

  /**
   * Create notification for order status change
   */
  static async notifyOrderStatusChange(orderId: string, newStatus: string, oldStatus: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { name: true, email: true } }
        }
      })

      if (!order) {
        throw new Error('Order not found')
      }

      const statusMap: Record<string, string> = {
        'PENDING': 'Menunggu',
        'CONFIRMED': 'Dikonfirmasi',
        'PREPARING': 'Sedang Disiapkan',
        'READY': 'Siap Diambil',
        'COMPLETED': 'Selesai',
        'CANCELLED': 'Dibatalkan'
      }

      return await this.createAdminNotification({
        type: 'ORDER_UPDATE',
        title: 'Status Pesanan Diperbarui',
        message: `Pesanan #${order.orderNumber} berubah dari ${statusMap[oldStatus] || oldStatus} ke ${statusMap[newStatus] || newStatus}`,
        data: { orderId: order.id, orderNumber: order.orderNumber, oldStatus, newStatus }
      })
    } catch (error) {
      console.error('Failed to notify order status change:', error)
      throw error
    }
  }

  /**
   * Create notification for payment reminder
   */
  static async notifyPaymentReminder(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { name: true, email: true } }
        }
      })

      if (!order) {
        throw new Error('Order not found')
      }

      return await this.createAdminNotification({
        type: 'PAYMENT_REMINDER',
        title: 'Pengingat Pembayaran',
        message: `Pesanan #${order.orderNumber} dari ${order.user.name} menunggu konfirmasi pembayaran`,
        data: { orderId: order.id, orderNumber: order.orderNumber }
      })
    } catch (error) {
      console.error('Failed to notify payment reminder:', error)
      throw error
    }
  }

  /**
   * Create general notification
   */
  static async notifyGeneral(title: string, message: string) {
    try {
      return await this.createAdminNotification({
        type: 'GENERAL',
        title,
        message
      })
    } catch (error) {
      console.error('Failed to create general notification:', error)
      throw error
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    try {
      return await prisma.inAppNotification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsReadForUser(userId: string) {
    try {
      return await prisma.inAppNotification.updateMany({
        where: { 
          userId,
          isRead: false
        },
        data: { isRead: true }
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string) {
    try {
      return await prisma.inAppNotification.delete({
        where: { id: notificationId }
      })
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId: string) {
    try {
      return await prisma.inAppNotification.count({
        where: {
          userId,
          isRead: false
        }
      })
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }
}
