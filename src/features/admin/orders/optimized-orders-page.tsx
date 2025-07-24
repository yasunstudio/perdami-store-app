// Optimized Orders Page with Virtual Table and better performance
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
import { ShoppingCart, Clock, Package, CheckCircle, Search, Download, Eye, Edit, RefreshCw, Trash2, TrendingUp, AlertTriangle, MoreHorizontal } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { OrderDetailModal } from '@/features/admin/components/order-detail-modal'
import { OrderExport } from '@/features/admin/components/order-export'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-performance'
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

export default function OptimizedOrdersPage() {
  const [data, setData] = useState<OrdersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Debounced search to improve performance
  const debouncedSearch = useDebounce(search, 300)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50', // Increased limit for virtual table
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && statusFilter !== '' && statusFilter !== 'all' && { orderStatus: statusFilter }),
        ...(paymentFilter && paymentFilter !== '' && paymentFilter !== 'all' && { paymentStatus: paymentFilter })
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const result = await response.json()
      setData(result.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Gagal memuat data pesanan')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter, paymentFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Handle order status change
  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      toast.success('Status pesanan berhasil diperbarui')
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Gagal mengupdate status pesanan')
    }
  }, [fetchOrders])

  // Handle delete order
  const handleDeleteOrder = useCallback(async () => {
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
      fetchOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Gagal menghapus pesanan')
    } finally {
      setIsDeleting(false)
    }
  }, [orderToDelete, fetchOrders])

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order)
    setIsDetailModalOpen(true)
  }, [])

  const handleDeleteClick = useCallback((order: Order) => {
    setOrderToDelete(order)
    setDeleteDialogOpen(true)
  }, [])

  // Status badge variant helper
  const getStatusVariant = useCallback((status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'outline'
      case 'CONFIRMED': return 'secondary'
      case 'READY': return 'default'
      case 'COMPLETED': return 'default'
      case 'CANCELLED': return 'destructive'
      default: return 'outline'
    }
  }, [])

  // Payment status badge variant helper
  const getPaymentVariant = useCallback((status: PaymentStatus) => {
    switch (status) {
      case 'PENDING': return 'outline'
      case 'PAID': return 'default'
      case 'FAILED': return 'destructive'
      case 'REFUNDED': return 'secondary'
      default: return 'outline'
    }
  }, [])

  // Virtual table columns configuration
  const columns = useMemo(() => [
    {
      key: 'orderNumber',
      header: 'No. Pesanan',
      width: 120,
      render: (order: Order) => (
        <div className="font-medium">{order.orderNumber}</div>
      )
    },
    {
      key: 'user',
      header: 'Pelanggan',
      width: 150,
      render: (order: Order) => (
        <div>
          <div className="font-medium">{order.customer.name}</div>
          <div className="text-sm text-muted-foreground">{order.customer.email}</div>
        </div>
      )
    },
    {
      key: 'items',
      header: 'Produk',
      width: 200,
      render: (order: Order) => (
        <div className="space-y-1">
          {order.items.slice(0, 2).map((item) => (
            <div key={item.id} className="text-sm">
              {item.bundle.name} x {item.quantity}
            </div>
          ))}
          {order.items.length > 2 && (
            <div className="text-sm text-muted-foreground">
              +{order.items.length - 2} lainnya
            </div>
          )}
        </div>
      )
    },
    {
      key: 'total',
      header: 'Total',
      width: 120,
      render: (order: Order) => (
        <div className="font-medium">{formatPrice(order.totalAmount)}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      render: (order: Order) => (
        <div className="space-y-1">
          <Badge variant={getStatusVariant(order.orderStatus)}>
            {order.orderStatus}
          </Badge>
          <Badge variant={getPaymentVariant(order.paymentStatus)} className="text-xs">
            {order.paymentStatus}
          </Badge>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Tanggal',
      width: 100,
      render: (order: Order) => (
        <div className="text-sm">
          {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: id })}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 80,
      render: (order: Order) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewOrder(order)}>
              <Eye className="h-4 w-4 mr-2" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteClick(order)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ], [getStatusVariant, getPaymentVariant, handleViewOrder, handleDeleteClick])

  // Stats cards data
  const statsCards = useMemo(() => {
    if (!data?.stats) return []

    return [
      {
        title: 'Total Pesanan',
        value: data.stats.total.toString(),
        description: 'Semua pesanan',
        icon: 'ShoppingCart',
        trend: { value: 0, isPositive: true }
      },
      {
        title: 'Menunggu',
        value: data.stats.pending.toString(),
        description: 'Pesanan baru',
        icon: 'Clock',
        trend: { value: 0, isPositive: false }
      },
      {
        title: 'Siap Diambil',
        value: data.stats.ready.toString(),
        description: 'Siap untuk pelanggan',
        icon: 'Package',
        trend: { value: 0, isPositive: true }
      },
      {
        title: 'Selesai',
        value: data.stats.completed.toString(),
        description: 'Pesanan selesai',
        icon: 'CheckCircle',
        trend: { value: 0, isPositive: true }
      },
      {
        title: 'Total Pendapatan',
        value: formatPrice(data.stats.totalRevenue),
        description: 'Pendapatan keseluruhan',
        icon: 'TrendingUp',
        trend: { value: 0, isPositive: true }
      }
    ]
  }, [data?.stats])

  const actions = (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={fetchOrders}
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      <OrderExport totalOrders={data?.stats.total || 0} />
    </div>
  )

  if (loading && !data) {
    return (
      <AdminPageLayout 
        title="Pesanan" 
        description="Kelola semua pesanan pelanggan"
        loading={true}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout 
      title="Pesanan" 
      description="Kelola semua pesanan pelanggan"
      actions={actions}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statsCards.map((card, index) => (
          <StatsCard key={index} {...card} />
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pesanan</CardTitle>
          <CardDescription>
            Kelola dan pantau semua pesanan pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pesanan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="PENDING">Menunggu</SelectItem>
                <SelectItem value="CONFIRMED">Dikonfirmasi</SelectItem>
                <SelectItem value="READY">Siap Diambil</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pembayaran</SelectItem>
                <SelectItem value="PENDING">Menunggu</SelectItem>
                <SelectItem value="PAID">Lunas</SelectItem>
                <SelectItem value="FAILED">Gagal</SelectItem>
                <SelectItem value="REFUNDED">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key} style={{ width: column.width }}>
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                      Tidak ada pesanan ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.orders.map((order) => (
                    <TableRow key={order.id}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.render(order)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          order={selectedOrder}
          onUpdate={fetchOrders}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pesanan {orderToDelete?.orderNumber}? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteOrder}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  )
}
