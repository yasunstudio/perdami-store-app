'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, Check, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import type { InAppNotification } from '@prisma/client'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Determine if user is admin
  const isAdmin = session?.user?.role === 'ADMIN'
  const apiEndpoint = isAdmin ? '/api/admin/notifications' : '/api/notifications'

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
      
      // Set up real-time notifications for admin users
      if (isAdmin) {
        const eventSource = new EventSource('/api/admin/notifications/sse')
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'notifications') {
              setNotifications(data.notifications)
              setUnreadCount(data.unreadCount)
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
      } else {
        // For non-admin users, use regular polling
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
      }
    }
  }, [session?.user, apiEndpoint, isAdmin])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isOpen && !target.closest('.notification-dropdown')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${apiEndpoint}?limit=10`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        const notification = notifications.find(n => n.id === notificationId)
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    // Return appropriate icon based on notification type
    switch (type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_PROCESSING':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
        return '📦'
      case 'PAYMENT_CONFIRMED':
        return '💳'
      case 'PICKUP_REMINDER_H1':
        return '⏰'
      case 'PICKUP_REMINDER_TODAY':
        return '🚚'
      case 'PICKUP_READY':
        return '✅'
      case 'PICKUP_COMPLETED':
        return '🎉'
      case 'SECURITY_ALERT':
        return '🔒'
      case 'PROMOTION':
        return '🎉'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_CONFIRMED':
        return 'text-blue-600 dark:text-blue-400'
      case 'ORDER_PROCESSING':
        return 'text-orange-600 dark:text-orange-400'
      case 'ORDER_READY':
        return 'text-green-600 dark:text-green-400'
      case 'ORDER_COMPLETED':
        return 'text-green-700 dark:text-green-500'
      case 'PAYMENT_CONFIRMED':
        return 'text-emerald-600 dark:text-emerald-400'
      case 'PICKUP_REMINDER_H1':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'PICKUP_REMINDER_TODAY':
        return 'text-orange-600 dark:text-orange-400'
      case 'PICKUP_READY':
        return 'text-green-600 dark:text-green-400'
      case 'PICKUP_COMPLETED':
        return 'text-purple-600 dark:text-purple-400'
      case 'SECURITY_ALERT':
        return 'text-red-600 dark:text-red-400'
      case 'PROMOTION':
        return 'text-purple-600 dark:text-purple-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className={`relative notification-dropdown ${className}`}>
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-red-500 text-white dark:bg-red-600"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-gray-900/50 z-[100] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifikasi</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={isLoading}
                className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                {isLoading ? 'Loading...' : 'Tandai Semua Dibaca'}
              </Button>
            )}
          </div>
          
          <div 
            className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollBehavior: 'smooth'
            }}
          >
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50 text-gray-400 dark:text-gray-500" />
                <p className="text-sm">Tidak ada notifikasi</p>
              </div>
            ) : (
              <div className="py-2 px-1 space-y-1">
                {notifications.map((notification, index) => (
                  <div key={notification.id} className="px-1 py-1">
                    <Card className={`${
                      notification.isRead 
                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                        : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30'
                    } transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer shadow-sm`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="text-lg mt-0.5 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`font-medium text-sm ${getNotificationColor(notification.type)} pr-2`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400"
                                    title="Tandai dibaca"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                                  title="Hapus notifikasi"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 pr-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { 
                                addSuffix: true, 
                                locale: id 
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {index < notifications.length - 1 && (
                      <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3 my-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to notifications page if exists
                  window.location.href = '/profile/notifications'
                }}
              >
                Lihat Semua Notifikasi
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
