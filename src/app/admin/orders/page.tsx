'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AdminPageLayout, StatsCard } from '@/components/admin/admin-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ShoppingCart, Clock, Package, CheckCircle, Search, Download, Edit, RefreshCw, Trash2, TrendingUp, ChevronLeft, ChevronRight, AlertTriangle, MoreHorizontal, Grid3X3, List } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { OrderMobileCard } from '@/features/admin/components/order-mobile-card'
import { OrderExport } from '@/features/admin/components/order-export'
import { OrderProgressDashboard } from '@/components/admin/order-progress-dashboard'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Order, OrderStatus, PaymentStatus, PaymentMethod } from '@/types'

interface OrderStats {
  total: number
  pending: number
  confirmed: number
  ready: number
  completed: number
  cancelled: number
  totalRevenue: number
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  stats: OrderStats
  paymentStats: {
    pending: number
    paid: number
    failed: number
    refunded: number
  }
}

export default function OrdersAdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [data, setData] = useState<OrdersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchOrders = useCallback(async () => {
    // Don't fetch if not authenticated
    if (status !== 'authenticated' || !session) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && statusFilter !== '' && statusFilter !== 'all' && { orderStatus: statusFilter }),
        ...(paymentFilter && paymentFilter !== '' && paymentFilter !== 'all' && { paymentStatus: paymentFilter })
      })

      // Try admin API first
      let response = await fetch(`/api/admin/orders?${params}`)
      let result = null
      
      if (!response.ok) {
        console.log('⚠️ Admin orders API failed, trying public fallback...')
        
        // Try public API as fallback
        const publicResponse = await fetch(`/api/orders-public?${params}`)
        
        if (publicResponse.ok) {
          const publicResult = await publicResponse.json()
          if (publicResult.success) {
            // Convert public API format to admin format
            result = {
              orders: publicResult.orders,
              pagination: publicResult.pagination,
              stats: publicResult.stats,
              paymentStats: {
                pending: 0,
                paid: 0,
                failed: 0,
                refunded: 0
              }
            }
            console.log('✅ Using public orders API fallback')
          }
        }
        
        if (!result) {
          if (response.status === 401) {
            // User is not authenticated or doesn't have permission
            toast.error('Sesi Anda telah berakhir. Silakan login kembali.')
            router.push('/auth/login?callbackUrl=/admin/orders')
            return
          }
          
          const errorText = await response.text()
          let errorMessage = 'Gagal memuat data pesanan'
          
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error || errorMessage
          } catch {
            // Keep default message if can't parse JSON
          }
          
          throw new Error(errorMessage)
        }
      } else {
        const adminResult = await response.json()
        result = adminResult.data || adminResult
        console.log('✅ Using admin orders API')
      }

      setData(result)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Gagal memuat data pesanan')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, paymentFilter, session, status, router])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderToDelete.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Pesanan berhasil dihapus')
        fetchOrders()
        setDeleteDialogOpen(false)
        setOrderToDelete(null)
      } else {
        toast.error(result.error || 'Gagal menghapus pesanan')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Gagal menghapus pesanan')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setOrderToDelete(null)
  }

  const getStatusBadge = (status: OrderStatus) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
      PROCESSING: 'bg-orange-100 text-orange-800 border-orange-200',
      READY: 'bg-purple-100 text-purple-800 border-purple-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200'
    }
    
    return (
      <Badge className={colors[status]}>
        {status}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PAID: 'bg-green-100 text-green-800 border-green-200',
      FAILED: 'bg-red-100 text-red-800 border-red-200',
      REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    return (
      <Badge className={colors[status]}>
        {status}
      </Badge>
    )
  }

  if (loading && !data) {
    return (
      <AdminPageLayout
        title="Pesanan"
        description="Kelola semua pesanan pelanggan"
      >
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title="Pesanan"
      description="Kelola semua pesanan pelanggan"
    >
      {/* Unified Order Statistics Dashboard */}
      <div className="space-y-6">
        {/* Overview Statistics */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Pesanan"
              value={data?.stats?.total?.toString() || '0'}
              description="Semua pesanan"
              icon={<Package className="h-4 w-4 text-slate-600" />}
            />
            <StatsCard
              title="Menunggu Konfirmasi"
              value={data?.stats?.pending?.toString() || '0'}
              description="Perlu diproses"
              icon={<Clock className="h-4 w-4 text-yellow-600" />}
            />
            <StatsCard
              title="Pesanan Selesai"
              value={data?.stats?.completed?.toString() || '0'}
              description="Pesanan diselesaikan"
              icon={<CheckCircle className="h-4 w-4 text-green-600" />}
            />
            <StatsCard
              title="Total Pendapatan"
              value={formatPrice(data?.stats?.totalRevenue || 0)}
              description="Dari pesanan yang dibayar"
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
            />
          </div>
        </div>

        {/* Operational Progress Dashboard */}
        <OrderProgressDashboard />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Manajemen Pesanan
              </CardTitle>
              
              {/* Refresh and Export Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchOrders()
                  }}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <OrderExport
                  totalOrders={data?.pagination?.total || 0}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari pesanan, customer, atau nomor pesanan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status Pesanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="CONFIRMED">Dikonfirmasi</SelectItem>
                  <SelectItem value="READY">Siap</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status Pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Pembayaran</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="PAID">Lunas</SelectItem>
                  <SelectItem value="FAILED">Gagal</SelectItem>
                  <SelectItem value="REFUNDED">Dikembalikan</SelectItem>
                </SelectContent>
              </Select>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pesanan</CardTitle>
            <CardDescription>
              {data?.pagination?.total || 0} pesanan ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {data?.orders?.length === 0 ? (
              <div className="text-center py-8 px-6">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak ada pesanan</h3>
                <p className="text-muted-foreground">Belum ada pesanan yang sesuai dengan filter yang dipilih.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data?.orders?.map((order) => (
                  <OrderMobileCard
                    key={order.id}
                    order={order}
                    onView={(order) => {
                      router.push(`/admin/orders/${order.id}`)
                    }}
                    onDelete={handleDeleteOrder}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <div className="min-w-[800px]">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20%]">No. Pesanan</TableHead>
                      <TableHead className="w-[20%]">Customer</TableHead>
                      <TableHead className="w-[12%]">Items</TableHead>
                      <TableHead className="w-[12%] text-right">Total</TableHead>
                      <TableHead className="w-[10%]">Status</TableHead>
                      <TableHead className="w-[12%]">Pembayaran</TableHead>
                      <TableHead className="w-[10%]">Tanggal</TableHead>
                      <TableHead className="w-[4%] text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.orders?.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium w-[20%]">
                          <div className="font-mono text-sm break-all">{order.orderNumber}</div>
                        </TableCell>
                        <TableCell className="w-[20%]">
                          <div className="space-y-1">
                            <div className="font-medium truncate">{order.customer.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {order.customer.email}
                            </div>
                            {order.customer.hotel && (
                              <div className="text-sm text-muted-foreground truncate">
                                {order.customer.hotel} - Room {order.customer.roomNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="w-[12%]">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {(order.items || []).length} item(s)
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {(order.items || []).slice(0, 2).map(item => item.bundle.name).join(', ')}
                              {(order.items || []).length > 2 && '...'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium w-[12%] text-right">
                          <div className="truncate">{formatPrice(order.totalAmount)}</div>
                        </TableCell>
                        <TableCell className="w-[10%]">
                          {getStatusBadge(order.orderStatus)}
                        </TableCell>
                        <TableCell className="w-[12%]">
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </TableCell>
                        <TableCell className="w-[10%]">
                          <div className="space-y-1">
                            <div className="text-sm">
                              {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: id })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(order.createdAt), 'HH:mm')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[4%] text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                disabled={isDeleting}
                              >
                                <span className="sr-only">Buka menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  router.push(`/admin/orders/${order.id}`)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Kelola Pesanan
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteOrder(order)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination info */}
        {data?.pagination && (
          <div className="flex items-center justify-between text-sm text-muted-foreground px-6 py-2 border-t">
            <div>
              Menampilkan {data.orders?.length || 0} dari {data.pagination.total} pesanan
            </div>
            <div>
              Halaman {data.pagination.page} dari {data.pagination.totalPages}
            </div>
          </div>
        )}
        
        {/* Pagination Controls */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!data.pagination.hasPrev}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                const currentPage = page
                const totalPages = data.pagination.totalPages
                
                let startPage = Math.max(1, currentPage - 2)
                const endPage = Math.min(totalPages, startPage + 4)
                
                if (endPage - startPage < 4) {
                  startPage = Math.max(1, endPage - 4)
                }
                
                const pageNumber = startPage + i
                
                if (pageNumber > endPage) return null
                
                return (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNumber)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!data.pagination.hasNext}
              className="h-8 px-3"
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Konfirmasi Penghapusan
            </DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                    Anda akan menghapus pesanan &quot;{orderToDelete?.orderNumber}&quot;
                  </p>
                  <p className="text-red-700 dark:text-red-300">
                    {orderToDelete?.orderStatus !== 'CANCELLED' 
                      ? 'Pesanan ini masih dalam status aktif. Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait pesanan.'
                      : 'Tindakan ini akan menghapus pesanan secara permanen dan tidak dapat dibatalkan.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteOrder}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Pesanan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  )
}