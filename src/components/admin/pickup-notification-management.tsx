'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  Bell, 
  CheckCircle, 
  Calendar,
  Send,
  RefreshCw,
  AlertCircle,
  Package,
  Users,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

interface PickupStats {
  ordersForTomorrow: number
  ordersForToday: number
  recentNotifications: number
  lastUpdated: string
}

export function PickupNotificationManagement() {
  const [stats, setStats] = useState<PickupStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [targetDate, setTargetDate] = useState('')
  const [testOrderId, setTestOrderId] = useState('')

  useEffect(() => {
    fetchStats()
    // Set default target date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setTargetDate(tomorrow.toISOString().split('T')[0])
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/pickup-notifications?action=stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching pickup stats:', error)
    }
  }

  const triggerNotification = async (action: string, orderId?: string, targetDate?: string) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/pickup-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, orderId, targetDate })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message)
        await fetchStats() // Refresh stats
      } else {
        toast.error(data.error || 'Failed to send notification')
      }
    } catch (error) {
      console.error('Error triggering notification:', error)
      toast.error('Error sending notification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleH1Reminders = () => triggerNotification('h1_reminders')
  const handleTodayReminders = () => triggerNotification('today_reminders')
  const handleCustomDateReminders = () => {
    if (!targetDate) {
      toast.error('Please select a target date')
      return
    }
    triggerNotification('reminders_for_date', undefined, targetDate)
  }
  const handleTestNotification = () => {
    if (!testOrderId) {
      toast.error('Please enter an order ID for testing')
      return
    }
    triggerNotification('test_notification', testOrderId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pickup Notification Management</h2>
          <p className="text-muted-foreground">
            Kelola dan kirim notifikasi pickup reminder secara manual
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pickup Besok</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ordersForTomorrow}</div>
              <p className="text-xs text-muted-foreground">
                Orders untuk H-1 reminder
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pickup Hari Ini</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ordersForToday}</div>
              <p className="text-xs text-muted-foreground">
                Orders untuk today reminder
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifikasi 24h</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentNotifications}</div>
              <p className="text-xs text-muted-foreground">
                Pickup notifications terkirim
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Automated Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automated Pickup Reminders
          </CardTitle>
          <CardDescription>
            Kirim reminder otomatis berdasarkan pickup date
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">H-1 Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    Kirim reminder untuk pickup besok
                  </p>
                </div>
                <Badge variant="outline" className="text-yellow-600">
                  {stats?.ordersForTomorrow || 0} orders
                </Badge>
              </div>
              <Button 
                onClick={handleH1Reminders}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                <Clock className="h-4 w-4 mr-2" />
                Kirim H-1 Reminders
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Today Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    Kirim reminder untuk pickup hari ini
                  </p>
                </div>
                <Badge variant="outline" className="text-orange-600">
                  {stats?.ordersForToday || 0} orders
                </Badge>
              </div>
              <Button 
                onClick={handleTodayReminders}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                <Bell className="h-4 w-4 mr-2" />
                Kirim Today Reminders
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Date Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Custom Date Reminders
          </CardTitle>
          <CardDescription>
            Kirim reminder untuk tanggal pickup tertentu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleCustomDateReminders}
              disabled={isLoading || !targetDate}
            >
              <Send className="h-4 w-4 mr-2" />
              Kirim Reminders
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Test Notifications
          </CardTitle>
          <CardDescription>
            Kirim test notification untuk order tertentu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="testOrderId">Order ID</Label>
              <Input
                id="testOrderId"
                placeholder="Masukkan Order ID untuk test"
                value={testOrderId}
                onChange={(e) => setTestOrderId(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleTestNotification}
              disabled={isLoading || !testOrderId}
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Test
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Test notification akan dikirim sebagai &quot;pickup reminder today&quot;
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Notification Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">PICKUP_REMINDER_H1</span>
              </div>
              <p className="text-xs text-muted-foreground ml-5">
                Reminder H-1 sebelum pickup date
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">PICKUP_REMINDER_TODAY</span>
              </div>
              <p className="text-xs text-muted-foreground ml-5">
                Reminder di hari pickup
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">PICKUP_READY</span>
              </div>
              <p className="text-xs text-muted-foreground ml-5">
                Notifikasi order siap diambil
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium">PICKUP_COMPLETED</span>
              </div>
              <p className="text-xs text-muted-foreground ml-5">
                Konfirmasi pickup berhasil
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(stats.lastUpdated).toLocaleString('id-ID')}
        </div>
      )}
    </div>
  )
}
