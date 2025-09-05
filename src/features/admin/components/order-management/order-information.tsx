'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  CreditCard, 
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  Eye,
  Download,
  MessageCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { formatPrice } from '@/lib/utils'
import { generateCustomerPickupMessage, openWhatsApp, validateIndonesianPhone } from '@/lib/whatsapp'

interface OrderInformationProps {
  order: {
    id: string
    orderNumber: string
    subtotalAmount: number
    serviceFee: number
    totalAmount: number
    orderStatus: string
    paymentStatus: string
    paymentMethod: string
    paymentProof?: string
    pickupDate?: string | null
    notes?: string | null
    createdAt: string
    updatedAt: string
    user: {
      id: string
      name: string | null
      email: string
      phone?: string | null
    }
    bank?: {
      id: string
      name: string
      accountNumber: string
      accountName: string
    } | null
  }
  onOrderUpdate: () => void
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

export function OrderInformation({ order, onOrderUpdate }: OrderInformationProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [formData, setFormData] = useState({
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    notes: order.notes || ''
  })

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data when canceling
      setFormData({
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        notes: order.notes || ''
      })
    }
    setIsEditing(!isEditing)
  }

  // Handle WhatsApp notification to customer
  const handleNotifyCustomer = () => {
    try {
      const customerPhone = order.user?.phone
      const customerName = order.user?.name

      if (!customerPhone) {
        toast.error('Nomor telepon customer tidak tersedia')
        return
      }

      if (!validateIndonesianPhone(customerPhone)) {
        toast.error('Format nomor telepon tidak valid')
        return
      }

      // Convert order to format expected by generateCustomerPickupMessage
      const orderForWhatsApp = {
        ...order,
        orderItems: [], // Will be filled from items if needed
        user: {
          name: customerName,
          phone: customerPhone
        }
      }

      const message = generateCustomerPickupMessage(orderForWhatsApp)
      openWhatsApp(customerPhone, message)
      toast.success(`WhatsApp terbuka untuk notifikasi ke ${customerName}`)
    } catch (error) {
      console.error('Error opening WhatsApp:', error)
      toast.error('Gagal membuka WhatsApp')
    }
  }

  const handleSave = async () => {
    try {
      setIsUpdating(true)
      
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Gagal memperbarui order')
      }

      toast.success('Order berhasil diperbarui')
      setIsEditing(false)
      onOrderUpdate()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Gagal memperbarui order')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleViewPaymentProof = () => {
    if (order.paymentProof) {
      window.open(order.paymentProof, '_blank')
    }
  }

  const handleDownloadPaymentProof = async () => {
    if (order.paymentProof && !isDownloading) {
      setIsDownloading(true)
      try {
        // Determine file extension from URL or default to jpg
        let fileExtension = 'jpg'
        const url = order.paymentProof.toLowerCase()
        if (url.includes('.png')) fileExtension = 'png'
        else if (url.includes('.gif')) fileExtension = 'gif'
        else if (url.includes('.webp')) fileExtension = 'webp'
        else if (url.includes('.pdf')) fileExtension = 'pdf'
        else if (url.includes('.jpeg') || url.includes('.jpg')) fileExtension = 'jpg'

        const fileName = `payment-proof-${order.orderNumber}.${fileExtension}`

        // Method 1: Try direct download (for same-origin or CORS-enabled resources)
        try {
          const response = await fetch(order.paymentProof, {
            mode: 'cors',
            credentials: 'omit'
          })
          
          if (response.ok) {
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = fileName
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            
            // Clean up
            setTimeout(() => {
              if (document.body.contains(link)) {
                document.body.removeChild(link)
              }
              window.URL.revokeObjectURL(downloadUrl)
            }, 100)
            
            toast.success('Bukti pembayaran berhasil didownload')
            return
          }
        } catch (directError) {
          console.log('Direct download failed, trying proxy method...', directError)
        }

        // Method 2: Use proxy API for blob download
        try {
          const proxyUrl = `/api/admin/download-proof?url=${encodeURIComponent(order.paymentProof)}`
          
          const response = await fetch(proxyUrl)
          if (response.ok) {
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = fileName
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            
            // Clean up
            setTimeout(() => {
              if (document.body.contains(link)) {
                document.body.removeChild(link)
              }
              window.URL.revokeObjectURL(downloadUrl)
            }, 100)
            
            toast.success('Bukti pembayaran berhasil didownload')
            return
          }
        } catch (proxyError) {
          console.log('Proxy blob download failed, trying direct link method...', proxyError)
        }

        // Method 3: Direct link to download endpoint (let browser handle it)
        const downloadUrl = `/api/admin/download-image?url=${encodeURIComponent(order.paymentProof)}&filename=${encodeURIComponent(fileName)}`
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        
        // Clean up
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link)
          }
        }, 100)
        
        toast.success('Download dimulai...')
        
      } catch (error) {
        console.error('All download methods failed:', error)
        
        toast.error('Gagal mendownload bukti pembayaran. Membuka di tab baru...')
        
        // Final fallback: open in new tab
        setTimeout(() => {
          window.open(order.paymentProof, '_blank')
        }, 500)
      } finally {
        setIsDownloading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <User className="h-5 w-5" />
              Informasi Pelanggan
            </CardTitle>
            {/* WhatsApp notification button - show if customer has phone and order is ready */}
            {order.user?.phone && order.orderStatus === 'READY' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleNotifyCustomer}
                className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:border-green-700 dark:text-green-300"
              >
                <MessageCircle className="h-4 w-4" />
                Notifikasi WhatsApp
              </Button>
            )}
          </div>
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

      {/* Order Status Management */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <CreditCard className="h-5 w-5" />
              Manajemen Order
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditToggle}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4" />
                  Batal
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <div className="space-y-4">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPaymentProof}
                      disabled={isDownloading}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      {isDownloading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {order.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Catatan Admin</Label>
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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

              <div className="flex justify-end">
                <Button 
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Save className="h-4 w-4" />
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
