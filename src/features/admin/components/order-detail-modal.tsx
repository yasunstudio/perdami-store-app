'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminOrderActions } from '@/components/admin/admin-order-actions'
import { PaymentStatusHistory } from '@/components/admin/payment-status-history'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Order, OrderStatus, PaymentStatus, PaymentMethod } from '@/types'
import { formatPrice } from '@/lib/utils'
import { 
  User, 
  Package, 
  CreditCard, 
  MapPin, 
  Clock, 
  FileText,
  Phone,
  Mail,
  Building,
  Save,
  Eye,
  Download,
  Edit3,
  History,
  MessageCircle
} from 'lucide-react'
import { generateCustomerPickupMessage, openWhatsApp, validateIndonesianPhone } from '@/lib/whatsapp'

interface OrderDetailModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

const orderStatusOptions = [
  { value: 'PENDING', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800' },
  { value: 'READY', label: 'Siap', color: 'bg-purple-100 text-purple-800' },
  { value: 'COMPLETED', label: 'Selesai', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Dibatalkan', color: 'bg-red-100 text-red-800' }
]

const paymentStatusOptions = [
  { value: 'PENDING', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PAID', label: 'Dibayar', color: 'bg-green-100 text-green-800' },
  { value: 'FAILED', label: 'Gagal', color: 'bg-red-100 text-red-800' },
  { value: 'REFUNDED', label: 'Dikembalikan', color: 'bg-gray-100 text-gray-800' }
]

export function OrderDetailModal({ order, isOpen, onClose, onUpdate }: OrderDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(order?.orderStatus as OrderStatus || 'PENDING' as OrderStatus)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order?.paymentStatus as PaymentStatus || 'PENDING' as PaymentStatus)
  const [notes, setNotes] = useState(order?.notes || '')
  const [isUpdating, setIsUpdating] = useState(false)

  // Update state when order changes
  useEffect(() => {
    if (order) {
      setOrderStatus(order.orderStatus as OrderStatus)
      setPaymentStatus(order.paymentStatus as PaymentStatus)
      setNotes(order.notes || '')
    }
    // Reset to view mode when modal opens
    setIsEditMode(false)
  }, [order])

  if (!order) return null

  const handleUpdateOrder = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderStatus,
          paymentStatus,
          notes
        })
      })

      if (!response.ok) {
        throw new Error('Gagal memperbarui pesanan')
      }

      toast.success('Pesanan berhasil diperbarui')
      setIsEditMode(false)
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Gagal memperbarui pesanan')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleViewPaymentProof = () => {
    if (order.paymentProof) {
      window.open(order.paymentProof, '_blank')
    }
  }

  // Handle WhatsApp notification to customer
  const handleNotifyCustomer = () => {
    if (!order) return
    
    try {
      const customerPhone = order.customer?.phone || order.user?.phone
      const customerName = order.customer?.name || order.user?.name

      if (!customerPhone) {
        toast.error('Nomor telepon customer tidak tersedia')
        return
      }

      if (!validateIndonesianPhone(customerPhone)) {
        toast.error('Format nomor telepon tidak valid')
        return
      }

      const message = generateCustomerPickupMessage(order)
      openWhatsApp(customerPhone, message)
      toast.success(`WhatsApp terbuka untuk notifikasi ke ${customerName}`)
    } catch (error) {
      console.error('Error opening WhatsApp:', error)
      toast.error('Gagal membuka WhatsApp')
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    const option = orderStatusOptions.find(opt => opt.value === status)
    return (
      <Badge className={option?.color}>
        {option?.label}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const option = paymentStatusOptions.find(opt => opt.value === status)
    return (
      <Badge className={option?.color}>
        {option?.label}
      </Badge>
    )
  }

  const handleClose = () => {
    setIsEditMode(false)
    onClose()
  }

  const handleEditToggle = () => {
    if (isEditMode) {
      // Reset values when canceling edit
      setOrderStatus(order.orderStatus as OrderStatus)
      setPaymentStatus(order.paymentStatus as PaymentStatus)
      setNotes(order.notes || '')
      setIsEditMode(false)
    } else {
      setIsEditMode(true)
    }
  }

  const refreshOrderData = () => {
    onUpdate()
    // Reset form values to match updated order
    if (order) {
      setOrderStatus(order.orderStatus as OrderStatus)
      setPaymentStatus(order.paymentStatus as PaymentStatus)
      setNotes(order.notes || '')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
              <Package className="h-6 w-6" />
              {isEditMode ? 'Edit Pesanan' : 'Detail Pesanan'} #{order.orderNumber}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <AdminOrderActions
                order={{
                  id: order.id,
                  orderNumber: order.orderNumber,
                  totalAmount: order.totalAmount,
                  orderStatus: order.orderStatus,
                  paymentStatus: order.paymentStatus
                }}
                onStatusChange={refreshOrderData}
              />
              {!isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditToggle}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Detail Pesanan
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Riwayat Status
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Customer Information */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                    <User className="h-4 w-4" />
                    Informasi Pelanggan
                  </CardTitle>
                  {/* WhatsApp notification button - show if customer has phone and order is ready */}
                  {(order.customer?.phone || order.user?.phone) && order.orderStatus === 'READY' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNotifyCustomer}
                      className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Notifikasi WhatsApp
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{order.customer.email}</span>
                </div>
                {order.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{order.customer.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                  <Package className="h-4 w-4" />
                  Informasi Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Status Pesanan</span>
                    {getStatusBadge(order.orderStatus as OrderStatus)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Status Pembayaran</span>
                    {getPaymentStatusBadge(order.paymentStatus as PaymentStatus)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                  <Package className="h-4 w-4" />
                  Item Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.bundle.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.bundle.store?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.quantity}x {formatPrice(item.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          = {formatPrice(item.quantity * item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                  <CreditCard className="h-4 w-4" />
                  Informasi Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Transfer Bank
                  </span>
                </div>
                {order.bank && (
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {order.bank.name} - {order.bank.accountNumber}
                    </span>
                  </div>
                )}
                {order.paymentProof && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewPaymentProof}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Lihat Bukti Pembayaran
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Edit Mode */}
            {isEditMode && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                    <Edit3 className="h-5 w-5" />
                    Edit Status Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orderStatus" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Status Pesanan
                      </Label>
                      <Select value={orderStatus} onValueChange={(value) => setOrderStatus(value as OrderStatus)}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentStatus" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Status Pembayaran
                      </Label>
                      <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Catatan Admin
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tambahkan catatan untuk pesanan ini..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <Separator />
                  <div className="flex gap-3 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={handleEditToggle}
                      className="flex items-center gap-2"
                    >
                      Batal
                    </Button>
                    <Button 
                      onClick={handleUpdateOrder} 
                      disabled={isUpdating}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4" />
                      {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* View Mode - Notes Display */}
            {!isEditMode && order.notes && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
                    <FileText className="h-5 w-5" />
                    Catatan Admin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{order.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <PaymentStatusHistory 
              orderId={order.id}
              className="border-0 shadow-none bg-transparent"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
