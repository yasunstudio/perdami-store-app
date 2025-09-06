'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OrderProgressIndicator } from '@/components/shared/order-progress-indicator'
import { PaymentCountdown } from '@/components/shared/payment-countdown'
import { 
  Package, 
  Clock, 
  CreditCard, 
  Eye,
  ShoppingBag,
  Filter,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { Order, OrderStatus, PaymentStatus } from '@/types'

interface OrderWithDetails extends Order {
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    bundle: {
      id: string
      name: string
      image?: string | null
      store: {
        id: string
        name: string
      }
    }
  }>
  bank?: {
    id: string
    name: string
    code: string
    accountNumber: string
    accountName: string
  }
  user: {
    id: string
    name: string
    email: string
  }
}

function getStatusColor(status: OrderStatus | PaymentStatus) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
    case 'CONFIRMED':
    case 'PAID':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
    case 'PROCESSING':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
    case 'READY':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    case 'CANCELLED':
    case 'FAILED':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    case 'REFUNDED':
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
  }
}

function getStatusText(status: OrderStatus | PaymentStatus) {
  switch (status) {
    case 'PENDING':
      return 'Menunggu'
    case 'CONFIRMED':
      return 'Dikonfirmasi'
    case 'PROCESSING':
      return 'Diproses'
    case 'READY':
      return 'Siap Diambil'
    case 'COMPLETED':
      return 'Selesai'
    case 'CANCELLED':
      return 'Dibatalkan'
    case 'PAID':
      return 'Dibayar'
    case 'FAILED':
      return 'Gagal'
    case 'REFUNDED':
      return 'Dikembalikan'
    default:
      return status
  }
}

export default function OrdersListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
    }
  }, [session, statusFilter, paymentFilter, page])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (statusFilter !== 'all') {
        params.append('orderStatus', statusFilter)
      }
      
      if (paymentFilter !== 'all') {
        params.append('paymentStatus', paymentFilter)
      }

      // Debug logging
      console.log('Fetching orders with params:', {
        page,
        limit: 10,
        statusFilter,
        paymentFilter,
        url: `/api/orders?${params}`
      })

      const response = await fetch(`/api/orders?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const data = await response.json()
      console.log('Orders response:', data)
      
      setOrders(data.orders || [])
      setTotalPages(data.totalPages || 1)
      setTotalOrders(data.totalOrders || 0)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Gagal memuat pesanan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterReset = () => {
    setStatusFilter('all')
    setPaymentFilter('all')
    setPage(1)
    // Note: useEffect akan otomatis memanggil fetchOrders saat state berubah
  }

  const getUniqueStores = (items: OrderWithDetails['orderItems']) => {
    const stores = items.map(item => item.bundle?.store?.name).filter(Boolean)
    return [...new Set(stores)]
  }

  const getStoreItemGroups = (items: OrderWithDetails['orderItems']) => {
    const groups: { [storeName: string]: { items: OrderWithDetails['orderItems'], count: number } } = {}
    
    items.forEach(item => {
      const storeName = item.bundle?.store?.name || 'Toko Tidak Diketahui'
      if (!groups[storeName]) {
        groups[storeName] = { items: [], count: 0 }
      }
      groups[storeName].items.push(item)
      groups[storeName].count += item.quantity
    })
    
    return groups
  }

  const getTotalItems = (items: OrderWithDetails['orderItems']) => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  if (!session?.user) {
    return null
  }

  if (loading && orders.length === 0) {
    return (
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 sm:py-8 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header - Optimized for Mobile */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Pesanan Saya</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Lihat riwayat dan status pesanan Anda
              {totalOrders > 0 && (
                <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full font-medium">
                  {totalOrders} pesanan
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col xs:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={fetchOrders}
              disabled={loading}
              className="w-full xs:w-auto h-9 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
            <Button asChild className="w-full xs:w-auto h-9 text-sm">
              <Link href="/">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Lanjut Belanja
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters - Improved Mobile Layout */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Filter className="h-4 w-4" />
              Filter Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status Pesanan</label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value)
                    setPage(1) // Reset to first page when filter changes
                  }}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Semua Status Pesanan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status Pesanan</SelectItem>
                    <SelectItem value="PENDING">Menunggu</SelectItem>
                    <SelectItem value="CONFIRMED">Dikonfirmasi</SelectItem>
                    <SelectItem value="PROCESSING">Diproses</SelectItem>
                    <SelectItem value="READY">Siap Diambil</SelectItem>
                    <SelectItem value="COMPLETED">Selesai</SelectItem>
                    <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status Pembayaran</label>
                <Select 
                  value={paymentFilter} 
                  onValueChange={(value) => {
                    setPaymentFilter(value)
                    setPage(1) // Reset to first page when filter changes
                  }}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Semua Status Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status Pembayaran</SelectItem>
                    <SelectItem value="PENDING">Menunggu</SelectItem>
                    <SelectItem value="PAID">Dibayar</SelectItem>
                    <SelectItem value="FAILED">Gagal</SelectItem>
                    <SelectItem value="REFUNDED">Dikembalikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={handleFilterReset}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Orders List - Mobile Optimized */}
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-24 sm:w-32 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-32 sm:w-40 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-20 sm:w-24"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-16 sm:w-20"></div>
                  </div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 sm:py-12">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              {statusFilter !== 'all' || paymentFilter !== 'all' ? (
                <>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Tidak Ada Pesanan</h3>
                  <p className="text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto">
                    Tidak ditemukan pesanan dengan filter yang dipilih.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button variant="outline" onClick={handleFilterReset} className="h-10">
                      Reset Filter
                    </Button>
                    <Button asChild className="h-10">
                      <Link href="/">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Mulai Belanja
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Belum Ada Pesanan</h3>
                  <p className="text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto">
                    Anda belum membuat pesanan apapun. Mulai berbelanja sekarang!
                  </p>
                  <Button asChild className="h-10">
                    <Link href="/">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Mulai Belanja
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => {
              const stores = getUniqueStores(order.orderItems)
              const storeGroups = getStoreItemGroups(order.orderItems)
              const totalItems = getTotalItems(order.orderItems)
              
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col gap-3">
                      {/* Header - Order Number & Status */}
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                        <h3 className="font-semibold text-sm sm:text-base lg:text-lg">
                          #{order.orderNumber}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge className={`${getStatusColor(order.orderStatus as OrderStatus)} text-xs px-2 py-0.5`}>
                            {getStatusText(order.orderStatus as OrderStatus)}
                          </Badge>
                          <Badge className={`${getStatusColor(order.paymentStatus as PaymentStatus)} text-xs px-2 py-0.5`}>
                            {getStatusText(order.paymentStatus as PaymentStatus)}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Quick Info Row */}
                      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <CreditCard className="h-3 w-3 flex-shrink-0" />
                          <span>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      
                      {/* Store & Items Info - Simplified for Mobile */}
                      <div className="space-y-1.5 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            {stores.length === 1 ? (
                              <span className="text-muted-foreground">
                                <span className="font-medium">{stores[0]}</span> • {totalItems} item
                              </span>
                            ) : (
                              <div>
                                <span className="text-muted-foreground font-medium">
                                  {stores.length} toko • {totalItems} item
                                </span>
                                <div className="hidden sm:block mt-1 space-y-0.5">
                                  {Object.entries(storeGroups).slice(0, 2).map(([storeName, group]) => (
                                    <div key={storeName} className="flex items-center gap-1 text-xs">
                                      <div className="w-1 h-1 bg-muted-foreground rounded-full flex-shrink-0"></div>
                                      <span className="text-muted-foreground">
                                        {storeName} ({group.count} item)
                                      </span>
                                    </div>
                                  ))}
                                  {Object.entries(storeGroups).length > 2 && (
                                    <div className="text-xs text-muted-foreground/80 italic">
                                      +{Object.entries(storeGroups).length - 2} toko lainnya
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {order.pickupDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              <span className="font-medium">Pickup:</span> {new Date(order.pickupDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Order Progress Indicator - Compact for Mobile */}
                      <div className="border-t pt-3 dark:border-gray-800">
                        <OrderProgressIndicator currentStatus={order.orderStatus as OrderStatus} compact={true} />
                      </div>
                      
                      {/* Payment Countdown for Pending Orders */}
                      {order.orderStatus === 'PENDING' && (
                        (order.paymentStatus === 'PENDING' || order.payment?.status === 'PENDING') && (
                          <div className="border-t pt-3 dark:border-gray-800">
                            <PaymentCountdown 
                              order={order} 
                              onRefresh={() => {
                                // Refresh the orders list
                                fetchOrders()
                              }}
                              compact={true}
                            />
                          </div>
                        )
                      )}
                      
                      {/* Action Buttons - Improved Touch Targets */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          asChild 
                          className="flex-1 sm:flex-none h-10 min-w-[120px]"
                        >
                          <Link href={`/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </Link>
                        </Button>
                        
                        {(order.paymentStatus === 'PENDING' || order.payment?.status === 'PENDING') && order.orderStatus !== 'CANCELLED' && (
                          <Button asChild className="flex-1 sm:flex-none h-10 min-w-[120px]">
                            <Link href={`/orders/${order.id}?status=payment`}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Bayar Sekarang
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination - Mobile Optimized */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 sm:mt-8">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Menampilkan {orders.length} dari {totalOrders} pesanan
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
                className="h-8 px-3"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline ml-1">Sebelumnya</span>
              </Button>
              <span className="text-xs sm:text-sm font-medium px-2 sm:px-3 text-center min-w-[100px]">
                Hal {page} dari {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                disabled={page === totalPages || loading}
                onClick={() => setPage(page + 1)}
                className="h-8 px-3"
              >
                <span className="hidden xs:inline mr-1">Selanjutnya</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
