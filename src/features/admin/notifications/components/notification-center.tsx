'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Clock, CheckCircle, Package, ShoppingCart, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'ORDER_UPDATE' | 'PAYMENT_REMINDER' | 'GENERAL'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: string | null
}

interface NotificationCenterProps {
  className?: string
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'ORDER_UPDATE':
      return ShoppingCart
    case 'PAYMENT_REMINDER':
      return Package
    case 'GENERAL':
    default:
      return Bell
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'ORDER_UPDATE':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'PAYMENT_REMINDER':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'GENERAL':
    default:
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string[]>([])

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications?limit=20&page=1')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (updating.includes(notificationId)) return
    
    setUpdating(prev => [...prev, notificationId])
    
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PATCH'
      })
      
      if (!response.ok) throw new Error('Failed to mark notification as read')
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      )
      
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to update notification')
    } finally {
      setUpdating(prev => prev.filter(id => id !== notificationId))
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications/mark-all-read', {
        method: 'PATCH'
      })
      
      if (!response.ok) throw new Error('Failed to mark all as read')
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      )
      
      toast.success('All notifications marked as read')
      
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to update notifications')
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (updating.includes(notificationId)) return
    
    setUpdating(prev => [...prev, notificationId])
    
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete notification')
      
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )
      
      toast.success('Notification deleted')
      
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    } finally {
      setUpdating(prev => prev.filter(id => id !== notificationId))
    }
  }

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    fetchNotifications()
    
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
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
              className="h-8"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
        <CardDescription>
          Stay updated with the latest activities and alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                You'll see new orders, payments, and system alerts here
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type)
              const typeColor = getTypeColor(notification.type)
              const isUpdating = updating.includes(notification.id)
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.isRead 
                      ? 'bg-muted/50 border-muted' 
                      : 'bg-background border-border shadow-sm'
                  } ${isUpdating ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-full ${
                      notification.isRead ? 'bg-muted' : 'bg-primary/10'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        notification.isRead ? 'text-muted-foreground' : 'text-primary'
                      }`} />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${
                          notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={typeColor}
                            variant="outline"
                          >
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className={`text-sm ${
                        notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: id
                          })}
                        </div>
                        
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 text-xs"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
