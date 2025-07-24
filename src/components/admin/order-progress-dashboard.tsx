'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3
} from 'lucide-react'

interface OrderProgressStats {
  processingOrders: number
  readyOrders: number
  overduePickups: number
  completedToday: number
}

export function OrderProgressDashboard() {
  const [stats, setStats] = useState<OrderProgressStats>({
    processingOrders: 0,
    readyOrders: 0,
    overduePickups: 0,
    completedToday: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/order-progress')
      if (!response.ok) {
        throw new Error('Failed to fetch order progress stats')
      }
      
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching order progress stats:', error)
      toast.error('Failed to load order progress statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [])

  const statsCards = [
    {
      title: 'Sedang Diproses',
      value: stats.processingOrders,
      icon: <Package className="h-4 w-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Pesanan yang sedang dalam persiapan'
    },
    {
      title: 'Siap Diambil',
      value: stats.readyOrders,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Pesanan yang siap untuk diambil customer'
    },
    {
      title: 'Terlambat Diambil',
      value: stats.overduePickups,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Pesanan yang sudah siap lebih dari 24 jam'
    },
    {
      title: 'Selesai Hari Ini',
      value: stats.completedToday,
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Pesanan yang diselesaikan hari ini'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Operational Progress Header */}
      <div>
        <h3 className="text-lg font-semibold">Monitoring Operasional</h3>
        <p className="text-sm text-muted-foreground">
          Status real-time pesanan yang memerlukan tindakan
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-md ${card.bgColor} ${card.color}`}>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        {stats.overduePickups > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Perhatian!</strong> Ada {stats.overduePickups} pesanan yang terlambat diambil. 
              Pertimbangkan untuk menghubungi customer secara langsung.
            </AlertDescription>
          </Alert>
        )}

        {stats.processingOrders > 10 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Volume Tinggi:</strong> Ada {stats.processingOrders} pesanan sedang diproses. 
              Pastikan tim memiliki kapasitas yang cukup untuk menyelesaikan semua pesanan tepat waktu.
            </AlertDescription>
          </Alert>
        )}

        {stats.readyOrders > 5 && (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              <strong>Banyak Pesanan Siap:</strong> Ada {stats.readyOrders} pesanan yang siap diambil. 
              Pastikan area pickup terorganisir dengan baik.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Data akan diperbarui otomatis setiap 30 detik
        </p>
      </div>
    </div>
  )
}
