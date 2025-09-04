'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { 
  Search, 
  RefreshCw, 
  LayoutList, 
  LayoutGrid, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { OrderStatusBadge } from '@/components/ui/order-status-badge'
import { OrderListTable } from './order-list-table'
import { OrderGridView } from './order-grid-view'
import { OrderStatistics } from './order-statistics'
import { Order } from '@/types'
import { OrderWithRelations } from '../types/order.types'

interface OrdersResponse {
  orders: OrderWithRelations[]
  totalPages: number
  totalItems: number
  stats: {
    total: number
    pending: number
    confirmed: number
    ready: number
    completed: number
    cancelled: number
    totalRevenue: number
  }
  paymentStats: {
    pending: number
    paid: number
    failed: number
    refunded: number
  }
}

interface OrderManagementLayoutProps {
  title?: string
  description?: string
}

export default function OrderManagementLayout({
  title = "Manajemen Pesanan",
  description = "Kelola semua pesanan pelanggan"
}: OrderManagementLayoutProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OrdersResponse | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    orderStatus: 'all',
    paymentStatus: 'all'
  })
  const [page, setPage] = useState(1)
  const [isDeleting, setIsDeleting] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<OrderWithRelations | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sort, setSort] = useState({ field: 'createdAt', direction: 'desc' })
  const [totalPages, setTotalPages] = useState(1)
  
  // Verify payment function
  const verifyPayment = async (orderId: string, status: 'PAID' | 'FAILED') => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Failed to verify payment')
      
      toast.success('Status pembayaran berhasil diperbarui')
      fetchOrders()
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast.error('Gagal memperbarui status pembayaran')
    }
  }

  // Quick actions for each order
  const getQuickActions = (order: OrderWithRelations) => {
    if (order.paymentStatus === 'PENDING' && order.paymentProofUrl) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => verifyPayment(order.id, 'PAID')}
            variant="default"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Terima
          </Button>
          <Button
            size="sm"
            onClick={() => verifyPayment(order.id, 'FAILED')}
            variant="destructive"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Tolak
          </Button>
        </div>
      )
    }
    return null
  }

  // Check if order needs payment verification
  const needsPaymentVerification = (order: OrderWithRelations): boolean => {
    return order.paymentStatus === 'PENDING' && Boolean(order.paymentProofUrl)
  }

  // Fetch orders function
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '10',
        sortField: sort.field,
        sortDirection: sort.direction,
        ...(filters.search && { search: filters.search }),
        ...(filters.orderStatus !== 'all' && { orderStatus: filters.orderStatus }),
        ...(filters.paymentStatus !== 'all' && { paymentStatus: filters.paymentStatus })
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const result = await response.json()
      setData(result)
      setTotalPages(result.totalPages || 1)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Gagal memuat data pesanan')
    } finally {
      setLoading(false)
    }
  }

  // Refresh data function
  const refreshData = () => {
    fetchOrders()
    toast.success('Data berhasil diperbarui')
  }

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [page, filters, sort])

  const getStatusBadge = (status: string, type: 'order' | 'payment' = 'order') => {
    return <OrderStatusBadge status={status} type={type} />
  }

  const handleExportExcel = async () => {
    const toastId = toast.loading('Mempersiapkan data untuk ekspor...')
    try {
      
      const params = new URLSearchParams({
        sortField: sort.field,
        sortDirection: sort.direction,
        ...(filters.orderStatus !== 'all' && { orderStatus: filters.orderStatus }),
        ...(filters.paymentStatus !== 'all' && { paymentStatus: filters.paymentStatus })
      })

      // Fetch all orders without pagination
      const response = await fetch(`/api/admin/orders/export?${params}`)
      if (!response.ok) throw new Error('Gagal mengambil data pesanan untuk ekspor')
      
      const result = await response.json()
      
      if (!result.orders || !Array.isArray(result.orders)) {
        throw new Error('Format data pesanan tidak valid')
      }
      
      // Group orders by store
      const storeOrders = result.orders.reduce((acc: { [key: string]: Order[] }, order: Order) => {
        const storeName = order.items?.[0]?.bundle?.store?.name || 'Tidak Ada Toko'
        if (!acc[storeName]) {
          acc[storeName] = []
        }
        acc[storeName].push(order)
        return acc
      }, {})

      // Export to Excel
      const { exportOrdersToExcel } = await import('@/lib/export-excel')
      const success = await exportOrdersToExcel({
        allOrders: result.orders,
        storeOrders
      })

      if (success) {
        toast.success('Data berhasil diekspor ke Excel', {
          id: toastId
        })
      } else {
        throw new Error('Gagal mengekspor data ke Excel')
      }
    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Gagal mengekspor data', {
        id: toastId
      })
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleDeleteOrder = (order: OrderWithRelations) => {
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

      if (!response.ok) {
        throw new Error('Failed to delete order')
      }

      toast.success('Pesanan berhasil dihapus')
      setDeleteDialogOpen(false)
      setOrderToDelete(null)
      // Refresh orders
      fetchOrders()
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

  return (
    <AdminPageLayout title={title} description={description}>
      <Card>
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle>Filter & Tampilan</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-9"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics Cards */}
          {data && (
            <OrderStatistics 
              stats={data.stats}
              paymentStats={data.paymentStats}
              loading={loading}
            />
          )}
          
          {/* Filter Section */}
          <div className="flex flex-col lg:flex-row gap-4 pb-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pesanan, customer, atau nomor pesanan..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.orderStatus}
              onValueChange={(value) => handleFilterChange('orderStatus', value)}
            >
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Status Pesanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Dikonfirmasi</SelectItem>
                <SelectItem value="PROCESSING">Diproses</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.paymentStatus}
              onValueChange={(value) => handleFilterChange('paymentStatus', value)}
            >
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Status Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Dibayar</SelectItem>
                <SelectItem value="FAILED">Gagal</SelectItem>
                <SelectItem value="REFUNDED">Dikembalikan</SelectItem>
              </SelectContent>
            </Select>



            <div className="flex gap-2">
              <div className="flex rounded-md border border-input bg-background">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none border-r h-9 px-3"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none h-9 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="h-9 px-3"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Data Display Section */}
          <div className="pt-2">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            ) : !data?.orders.length ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Tidak ada pesanan</h3>
                <p className="text-muted-foreground">
                  {Object.values(filters).some(value => value !== 'all' && value !== '') 
                    ? 'Tidak ada pesanan yang sesuai dengan filter'
                    : 'Belum ada pesanan yang masuk'
                  }
                </p>
              </div>
            ) : viewMode === 'table' ? (
              <OrderListTable
                orders={data.orders}
                onView={(order) => {
                  setSelectedOrder(order)
                  router.push(`/admin/orders/${order.id}`)
                }}
                onDelete={handleDeleteOrder}
                isDeleting={isDeleting}
                getStatusBadge={getStatusBadge}
                getPaymentStatusBadge={getStatusBadge}
              />
            ) : (
              <OrderGridView
                orders={data.orders}
                onView={(order) => {
                  setSelectedOrder(order)
                  router.push(`/admin/orders/${order.id}`)
                }}
                onDelete={handleDeleteOrder}
                getStatusBadge={getStatusBadge}
                getPaymentStatusBadge={getStatusBadge}
                getQuickActions={getQuickActions}
                needsPaymentVerification={needsPaymentVerification}
              />
            )}

            {/* Pagination */}
            {!loading && data?.orders && data.orders.length > 0 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Halaman {page} dari {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Pesanan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pesanan ini?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div>
            <div className="bg-red-50 dark:bg-red-900/10 px-4 py-3 rounded-md">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-semibold mb-1">
                    Peringatan: Penghapusan Permanen
                  </p>
                  <p className="text-sm mb-2">
                    Pesanan dengan nilai Rp {orderToDelete?.totalAmount?.toLocaleString('id-ID')} ini akan dihapus secara permanen.
                  </p>
                  <p className="text-sm">
                    Semua data terkait termasuk item pesanan dan riwayat pembayaran akan ikut terhapus.
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
