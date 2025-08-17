'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Save, X, User, Mail, Phone, CreditCard, Calendar, Package, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface OrderData {
  id: string
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  pickupStatus: string
  notes?: string
  subtotalAmount: number
  serviceFee: number
  totalAmount: number
  pickupDate?: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    bundle: {
      id: string
      name: string
      image?: string
      store: {
        id: string
        name: string
      }
    }
  }>
  bank?: {
    id: string
    name: string
    accountNumber: string
    accountName: string
  }
}

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'PROCESSING', label: 'Diproses', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'READY', label: 'Siap', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'COMPLETED', label: 'Selesai', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  { value: 'CANCELLED', label: 'Dibatalkan', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
]

const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'PAID', label: 'Dibayar', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'FAILED', label: 'Gagal', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'REFUNDED', label: 'Dikembalikan', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' }
]

const PICKUP_STATUSES = [
  { value: 'PENDING', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'READY', label: 'Siap Diambil', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'COMPLETED', label: 'Sudah Diambil', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' }
]

export default function AdminOrderEditPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    orderStatus: '',
    paymentStatus: '',
    pickupStatus: '',
    pickupDate: '',
    notes: ''
  })

  useEffect(() => {
    console.log('🚀 AdminOrderEditPage useEffect - orderId:', orderId)
    if (orderId) {
      fetchOrderDetails()
    } else {
      setError('Order ID tidak valid')
      setLoading(false)
    }
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📡 Fetching order details for edit page, ID:', orderId)
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order tidak ditemukan')
        }
        if (response.status === 401) {
          throw new Error('Anda tidak memiliki akses ke halaman ini')
        }
        if (response.status === 403) {
          throw new Error('Akses ditolak')
        }
        
        const errorText = await response.text()
        console.error('📡 Response error:', errorText)
        throw new Error(`Gagal memuat detail order (${response.status})`)
      }
      
      const data = await response.json()
      console.log('📡 Received order data for edit:', data)
      setOrder(data)
      
      // Initialize form data with current order values
      setFormData({
        orderStatus: data.orderStatus || 'PENDING',
        paymentStatus: data.paymentStatus || 'PENDING',
        pickupStatus: data.pickupStatus || 'PENDING',
        pickupDate: data.pickupDate ? new Date(data.pickupDate).toISOString().split('T')[0] : '',
        notes: data.notes || ''
      })
    } catch (error) {
      console.error('❌ Error fetching order for edit:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat order')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderStatus: formData.orderStatus,
          paymentStatus: formData.paymentStatus,
          pickupStatus: formData.pickupStatus,
          pickupDate: formData.pickupDate || null,
          notes: formData.notes
        })
      })
      
      if (!response.ok) {
        throw new Error('Gagal menyimpan perubahan')
      }
      
      toast.success('Order berhasil diperbarui')
      router.push(`/admin/orders/${orderId}`)
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/orders/${orderId}`)
  }

  // Early return for invalid orderId
  if (!orderId || typeof orderId !== 'string') {
    console.log('❌ Invalid orderId:', orderId)
    return (
      <AdminPageLayout 
        title="Error"
        description="Order ID tidak valid"
        showBackButton={true}
        backUrl="/admin/orders"
      >
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Order ID Tidak Valid</h2>
          <p className="text-muted-foreground mb-6">Order ID yang Anda akses tidak valid.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => router.push('/admin/orders')} variant="outline">
              Kembali ke Daftar Order
            </Button>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  if (loading) {
    console.log('⏳ Loading order for edit...')
    return (
      <AdminPageLayout 
        title="Memuat Order..."
        description="Sedang memuat detail order"
        showBackButton={true}
        backUrl="/admin/orders"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  if (error) {
    console.log('❌ Error state:', error)
    return (
      <AdminPageLayout 
        title="Error"
        description="Terjadi kesalahan saat memuat order"
        showBackButton={true}
        backUrl="/admin/orders"
      >
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Terjadi Kesalahan</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={fetchOrderDetails} variant="outline">
              Coba Lagi
            </Button>
            <Button onClick={() => router.push('/admin/orders')} variant="outline">
              Kembali ke Daftar Order
            </Button>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  if (!order) {
    console.log('❌ No order data found')
    return (
      <AdminPageLayout 
        title="Order Tidak Ditemukan"
        description="Order dengan ID tersebut tidak ditemukan"
        showBackButton={true}
        backUrl="/admin/orders"
      >
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Order Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">Order dengan ID tersebut tidak ditemukan.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => router.push('/admin/orders')} variant="outline">
              Kembali ke Daftar Order
            </Button>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  console.log('✅ Rendering edit form for order:', order.orderNumber)
  return (
    <AdminPageLayout 
      title={`Edit Order #${order.orderNumber}`}
      description={`Edit informasi dan status order dari ${order.user.name || 'Pengguna'}`}
      showBackButton={true}
      backUrl={`/admin/orders/${order.id}`}
      actions={
        <Button size="sm" variant="outline" onClick={() => router.push(`/admin/orders/${orderId}`)}>
          <Eye className="h-4 w-4 mr-2" />
          Lihat Detail
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Main Content - Same layout as detail page */}
        <div className="grid grid-cols-1 gap-6">
          {/* Order Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Order
              </CardTitle>
              <CardDescription>
                Edit status dan informasi order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Informasi Pelanggan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nama</p>
                      <p className="font-medium">{order.user.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{order.user.email}</p>
                    </div>
                  </div>
                  
                  {order.user.phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telepon</p>
                        <p className="font-medium">{order.user.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Order Details */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Detail Order</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium">Rp {(order.totalAmount || 0).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Order</p>
                      <p className="font-medium">
                        {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
                      </p>
                    </div>
                  </div>

                  {order.bank && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bank</p>
                        <p className="font-medium">{order.bank.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Edit Status Form */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Edit Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderStatus">Status Order</Label>
                    <Select value={formData.orderStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, orderStatus: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={`${status.color} text-xs border-0`}>
                                {status.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Status Pembayaran</Label>
                    <Select value={formData.paymentStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={`${status.color} text-xs border-0`}>
                                {status.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickupStatus">Status Pickup</Label>
                    <Select value={formData.pickupStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, pickupStatus: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PICKUP_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={`${status.color} text-xs border-0`}>
                                {status.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickupDate">Tanggal Pickup</Label>
                    <Input
                      type="date"
                      value={formData.pickupDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, pickupDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan Admin</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Tambahkan catatan untuk pesanan ini..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Order
              </CardTitle>
              <CardDescription>
                Daftar item dalam pesanan ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {item.bundle.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={item.bundle.image} 
                          alt={item.bundle.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.bundle.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.bundle.store.name}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm">Qty: {item.quantity}</span>
                        <span className="text-sm">@ Rp {(item.unitPrice || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rp {(item.totalPrice || 0).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal:</span>
                    <span className="text-sm">Rp {(order.subtotalAmount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Biaya Layanan:</span>
                    <span className="text-sm">Rp {(order.serviceFee || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>Rp {(order.totalAmount || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  )
}
