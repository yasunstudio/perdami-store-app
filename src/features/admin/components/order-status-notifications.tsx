'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { OrderStatus, PaymentStatus } from '@/types'
import { toast } from 'sonner'
import { 
  Bell, 
  Package, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react'

interface OrderNotification {
  id: string
  orderNumber: string
  customerName: string
  type: 'new_order' | 'payment_received' | 'status_change'
  message: string
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  createdAt: string
  isRead: boolean
}

interface OrderStatusNotificationsProps {
  onViewOrder: (orderId: string) => void
}

export function OrderStatusNotifications({ onViewOrder }: OrderStatusNotificationsProps) {
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    
    // Set up real-time notifications with SSE
    const eventSource = new EventSource('/api/admin/notifications/sse')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'notifications') {
          setNotifications(data.notifications)
          setUnreadCount(data.unreadCount)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error)
      eventSource.close()
      // Fallback to polling if SSE fails
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleQuickApprove = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: 'CONFIRMED' })
      })

      if (response.ok) {
        // Update notification status
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === orderId 
              ? { ...notif, orderStatus: 'CONFIRMED' as OrderStatus, isRead: true }
              : notif
          )
        )
        // Refresh notifications to get latest data
        fetchNotifications()
        toast.success('Pesanan berhasil disetujui!')
      } else {
        toast.error('Gagal menyetujui pesanan')
      }
    } catch (error) {
      console.error('Error approving order:', error)
      toast.error('Terjadi kesalahan saat menyetujui pesanan')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'payment_received':
        return <CreditCard className="h-4 w-4 text-green-600" />
      case 'status_change':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      PENDING: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800' },
      PROCESSING: { label: 'Diproses', color: 'bg-orange-100 text-orange-800' },
      READY: { label: 'Siap', color: 'bg-purple-100 text-purple-800' },
      COMPLETED: { label: 'Selesai', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status]
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      PENDING: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
      PAID: { label: 'Dibayar', color: 'bg-green-100 text-green-800' },
      FAILED: { label: 'Gagal', color: 'bg-red-100 text-red-800' },
      REFUNDED: { label: 'Dikembalikan', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status]
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifikasi Pesanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifikasi Pesanan
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead}
            >
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    notification.isRead 
                      ? 'bg-background' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">
                          Pesanan #{notification.orderNumber}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), 'dd MMM HH:mm', { locale: id })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Pelanggan:</span>
                        <span className="text-xs font-medium">{notification.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(notification.orderStatus)}
                          {getPaymentStatusBadge(notification.paymentStatus)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatPrice(notification.totalAmount)}
                          </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onViewOrder(notification.id)
                              if (!notification.isRead) {
                                markAsRead(notification.id)
                              }
                            }}
                            className="h-7 px-2"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Lihat
                          </Button>
                          {notification.type === 'new_order' && (
                            <Button
                              size="sm"
                              className="h-7 px-2 bg-green-600 hover:bg-green-700"
                              onClick={() => handleQuickApprove(notification.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Setujui
                            </Button>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}