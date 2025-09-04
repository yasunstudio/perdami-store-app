'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
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
  const [showFinancialGroup, setShowFinancialGroup] = useState(true)
  const [showOrderStatusGroup, setShowOrderStatusGroup] = useState(true)

  if (loading) {
    return (
      <div className="space-y-6 mb-6">
        {/* GRUP 1: PEMBAYARAN & PROFIT Loading */}
        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="h-6 bg-muted animate-pulse rounded w-48" />
          </div>
          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="bg-card border-border">
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

        {/* GRUP 2: STATISTIK ORDER Loading */}
        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="h-6 bg-muted animate-pulse rounded w-32" />
          </div>
          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-card border-border">
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

  // Helper function to format large numbers (for group 2 only)
  function formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K'
    }
    return value.toString()
  }

  // Helper function to format financial numbers (full numbers for group 1)
  function formatFinancialNumber(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value)
  }

  return (
    <div className="space-y-6 mb-6">
      {/* GRUP 1: PEMBAYARAN & PROFIT */}
      <div className="rounded-lg border border-border bg-card dark:bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-border">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground flex items-center">
            💰 Pembayaran & Profit
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFinancialGroup(!showFinancialGroup)}
            className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
          >
            {showFinancialGroup ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show
              </>
            )}
          </Button>
        </div>
        
        {showFinancialGroup && (
          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* 1. Total Revenue */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{formatFinancialNumber(stats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center text-blue-600 dark:text-blue-400">
                      <Receipt className="h-3 w-3 mr-1" />
                      {formatCurrency(stats.averageOrderValue)}
                    </span>
                    {' '}avg order
                  </p>
                </CardContent>
              </Card>

              {/* 2. Total Pembelian ke Toko */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Total Pembelian</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{formatFinancialNumber(stats.totalPurchases)}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center text-orange-600 dark:text-orange-400">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Cost to stores
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* 3. Product Profit */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Product Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{formatFinancialNumber(stats.productProfit)}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      From sales
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* 4. Service Fees */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Service Fees</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{formatFinancialNumber(stats.serviceFeeRevenue)}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center text-purple-600 dark:text-purple-400">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Platform revenue
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* 5. Gross Profit */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Gross Profit</CardTitle>
                  <PiggyBank className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{formatFinancialNumber(stats.grossProfit)}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stats.profitMargin.toFixed(1)}%
                    </span>
                    {' '}margin
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* GRUP 2: STATISTIK ORDER PER STATUS */}
      <div className="rounded-lg border border-border bg-card dark:bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-border">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground flex items-center">
            📋 Statistik Order per Status
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOrderStatusGroup(!showOrderStatusGroup)}
            className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
          >
            {showOrderStatusGroup ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show
              </>
            )}
          </Button>
        </div>
        
        {showOrderStatusGroup && (
          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {/* 1. Pending Orders */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{stats.orderStatusBreakdown.pending}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className={`inline-flex items-center ${
                      stats.orderStatusBreakdown.pending > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {stats.orderStatusBreakdown.pending > 0 ? 'Needs payment' : 'All clear'}
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* 2. Confirmed Orders */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Confirmed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{stats.orderStatusBreakdown.confirmed}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center text-blue-600 dark:text-blue-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Paid & confirmed
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* 3. Processing Orders */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Processing</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{stats.orderStatusBreakdown.processing}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center text-yellow-600 dark:text-yellow-400">
                      <Package className="h-3 w-3 mr-1" />
                      Being prepared
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* 4. Ready Orders */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Ready</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{stats.orderStatusBreakdown.ready}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center text-green-600 dark:text-green-400">
                      <Truck className="h-3 w-3 mr-1" />
                      Ready for pickup
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* 5. Completed Orders */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{stats.orderStatusBreakdown.completed}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Successfully delivered
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* 6. Cancelled Orders */}
              <Card className="bg-card dark:bg-card border-border dark:border-border hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Cancelled</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">{stats.orderStatusBreakdown.cancelled}</div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="inline-flex items-center text-red-600 dark:text-red-400">
                      <XCircle className="h-3 w-3 mr-1" />
                      {stats.orderStatusBreakdown.cancelled > 0 ? 'Check issues' : 'No cancellations'}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderStatistics
