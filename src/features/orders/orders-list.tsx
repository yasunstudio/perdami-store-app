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
  Loader2
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
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pesanan Saya</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Lihat riwayat dan status pesanan Anda
              {totalOrders > 0 && (
                <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full">
                  {totalOrders} pesanan
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={fetchOrders}
              disabled={loading}
              className="w-full sm:w-auto"
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
            <Button asChild className="w-full sm:w-auto">
              <Link href="/">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Lanjut Belanja
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filter Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status Pesanan</label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value)
                    setPage(1) // Reset to first page when filter changes
                  }}
                >
                  <SelectTrigger className="w-full">
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
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status Pembayaran</label>
                <Select 
                  value={paymentFilter} 
                  onValueChange={(value) => {
                    setPaymentFilter(value)
                    setPage(1) // Reset to first page when filter changes
                  }}
                >
                  <SelectTrigger className="w-full">
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

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 sm:p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              {statusFilter !== 'all' || paymentFilter !== 'all' ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">Tidak Ada Pesanan</h3>
                  <p className="text-muted-foreground mb-6">
                    Tidak ditemukan pesanan dengan filter yang dipilih.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button variant="outline" onClick={handleFilterReset}>
                      Reset Filter
                    </Button>
                    <Button asChild>
                      <Link href="/">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Mulai Belanja
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">Belum Ada Pesanan</h3>
                  <p className="text-muted-foreground mb-6">
                    Anda belum membuat pesanan apapun. Mulai berbelanja sekarang!
                  </p>
                  <Button asChild>
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
          <div className="space-y-4">
            {orders.map((order) => {
              const stores = getUniqueStores(order.orderItems)
              const storeGroups = getStoreItemGroups(order.orderItems)
              const totalItems = getTotalItems(order.orderItems)
              
              return (
                <Card key={order.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <h3 className="font-semibold text-base sm:text-lg">
                            #{order.orderNumber}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getStatusColor(order.orderStatus as OrderStatus)}>
                              {getStatusText(order.orderStatus as OrderStatus)}
                            </Badge>
                            <Badge className={getStatusColor(order.paymentStatus as PaymentStatus)}>
                              {getStatusText(order.paymentStatus as PaymentStatus)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex items-start gap-2">
                            <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-muted-foreground">
                                <strong>Toko:</strong> 
                              </span>
                              {stores.length === 1 ? (
                                <span className="text-muted-foreground ml-1">{stores[0]}</span>
                              ) : (
                                <div className="mt-1 space-y-1">
                                  {Object.entries(storeGroups).map(([storeName, group]) => (
                                    <div key={storeName} className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full flex-shrink-0"></div>
                                      <span className="text-muted-foreground">
                                        {storeName} ({group.count} item)
                                      </span>
                                    </div>
                                  ))}
                                  <div className="text-xs text-muted-foreground/80 italic">
                                    Total {stores.length} toko berbeda
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              <strong>Item:</strong> {totalItems} produk
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              <strong>Total:</strong> Rp {order.totalAmount.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">
                              <strong>Pembayaran:</strong> Transfer Bank
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Progress Indicator - Compact */}
                      <div className="mt-4 mb-2 border-t pt-3 dark:border-gray-800">
                        <OrderProgressIndicator currentStatus={order.orderStatus as OrderStatus} compact={true} />
                      </div>
                      
                      {/* Payment Countdown for Pending Orders */}
                      {order.orderStatus === 'PENDING' && (
                        (order.paymentStatus === 'PENDING' || order.payment?.status === 'PENDING') && (
                          <div className="mt-2 mb-2">
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
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Button variant="outline" asChild className="flex-1 sm:flex-none">
                          <Link href={`/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </Link>
                        </Button>
                        
                        {(order.paymentStatus === 'PENDING' || order.payment?.status === 'PENDING') && order.orderStatus !== 'CANCELLED' && (
                          <Button asChild className="flex-1 sm:flex-none">
                            <Link href={`/orders/${order.id}?status=payment`}>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <div className="text-sm text-muted-foreground">
              Menampilkan {orders.length} dari {totalOrders} pesanan
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              <span className="text-sm font-medium px-3">
                Halaman {page} dari {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                disabled={page === totalPages || loading}
                onClick={() => setPage(page + 1)}
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
