'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ShoppingCart, 
  DollarSign, 
  CheckCircle, 
  Clock,
  TrendingUp
} from 'lucide-react'

interface OrderStats {
  total: number
  pending: number
  confirmed: number
  ready: number
  completed: number
  cancelled: number
  totalRevenue: number
}

interface PaymentStats {
  pending: number
  paid: number
  failed: number
  refunded: number
}

interface OrderStatisticsProps {
  stats: OrderStats
  paymentStats: PaymentStats
  loading?: boolean
}

export function OrderStatistics({ stats, paymentStats, loading }: OrderStatisticsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate metrics
  const completionRate = stats.total > 0 ? 
    Math.round(((stats.completed + stats.confirmed) / stats.total) * 100) : 0
  
  const conversionRate = stats.total > 0 ? 
    Math.round((paymentStats.paid / stats.total) * 100) : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* 1. Total Pesanan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Active orders
            </span>
            {' '}di sistem
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {conversionRate}%
            </span>
            {' '}conversion rate
          </p>
        </CardContent>
      </Card>

      {/* 3. Orders Selesai */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orders Selesai</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed + stats.confirmed}</div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {completionRate}%
            </span>
            {' '}completion rate
          </p>
        </CardContent>
      </Card>

      {/* 4. Pending Pembayaran */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Pembayaran</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paymentStats.pending}</div>
          <p className="text-xs text-muted-foreground">
            <span className={`inline-flex items-center ${
              paymentStats.pending > 0 ? 'text-orange-600' : 'text-green-600'
            }`}>
              <Clock className="h-3 w-3 mr-1" />
              {paymentStats.pending > 0 ? 'Needs attention' : 'All clear'}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderStatistics
