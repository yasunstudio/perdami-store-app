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
import { AlertTriangle, Save, X, User, Mail, Phone, CreditCard, Calendar, Building, Eye, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { formatPrice } from '@/lib/utils'

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
  pickupDate?: string | null
  createdAt: string
  updatedAt: string
  paymentMethod: string
  paymentProof?: string
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

const orderStatusOptions = [
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'PROCESSING', label: 'Diproses' },
  { value: 'READY', label: 'Siap' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' }
]

const paymentStatusOptions = [
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'PAID', label: 'Dibayar' },
  { value: 'FAILED', label: 'Gagal' },
  { value: 'REFUNDED', label: 'Dikembalikan' }
]

export default function AdminOrderEditPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(true) // Always in edit mode
  
  const [formData, setFormData] = useState({
    orderStatus: '',
    paymentStatus: '',
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
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
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

  const handleViewPaymentProof = () => {
    if (order?.paymentProof) {
      window.open(order.paymentProof, '_blank')
    }
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
      >          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Terjadi Kesalahan</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={fetchOrderDetails} variant="outline">
                Coba Lagi
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
          {/* Customer Information - Same as detail page */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <User className="h-5 w-5" />
                Informasi Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nama Lengkap</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{order.user.name || 'Nama tidak tersedia'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{order.user.email}</span>
                  </div>
                </div>
              </div>

              {order.user.phone && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nomor Telepon</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{order.user.phone}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status Management - Edit Mode Always */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <CreditCard className="h-5 w-5" />
                  Edit Order
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <X className="h-4 w-4" />
                    Batal
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Order Information Display */}
              <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground">Informasi Order Saat Ini</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status Order</Label>
                    <Badge variant="outline" className="w-fit">
                      {orderStatusOptions.find(opt => opt.value === order.orderStatus)?.label || order.orderStatus}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status Pembayaran</Label>
                    <Badge variant="outline" className="w-fit">
                      {paymentStatusOptions.find(opt => opt.value === order.paymentStatus)?.label || order.paymentStatus}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Total Pembayaran</Label>
                    <div className="text-lg font-bold text-foreground">
                      {formatPrice(order.totalAmount)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Metode Pembayaran</Label>
                    <div className="text-sm text-foreground">
                      {order.paymentMethod === 'BANK_TRANSFER' ? 'Transfer Bank' : order.paymentMethod}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Tanggal Order</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Terakhir Update</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {format(new Date(order.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </span>
                    </div>
                  </div>
                </div>

                {order.pickupDate && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Tanggal Pickup</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground font-medium">
                        {format(new Date(order.pickupDate), 'EEEE, dd MMMM yyyy', { locale: id })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Jam operasional: 09:00 - 17:00 WIB di venue Perdami 2025
                    </p>
                  </div>
                )}

                {order.bank && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Bank Tujuan</Label>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {order.bank.name} - {order.bank.accountNumber} ({order.bank.accountName})
                      </span>
                    </div>
                  </div>
                )}

                {order.paymentProof && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Bukti Pembayaran</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewPaymentProof}
                        className="flex items-center gap-2 w-full sm:w-auto"
                      >
                        <Eye className="h-4 w-4" />
                        Lihat Bukti
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Edit Form */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Edit Status Order</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderStatus">Status Order</Label>
                    <Select
                      value={formData.orderStatus}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, orderStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Status Pembayaran</Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan Admin</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Tambahkan catatan untuk order ini..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items - Same as detail page */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <CreditCard className="h-5 w-5" />
                Detail Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg border-border bg-card">
                    {item.bundle.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={item.bundle.image} 
                          alt={item.bundle.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-card-foreground truncate">{item.bundle.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{item.bundle.store.name}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="text-muted-foreground">@ {formatPrice(item.unitPrice || 0)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-card-foreground">{formatPrice(item.totalPrice || 0)}</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="text-foreground">{formatPrice(order.subtotalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biaya Layanan:</span>
                    <span className="text-foreground">{formatPrice(order.serviceFee || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span className="text-foreground">Total:</span>
                    <span className="text-foreground">{formatPrice(order.totalAmount || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageLayout>
  )
}
