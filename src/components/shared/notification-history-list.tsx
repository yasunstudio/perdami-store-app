'use client'

import { InAppNotification } from '@prisma/client'
import { Bell, BellOff, Trash2, Clock, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface NotificationHistoryListProps {
  notifications: InAppNotification[]
}

export function NotificationHistoryList({ notifications }: NotificationHistoryListProps) {
  const [notificationList, setNotificationList] = useState(notifications)

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotificationList(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })

      if (response.ok) {
        setNotificationList(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, isRead: true, readAt: new Date() }
              : n
          )
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_PROCESSING':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'ORDER_CANCELLED':
        return <BellOff className="w-5 h-5 text-red-500" />
      case 'PAYMENT_CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'PAYMENT_FAILED':
        return <BellOff className="w-5 h-5 text-red-500" />
      case 'PICKUP_REMINDER_H1':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'PICKUP_REMINDER_TODAY':
        return <Bell className="w-5 h-5 text-orange-500" />
      case 'PICKUP_READY':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'PICKUP_COMPLETED':
        return <CheckCircle className="w-5 h-5 text-purple-500" />
      case 'SECURITY_ALERT':
        return <Bell className="w-5 h-5 text-yellow-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_PROCESSING':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'ORDER_CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'PAYMENT_CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'PAYMENT_FAILED':
        return 'bg-red-100 text-red-800'
      case 'PICKUP_REMINDER_H1':
        return 'bg-yellow-100 text-yellow-800'
      case 'PICKUP_REMINDER_TODAY':
        return 'bg-orange-100 text-orange-800'
      case 'PICKUP_READY':
        return 'bg-green-100 text-green-800'
      case 'PICKUP_COMPLETED':
        return 'bg-purple-100 text-purple-800'
      case 'SECURITY_ALERT':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (notificationList.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada notifikasi
            </h3>
            <p className="text-gray-500">
              Notifikasi Anda akan muncul di sini
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notificationList.map((notification) => (
        <Card key={notification.id} className={`${
          !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <CardTitle className="text-sm font-medium">
                      {notification.title}
                    </CardTitle>
                    <Badge className={`text-xs ${getNotificationColor(notification.type)}`}>
                      {notification.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: id
                      })}
                    </span>
                    {notification.readAt && (
                      <span className="text-green-600">
                        Dibaca pada {formatDistanceToNow(new Date(notification.readAt), {
                          addSuffix: true,
                          locale: id
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-xs"
                  >
                    Tandai dibaca
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(notification.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {notification.data && (
            <CardContent className="pt-0">
              <div className="bg-gray-50 p-3 rounded-lg">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(notification.data, null, 2)}
                </pre>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
