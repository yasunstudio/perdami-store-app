'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Zap, 
  Package, 
  Users, 
  ShoppingCart, 
  Store, 
  Settings, 
  BarChart3, 
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  PlusCircle,
  FileText,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

interface QuickStats {
  pendingOrders: number
  unreadNotifications: number
  activeStores: number
  todayRevenue: number
  lastUpdate: string
}

interface QuickActionsProps {
  className?: string
}

export function QuickActionsPanel({ className }: QuickActionsProps) {
  const [stats, setStats] = useState<QuickStats>({
    pendingOrders: 0,
    unreadNotifications: 0,
    activeStores: 0,
    todayRevenue: 0,
    lastUpdate: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)

  // Fetch quick stats
  const fetchQuickStats = async () => {
    try {
      const response = await fetch('/api/admin/quick-stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          pendingOrders: data.pendingOrders || 0,
          unreadNotifications: data.unreadNotifications || 0,
          activeStores: data.activeStores || 0,
          todayRevenue: data.todayRevenue || 0,
          lastUpdate: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Quick actions
  const quickActions = [
    {
      id: 'create-bundle',
      label: 'Buat Bundle Baru',
      description: 'Tambahkan produk bundle dengan gambar',
      icon: PlusCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        // This would normally trigger the CreateBundleDialog
        toast.info('Buka halaman Bundle Management untuk membuat bundle baru')
        window.location.href = '/admin/bundles'
      }
    },
    {
      id: 'view-orders',
      label: 'Kelola Pesanan',
      description: 'Lihat dan update status pesanan',
      icon: ShoppingCart,
      color: 'bg-green-500 hover:bg-green-600',
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : undefined,
      action: () => {
        window.location.href = '/admin/orders'
      }
    },
    {
      id: 'manage-stores',
      label: 'Kelola Toko',
      description: 'Tambah atau edit informasi toko',
      icon: Store,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        window.location.href = '/admin/stores'
      }
    },
    {
      id: 'view-analytics',
      label: 'Lihat Laporan',
      description: 'Analisis penjualan dan performa',
      icon: BarChart3,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => {
        toast.info('Fitur laporan akan segera tersedia')
      }
    },
    {
      id: 'notifications',
      label: 'Notifikasi',
      description: 'Lihat aktivitas terbaru',
      icon: Bell,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      badge: stats.unreadNotifications > 0 ? stats.unreadNotifications : undefined,
      action: () => {
        window.location.href = '/admin/notifications'
      }
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      description: 'Konfigurasi sistem dan bank',
      icon: Settings,
      color: 'bg-gray-500 hover:bg-gray-600',
      action: () => {
        window.location.href = '/admin/settings'
      }
    }
  ]

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    fetchQuickStats()
    const interval = setInterval(fetchQuickStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
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
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
          <Badge variant="secondary" className="ml-auto">
            {stats.pendingOrders + stats.unreadNotifications}
          </Badge>
        </CardTitle>
        <CardDescription>
          Akses cepat ke fungsi utama admin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Pending Orders</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-yellow-600">
                  {stats.pendingOrders}
                </span>
                {stats.pendingOrders > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Action needed
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Today Revenue</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                Rp {(stats.todayRevenue / 1000).toFixed(0)}K
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.unreadNotifications}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Active Stores</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.activeStores}
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 justify-start relative"
                  onClick={action.action}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={`p-2 rounded-lg ${action.color} text-white shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium text-sm">{action.label}</div>
                      <div className="text-xs text-muted-foreground mt-1 leading-tight">
                        {action.description}
                      </div>
                    </div>
                    {action.badge && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>

          <Separator />

          {/* System Status */}
          <div className="text-center text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-3 w-3" />
              <span>System Status</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>All systems operational</span>
              </div>
            </div>
            <div className="mt-1">
              Last updated: {new Date(stats.lastUpdate).toLocaleTimeString('id-ID')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
