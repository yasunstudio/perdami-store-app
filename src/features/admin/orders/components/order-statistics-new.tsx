'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ShoppingCart, 
  DollarSign, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Receipt,
  PiggyBank,
  AlertTriangle,
  Package,
  Truck,
  XCircle
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
  orderStatusBreakdown: {
    pending: number
    confirmed: number
    processing: number
    ready: number
    completed: number
    cancelled: number
  }
}

interface OrderStatisticsProps {
  stats: OrderStats
  loading?: boolean
}

export function OrderStatistics({ stats, loading }: OrderStatisticsProps) {
  if (loading) {
    return (
      <div className="space-y-6 mb-6">
        {/* GRUP 1: PEMBAYARAN & PROFIT Loading */}
        <div>
          <div className="h-6 bg-muted animate-pulse rounded w-48 mb-3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
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
        </div>

        {/* GRUP 2: STATISTIK ORDER Loading */}
        <div>
          <div className="h-6 bg-muted animate-pulse rounded w-32 mb-3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
        </div>
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
    <div className="space-y-6 mb-6">
      {/* GRUP 1: PEMBAYARAN & PROFIT */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">💰 Pembayaran & Profit</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* 1. Total Revenue */}
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

          {/* 2. Total Pembelian ke Toko */}
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

          {/* 3. Product Profit */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Product Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.productProfit)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  From sales
                </span>
              </p>
            </CardContent>
          </Card>

          {/* 4. Service Fees */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Fees</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.serviceFeeRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-purple-600">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Platform revenue
                </span>
              </p>
            </CardContent>
          </Card>

          {/* 5. Gross Profit */}
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
        </div>
      </div>

      {/* GRUP 2: STATISTIK ORDER PER STATUS */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">📋 Statistik Order per Status</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 1. Pending Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orderStatusBreakdown.pending}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${
                  stats.orderStatusBreakdown.pending > 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {stats.orderStatusBreakdown.pending > 0 ? 'Needs payment' : 'All clear'}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* 2. Confirmed Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orderStatusBreakdown.confirmed}</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-blue-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Paid & confirmed
                </span>
              </p>
            </CardContent>
          </Card>

          {/* 3. Processing Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orderStatusBreakdown.processing}</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-yellow-600">
                  <Package className="h-3 w-3 mr-1" />
                  Being prepared
                </span>
              </p>
            </CardContent>
          </Card>

          {/* 4. Ready Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orderStatusBreakdown.ready}</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-green-600">
                  <Truck className="h-3 w-3 mr-1" />
                  Ready for pickup
                </span>
              </p>
            </CardContent>
          </Card>

          {/* 5. Completed Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orderStatusBreakdown.completed}</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Successfully delivered
                </span>
              </p>
            </CardContent>
          </Card>

          {/* 6. Cancelled Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orderStatusBreakdown.cancelled}</div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center text-red-600">
                  <XCircle className="h-3 w-3 mr-1" />
                  {stats.orderStatusBreakdown.cancelled > 0 ? 'Check issues' : 'No cancellations'}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default OrderStatistics
