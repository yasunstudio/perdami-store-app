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
  AlertTriangle
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
import { OrderListTable } from './order-list-table'
import { OrderGridView } from './order-grid-view'
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
    pendingPayments: number
    paidPayments: number
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
  const [paymentProofOpen, setPaymentProofOpen] = useState(false)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<OrderWithRelations | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OrdersResponse | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    orderStatus: 'all',
    paymentStatus: 'all'
  })
  const [page, setPage] = useState(1)
  const perPage = 10

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString()
      })
      
      if (filters.search) params.append('search', filters.search)
      if (filters.orderStatus && filters.orderStatus !== 'all') params.append('orderStatus', filters.orderStatus)
      if (filters.paymentStatus && filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus)

      const response = await fetch(`/api/admin/orders?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Gagal memuat data pesanan')
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchOrders()
  }, [page, filters])

  // Auto-refresh for realtime updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if not currently loading and no dialogs are open
      if (!loading && !paymentProofOpen && !deleteDialogOpen) {
        fetchOrders()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [loading, paymentProofOpen, deleteDialogOpen])

  // Helper function to check if order needs payment verification
  const needsPaymentVerification = (order: OrderWithRelations): boolean => {
    const hasProof = !!(order.payment?.proofUrl && order.payment.proofUrl.trim() !== '')
    const isPending = order.paymentStatus === 'PENDING'
    return isPending && hasProof
  }

  // Helper function to check if order has payment proof (regardless of status)
  const hasPaymentProof = (order: OrderWithRelations): boolean => {
    return !!(order.payment?.proofUrl && order.payment.proofUrl.trim() !== '')
  }

  // Quick actions handler
  const getQuickActions = (order: OrderWithRelations) => {
    // Always show proof button if order has payment proof
    if (hasPaymentProof(order)) {
      // Payment verification for transfer orders with proof that are pending
      if (needsPaymentVerification(order)) {
        return (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/orders/${order.id}`)}
              className="h-7 px-2 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Lihat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewPaymentProof(order)}
              className="h-7 px-2 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Eye className="h-3 w-3 mr-1" />
              Verifikasi Bukti
            </Button>
          </div>
        )
      } else {
        // For orders with proof but already processed (PAID/FAILED/etc)
        return (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/orders/${order.id}`)}
              className="h-7 px-2 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Lihat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewPaymentProof(order)}
              className="h-7 px-2 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              <Eye className="h-3 w-3 mr-1" />
              Bukti
            </Button>
          </div>
        )
      }
    }
    
    // Default actions for orders without proof
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/orders/${order.id}`)}
          className="h-7 px-2 text-xs"
        >
          Lihat
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDeleteOrder(order)}
          disabled={isDeleting}
          className="h-7 px-1 text-xs"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  // Payment verification handlers
  const handleViewPaymentProof = (order: OrderWithRelations) => {
    setSelectedOrder(order)
    setPaymentProofOpen(true)
  }

  const handleApprovePayment = async (orderId: string) => {
    setIsUpdatingPayment(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentStatus: 'PAID'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve payment')
      }

      toast.success('Pembayaran berhasil disetujui')
      setPaymentProofOpen(false)
      fetchOrders()
    } catch (error) {
      toast.error('Gagal menyetujui pembayaran')
      console.error('Error approving payment:', error)
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const handleRejectPayment = async (orderId: string) => {
    setIsUpdatingPayment(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentStatus: 'FAILED'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reject payment')
      }

      toast.success('Pembayaran ditolak')
      setPaymentProofOpen(false)
      fetchOrders()
    } catch (error) {
      toast.error('Gagal menolak pembayaran')
      console.error('Error rejecting payment:', error)
    } finally {
      setIsUpdatingPayment(false)
    }
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
      fetchOrders()
      setDeleteDialogOpen(false)
      setOrderToDelete(null)
    } catch (error) {
      toast.error('Gagal menghapus pesanan')
      console.error('Error deleting order:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setOrderToDelete(null)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filter changes
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      'CONFIRMED': { label: 'Dikonfirmasi', className: 'bg-blue-100 text-blue-800' },
      'PROCESSING': { label: 'Diproses', className: 'bg-orange-100 text-orange-800' },
      'COMPLETED': { label: 'Selesai', className: 'bg-green-100 text-green-800' },
      'CANCELLED': { label: 'Dibatalkan', className: 'bg-red-100 text-red-800' },
      'PAID': { label: 'Lunas', className: 'bg-green-100 text-green-800' },
      'FAILED': { label: 'Gagal', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, className: 'bg-gray-100 text-gray-800' }
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const orders = data?.orders || []
  const totalPages = data?.totalPages || 1

  return (
    <AdminPageLayout
      title={title}
      description={description}
      loading={loading}
    >
      {/* Mobile Quick Stats */}
      {data?.stats && (
        <div className="sm:hidden mb-4">
          <div className="grid grid-cols-1 gap-3">
            <Card className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                <span className="text-lg font-bold text-blue-600">
                  {data.stats.total}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Total Pesanan</p>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Filter & Tampilan</CardTitle>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Auto-refresh 30s</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Memuat...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Data Display */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Tidak ada pesanan</h3>
            <p className="text-muted-foreground">
              {Object.values(filters).some(Boolean) 
                ? 'Tidak ada pesanan yang sesuai dengan filter'
                : 'Belum ada pesanan yang masuk'
              }
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <OrderListTable
          orders={orders}
          onView={(order) => {
            setSelectedOrder(order)
            router.push(`/admin/orders/${order.id}`)
          }}
          // onEdit disabled - use View Details instead
          onDelete={handleDeleteOrder}
          isDeleting={isDeleting}
          getStatusBadge={getStatusBadge}
          getPaymentStatusBadge={getStatusBadge}
        />
      ) : (
        <OrderGridView
          orders={orders}
          onView={(order) => {
            setSelectedOrder(order)
            router.push(`/admin/orders/${order.id}`)
          }}
          // onEdit disabled - use View Details instead
          onDelete={handleDeleteOrder}
          getStatusBadge={getStatusBadge}
          getPaymentStatusBadge={getStatusBadge}
          getQuickActions={getQuickActions}
          needsPaymentVerification={needsPaymentVerification}
        />
      )}

      {/* Simple Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {orders.length} dari {data?.totalItems || 0} pesanan
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === 1}
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
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Payment Proof Verification Modal */}
      <Dialog open={paymentProofOpen} onOpenChange={setPaymentProofOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verifikasi Bukti Pembayaran</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nomor Pesanan:</span>
                  <p className="text-muted-foreground">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <span className="font-medium">Customer:</span>
                  <p className="text-muted-foreground">{selectedOrder.user.name}</p>
                </div>
                <div>
                  <span className="font-medium">Total Pembayaran:</span>
                  <p className="text-muted-foreground font-mono">
                    {formatPrice(selectedOrder.totalAmount)}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Metode:</span>
                  <p className="text-muted-foreground">Transfer Bank</p>
                </div>
              </div>
              
              {selectedOrder.payment?.proofUrl ? (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Bukti Transfer</h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <img 
                      src={selectedOrder.payment.proofUrl} 
                      alt="Bukti Pembayaran"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <h4 className="font-medium mb-3 text-yellow-800">Debug: Payment Info</h4>
                  <pre className="text-xs bg-white p-2 rounded overflow-auto">
                    {JSON.stringify({
                      paymentExists: !!selectedOrder.payment,
                      proofUrl: selectedOrder.payment?.proofUrl || 'NO_PROOF_URL',
                      paymentStatus: selectedOrder.payment?.status || 'NO_STATUS',
                      paymentId: selectedOrder.payment?.id || 'NO_ID',
                      orderPaymentStatus: selectedOrder.paymentStatus || 'NO_ORDER_PAYMENT_STATUS'
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPaymentProofOpen(false)}
              disabled={isUpdatingPayment}
            >
              Tutup
            </Button>
            {selectedOrder?.payment?.proofUrl && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => selectedOrder && handleRejectPayment(selectedOrder.id)}
                  disabled={isUpdatingPayment}
                >
                  {isUpdatingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Tolak
                    </>
                  )}
                </Button>
                <Button
                  variant="default"
                  onClick={() => selectedOrder && handleApprovePayment(selectedOrder.id)}
                  disabled={isUpdatingPayment}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUpdatingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Setujui
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Konfirmasi Hapus Pesanan
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Tindakan ini tidak dapat dibatalkan
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                    Anda akan menghapus pesanan "{orderToDelete?.orderNumber}"
                  </p>
                  <p className="text-red-700 dark:text-red-300 mb-2">
                    Pesanan dengan nilai Rp {orderToDelete?.subtotalAmount?.toLocaleString('id-ID')} ini akan dihapus secara permanen.
                  </p>
                  <p className="text-red-700 dark:text-red-300">
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
