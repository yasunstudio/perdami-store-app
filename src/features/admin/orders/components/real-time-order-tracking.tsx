'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Package, CheckCircle, Timer, AlertCircle, Truck, MapPin, User, CreditCard, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'

interface Order {
  id: string
  orderNumber: string
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  subtotalAmount: number
  serviceFee: number
  totalAmount: number
  pickupDate: string | null
  pickupMethod: string | null
  pickupStatus: string | null
  paymentProofUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    name: string | null
    email: string
  }
  user: {
    id: string
    name: string | null
    email: string
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    bundle: {
      id: string
      name: string
      price: number
      image: string | null
    }
  }>
}

interface RealTimeOrderTrackingProps {
  className?: string
}

const statusConfig = {
  PENDING: { 
    label: 'Menunggu', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Pesanan baru menunggu konfirmasi'
  },
  CONFIRMED: { 
    label: 'Dikonfirmasi', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    description: 'Pesanan telah dikonfirmasi admin'
  },
  PROCESSING: { 
    label: 'Sedang Disiapkan', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Package,
    description: 'Pesanan sedang dalam tahap persiapan'
  },
  READY: { 
    label: 'Siap Diambil', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Truck,
    description: 'Pesanan siap untuk diambil customer'
  },
  COMPLETED: { 
    label: 'Selesai', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: CheckCircle,
    description: 'Pesanan telah selesai'
  },
  CANCELLED: { 
    label: 'Dibatalkan', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    description: 'Pesanan telah dibatalkan'
  }
}

const paymentStatusConfig = {
  PENDING: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Lunas', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Gagal', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-800' }
}

export function RealTimeOrderTracking({ className }: RealTimeOrderTrackingProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [updating, setUpdating] = useState<string[]>([])

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('orderStatus', statusFilter)
      }
      params.append('limit', '10')
      params.append('page', '1')

      console.log('Fetching orders with params:', params.toString())
      const response = await fetch(`/api/admin/orders?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Fetched data:', data)
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error(`Gagal memuat data pesanan: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setOrders([]) // Set empty array on error to prevent undefined
    } finally {
      setLoading(false)
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (updating.includes(orderId)) return

    setUpdating(prev => [...prev, orderId])

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update order status')

      const updatedOrder = await response.json()
      
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, orderStatus: newStatus as any, updatedAt: new Date().toISOString() }
            : order
        )
      )

      toast.success(`Order status updated to ${statusConfig[newStatus as keyof typeof statusConfig].label}`)

    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdating(prev => prev.filter(id => id !== orderId))
    }
  }

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    fetchOrders()
    
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [statusFilter])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Real-time Order Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const filteredOrders = orders.filter(order => 
    statusFilter === 'ALL' || order.orderStatus === statusFilter
  )

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Real-time Order Tracking
              <Badge variant="secondary" className="ml-2">
                {filteredOrders.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Monitor and manage order status in real-time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PENDING">Menunggu</SelectItem>
                <SelectItem value="CONFIRMED">Dikonfirmasi</SelectItem>
                <SelectItem value="PROCESSING">Sedang Disiapkan</SelectItem>
                <SelectItem value="READY">Siap Diambil</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              className="h-9"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'ALL' 
                  ? 'No orders available at the moment'
                  : `No orders with status "${statusConfig[statusFilter as keyof typeof statusConfig]?.label}"`
                }
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusInfo = statusConfig[order.orderStatus as keyof typeof statusConfig] || statusConfig.PENDING
              const paymentInfo = paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig] || paymentStatusConfig.PENDING
              const StatusIcon = statusInfo.icon
              const isUpdating = updating.includes(order.id)
              
              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    isUpdating ? 'opacity-50 scale-[0.98]' : 'bg-background border-border hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Order Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <StatusIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">#{order.orderNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            Rp {order.totalAmount.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusInfo.color} variant="outline">
                          {statusInfo.label}
                        </Badge>
                        <Badge className={paymentInfo.color} variant="outline">
                          {paymentInfo.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {order.user.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: true,
                          locale: id
                        })}
                      </div>
                      {order.pickupDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.pickupDate).toLocaleDateString('id-ID')}
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Items:</p>
                        <div className="text-sm">
                          {order.items.map((item, index) => (
                            <div key={item.id} className="flex justify-between">
                              <span>
                                {item.bundle?.name || `Item ${index + 1}`} x{item.quantity}
                              </span>
                              <span>Rp {(item.totalPrice).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Update Actions */}
                    {order.orderStatus !== 'COMPLETED' && order.orderStatus !== 'CANCELLED' && (
                      <div className="flex gap-2 pt-2 border-t">
                        {order.orderStatus === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                            disabled={isUpdating}
                            className="h-7 text-xs"
                          >
                            Konfirmasi
                          </Button>
                        )}
                        {order.orderStatus === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
                            disabled={isUpdating}
                            className="h-7 text-xs"
                          >
                            Mulai Siapkan
                          </Button>
                        )}
                        {order.orderStatus === 'PROCESSING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'READY')}
                            disabled={isUpdating}
                            className="h-7 text-xs"
                          >
                            Siap Diambil
                          </Button>
                        )}
                        {order.orderStatus === 'READY' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                            disabled={isUpdating}
                            className="h-7 text-xs"
                          >
                            Selesai
                          </Button>
                        )}
                        {(order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PROCESSING' || order.orderStatus === 'READY') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                            disabled={isUpdating}
                            className="h-7 text-xs ml-auto"
                          >
                            Batalkan
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
