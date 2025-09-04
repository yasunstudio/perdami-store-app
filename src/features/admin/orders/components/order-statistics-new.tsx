'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ShoppingCart, 
  DollarSign, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Receipt,
  PiggyBank
} from 'lucide-react'

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  totalPurchases: number // Total cost to stores 
  grossProfit: number // Total platform profit
  productProfit: number // Profit from products only
  serviceFeeRevenue: number // Revenue from service fees
  completionRate: number
  pendingPayments: number
  averageOrderValue: number
  profitMargin: number
}

interface OrderStatisticsProps {
  stats: OrderStats
  loading?: boolean
}

export function OrderStatistics({ stats, loading }: OrderStatisticsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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

  // Helper function to format currency
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Helper function to format large numbers
  function formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K'
    }
    return value.toString()
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
      {/* 1. Total Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats.completionRate}%
            </span>
            {' '}completion rate
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
          <div className="text-2xl font-bold">{formatNumber(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center text-blue-600">
              <Receipt className="h-3 w-3 mr-1" />
              {formatCurrency(stats.averageOrderValue)}
            </span>
            {' '}avg order
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Pembelian ke Toko */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalPurchases)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center text-orange-600">
              <DollarSign className="h-3 w-3 mr-1" />
              Cost to stores
            </span>
          </p>
        </CardContent>
      </Card>

      {/* 4. Gross Profit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.grossProfit)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats.profitMargin.toFixed(1)}%
            </span>
            {' '}margin
          </p>
        </CardContent>
      </Card>

      {/* 5. Orders Completed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orders Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Successfully delivered
            </span>
          </p>
        </CardContent>
      </Card>

      {/* 6. Pending Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          <p className="text-xs text-muted-foreground">
            <span className={`inline-flex items-center ${
              stats.pendingPayments > 0 ? 'text-orange-600' : 'text-green-600'
            }`}>
              <Clock className="h-3 w-3 mr-1" />
              {stats.pendingPayments > 0 ? 'Needs attention' : 'All clear'}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderStatistics
