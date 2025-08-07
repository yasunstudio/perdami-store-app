'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PaymentActions } from '@/components/shared/payment-actions'
import { PaymentProofUpload } from '@/components/shared/payment-proof-upload'
import { PaymentProofInfo } from '@/components/shared/payment-proof-info'
import { PaymentCountdown } from '@/components/shared/payment-countdown'
import { BankSelection } from '@/components/shared/bank-selection'
import { OrderProgressIndicator } from '@/components/shared/order-progress-indicator'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Package, 
  ArrowLeft,
  Copy,
  Download,
  Building2,
  AlertTriangle,
  Upload,
  Loader2,
  XCircle,
  InfoIcon,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { Order, OrderStatus, PaymentStatus } from '@/types'

interface OrderDetailPageProps {
  orderId: string
  status?: string
}

interface OrderWithDetails extends Order {
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    bundle: {
      id: string
      name: string
      image?: string | null
      contents?: Array<{
        name: string
        quantity: number
        price: number
      }> | null
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
    phone?: string
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

function getStatusMessage(orderStatus: OrderStatus, paymentStatus: PaymentStatus) {
  if (orderStatus === 'PENDING' && paymentStatus === 'PENDING') {
    return 'Pesanan Anda berhasil dibuat! Silakan lakukan pembayaran untuk melanjutkan proses pesanan.'
  }
  if (orderStatus === 'CONFIRMED' && paymentStatus === 'PAID') {
    return 'Pembayaran berhasil dikonfirmasi! Pesanan Anda sedang diproses.'
  }
  if (orderStatus === 'PROCESSING' && paymentStatus === 'PAID') {
    return 'Pesanan Anda sedang dalam proses persiapan.'
  }
  if (orderStatus === 'READY' && paymentStatus === 'PAID') {
    return 'Pesanan Anda sudah siap! Silakan ambil di lokasi yang telah ditentukan.'
  }
  if (orderStatus === 'COMPLETED') {
    return 'Pesanan selesai. Terima kasih atas kepercayaan Anda!'
  }
  if (orderStatus === 'CANCELLED') {
    return 'Pesanan dibatalkan.'
  }
  return 'Status pesanan telah diperbarui.'
}

export default function OrderDetailPage({ orderId, status }: OrderDetailPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | undefined>(undefined)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      
      if (!response.ok) {
        let errorMessage = 'Gagal memuat pesanan'
        
        try {
          const errorData = await response.json()
          
          if (response.status === 404) {
            errorMessage = 'Pesanan tidak ditemukan'
          } else if (response.status === 401) {
            errorMessage = 'Anda tidak memiliki akses ke pesanan ini'
          } else if (response.status === 403) {
            errorMessage = 'Akses ditolak'
          } else {
            errorMessage = errorData.error || `Server error: ${response.status}`
          }
        } catch {
          errorMessage = `Server error: ${response.status}`
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      if (!data.success || !data.order) {
        throw new Error('Format respons tidak valid')
      }
      
      setOrder(data.order)
    } catch (error) {
      console.error('Error fetching order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  // Initialize payment proof URL from order data
  useEffect(() => {
    if (order?.payment?.proofUrl) {
      setPaymentProofUrl(order.payment.proofUrl)
    }
  }, [order?.payment?.proofUrl])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Berhasil disalin ke clipboard!')
  }

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!order) return
    
    try {
      setIsCancelling(true)
      
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal membatalkan pesanan')
      }
      
      const data = await response.json()
      toast.success('Pesanan berhasil dibatalkan')
      
      // Update order data
      setOrder(data.order)
      setIsCancelDialogOpen(false)
      
      // Log to console
      console.log('Order cancelled:', data.order)
      
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal membatalkan pesanan')
    } finally {
      setIsCancelling(false)
    }
  }

  // Handle bank selection
  const handleBankSelected = (bank: any) => {
    if (order) {
      setOrder({
        ...order,
        bank: bank,
        bankId: bank.id
      })
    }
  }

  if (loading) {
    return (
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Pesanan Tidak Ditemukan
          </h1>
          <p className="text-muted-foreground mb-8">
            {error || 'Pesanan yang Anda cari tidak ditemukan.'}
          </p>
          <Button asChild>
            <Link href="/orders">
              Lihat Semua Pesanan
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Detail Pesanan</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
              Nomor Pesanan: {order.orderNumber}
            </p>
          </div>
          <Button variant="outline" asChild className="w-full sm:w-auto flex-shrink-0">
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Kembali ke Pesanan</span>
            </Link>
          </Button>
        </div>

        {/* Success Alert */}
        {status === 'success' && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <AlertDescription className="text-green-800 dark:text-green-400 text-sm">
              {getStatusMessage(order.orderStatus as OrderStatus, order.paymentStatus as PaymentStatus)}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Status Pesanan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Status Pesanan</p>
                    <Badge className={`${getStatusColor(order.orderStatus as OrderStatus)} text-xs sm:text-sm w-fit`}>
                      {getStatusText(order.orderStatus as OrderStatus)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Status Pembayaran</p>
                    <Badge className={`${getStatusColor(order.paymentStatus as PaymentStatus)} text-xs sm:text-sm w-fit`}>
                      {getStatusText(order.paymentStatus as PaymentStatus)}
                    </Badge>
                  </div>
                </div>

                {/* Pickup Date Information */}
                {order.pickupDate && (
                  <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Tanggal Pickup</span>
                    </div>
                    <p className="text-sm font-medium">
                      {new Date(order.pickupDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Jam operasional: 09:00 - 17:00 WIB di venue Perdami 2025
                    </p>
                  </div>
                )}
                
                {/* Order Progress Indicator */}
                <div className="mt-6">
                  <OrderProgressIndicator currentStatus={order.orderStatus as OrderStatus} />
                </div>
              </CardContent>
            </Card>

            {/* Payment Countdown */}
            <PaymentCountdown 
              order={order} 
              onRefresh={fetchOrder}
            />

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Item Pesanan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.orderItems.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.bundle?.image ? (
                            <img 
                              src={item.bundle.image} 
                              alt={item.bundle?.name || 'Bundle'}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="font-medium text-sm sm:text-base line-clamp-2 leading-tight">
                            {item.bundle?.name || 'Bundle name not available'}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.bundle?.store?.name || 'Store not available'}
                          </p>
                          
                          {/* Bundle Contents */}
                          {item.bundle?.contents && item.bundle.contents.length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Isi Bundle:
                              </p>
                              <div className="space-y-1">
                                {item.bundle.contents.map((content, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                                    <span>{content.name}</span>
                                    <span>{content.quantity}x</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-2">
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <span className="text-muted-foreground">Qty:</span>
                              <span className="font-medium">{item.quantity}</span>
                              <span className="text-muted-foreground">×</span>
                              <span className="font-medium">Rp {item.price.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="font-semibold text-sm sm:text-base">
                                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < order.orderItems.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Informasi Pembayaran</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Payment Method Header */}
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-blue-900 dark:text-blue-100">
                        Transfer Bank
                      </h3>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                        Lakukan transfer ke rekening berikut
                      </p>
                    </div>
                  </div>

                  {/* Show Bank Selection when bank is not selected */}
                  {!order.bank && order.orderStatus === 'PENDING' && order.payment && order.payment.status === 'PENDING' && (
                    <div className="space-y-4">
                      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                        <InfoIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                          Silakan pilih bank untuk melihat detail rekening tujuan transfer dan melanjutkan proses pembayaran.
                        </AlertDescription>
                      </Alert>
                      <BankSelection
                        orderId={order.id}
                        currentBankId={order.bankId}
                        onBankSelected={handleBankSelected}
                        disabled={order.orderStatus === 'CANCELLED' as any}
                      />
                    </div>
                  )}

                  {/* Bank Details - Professional Layout */}
                  {order.bank && (
                    <div className="space-y-4">
                      {/* Bank Information Card */}
                      <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
                        <div className="flex items-center gap-3 mb-3 sm:mb-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm sm:text-base">
                              {order.bank.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Bank Tujuan Transfer
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-1 sm:space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Nama Penerima
                            </label>
                            <div className="bg-background rounded-lg p-2 sm:p-3 border">
                              <p className="font-medium text-sm">
                                {order.bank.accountName}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-1 sm:space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              Kode Bank
                            </label>
                            <div className="bg-background rounded-lg p-2 sm:p-3 border">
                              <p className="font-mono font-medium text-sm">
                                {order.bank.code}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Account Number - Prominent Display */}
                      <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Nomor Rekening
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(order.bank!.accountNumber)}
                              className="h-6 w-6 p-0 hover:bg-muted"
                              title="Salin nomor rekening"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="bg-background rounded-lg p-3 sm:p-4 border border-dashed">
                            <p className="font-mono font-semibold text-base sm:text-lg text-center text-foreground break-all">
                              {order.bank.accountNumber}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            Tap untuk menyalin nomor rekening
                          </p>
                        </div>
                      </div>

                      {/* Transfer Amount - Prominent Display */}
                      <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                              Jumlah Transfer
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(order.totalAmount.toString())}
                              className="h-6 w-6 p-0 hover:bg-muted"
                              title="Salin jumlah transfer"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="bg-background rounded-lg p-3 sm:p-4 border border-dashed">
                            <p className="font-bold text-lg sm:text-xl text-center text-foreground">
                              Rp {order.totalAmount.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            Transfer dengan jumlah yang tepat sesuai nominal di atas
                          </p>
                        </div>
                      </div>

                      {/* Important Instructions */}
                      <Alert className="border-border bg-muted/50">
                        <InfoIcon className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-foreground text-sm">
                          <div className="space-y-2">
                            <p className="font-medium">Petunjuk Transfer:</p>
                            <ul className="text-xs space-y-1 ml-4 list-disc text-muted-foreground">
                              <li>Transfer dengan jumlah yang <strong>tepat sesuai nominal</strong> di atas</li>
                              <li>Gunakan <strong>nomor rekening</strong> yang tertera dengan benar</li>
                              <li>Simpan bukti transfer untuk diupload setelah transfer berhasil</li>
                              <li>Pembayaran akan diverifikasi dalam waktu 1x24 jam</li>
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                      {/* Payment Proof Upload Section */}
                      {order && order.payment && order.payment.status === 'PENDING' && order.orderStatus !== 'CANCELLED' && (
                        <div className="space-y-4">
                          {/* Upload Instructions */}
                          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg flex-shrink-0">
                                <Upload className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-foreground mb-2">
                                  Upload Bukti Transfer
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  Setelah melakukan transfer, silakan upload bukti transfer Anda di bawah ini. 
                                  Pastikan foto jelas dan mencakup semua informasi penting.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Upload Component */}
                          {!paymentProofUrl && (
                            <div className="space-y-4">
                              <PaymentProofInfo
                                hasProof={false}
                                bankName={order.bank?.name}
                                totalAmount={order.totalAmount}
                              />
                              <PaymentProofUpload
                                value={paymentProofUrl}
                                paymentId={order.payment?.id}
                                onChange={(url) => {
                                  setPaymentProofUrl(url)
                                  fetchOrder()
                                }}
                                disabled={!order.payment?.id}
                              />
                            </div>
                          )}
                          
                          {/* Uploaded Proof Display */}
                          {paymentProofUrl && (
                            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
                              <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-sm text-foreground">
                                      Bukti Transfer Berhasil Diupload
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      Terima kasih! Bukti transfer sedang diverifikasi oleh tim kami.
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Professional proof preview */}
                                <div className="bg-background rounded-lg p-3 border">
                                  <div className="flex items-start gap-3">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                      <img 
                                        src={paymentProofUrl} 
                                        alt="Bukti Transfer" 
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => window.open(paymentProofUrl, '_blank')}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <h5 className="font-medium text-sm text-foreground">
                                        Bukti Transfer - {order.bank?.name}
                                      </h5>
                                      <div className="space-y-1 text-xs text-muted-foreground">
                                        <p>Jumlah: Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                                        <p>Status: 🔄 Sedang Diverifikasi</p>
                                        <p>Estimasi: 1x24 jam</p>
                                      </div>
                                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => window.open(paymentProofUrl, '_blank')}
                                          className="text-xs h-7 w-full sm:w-auto"
                                        >
                                          Lihat Detail
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={() => setPaymentProofUrl(undefined)}
                                          className="text-xs h-7 w-full sm:w-auto text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/20"
                                        >
                                          Ganti File
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Next steps */}
                                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                                  <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
                                    <div className="space-y-1">
                                      <p className="font-medium">Langkah Selanjutnya:</p>
                                      <p>• Tim kami akan memverifikasi pembayaran Anda dalam 1x24 jam</p>
                                      <p>• Anda akan menerima notifikasi setelah pembayaran dikonfirmasi</p>
                                      <p>• Pesanan akan segera diproses setelah pembayaran terverifikasi</p>
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Verified Section - Show when payment is verified */}
                      {order && order.payment && order.payment.status === 'PAID' && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm text-green-900 dark:text-green-100">
                                Pembayaran Sudah Diverifikasi
                              </h4>
                              <p className="text-xs text-green-800 dark:text-green-200">
                                Terima kasih! Pembayaran Anda telah dikonfirmasi dan pesanan sedang diproses.
                              </p>
                            </div>
                          </div>
                          
                          {/* Show payment proof if available */}
                          {(order.payment?.proofUrl || paymentProofUrl) && (
                            <div className="mt-3 sm:mt-4 bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                              <div className="flex items-start gap-3">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                  <img 
                                    src={order.payment?.proofUrl || paymentProofUrl} 
                                    alt="Bukti Transfer" 
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(order.payment?.proofUrl || paymentProofUrl, '_blank')}
                                  />
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                  <h5 className="font-medium text-sm text-foreground">
                                    Bukti Transfer - {order.bank?.name}
                                  </h5>
                                  <div className="space-y-1 text-xs text-muted-foreground">
                                    <p>Jumlah: Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                                    <p>Status: ✅ Sudah Diverifikasi</p>
                                    <p>Tanggal Verifikasi: {order.payment?.updatedAt ? new Date(order.payment.updatedAt).toLocaleDateString('id-ID') : 'Baru saja'}</p>
                                  </div>
                                  <div className="pt-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => window.open(order.payment?.proofUrl || paymentProofUrl, '_blank')}
                                      className="text-xs h-7 w-full sm:w-auto"
                                    >
                                      Lihat Bukti Transfer
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-4">
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium break-words text-right">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total</span>
                    <span className="text-green-600 dark:text-green-400 break-words text-right">
                      Rp {order.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <h4 className="font-medium">Informasi Pemesan</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Nama:</p>
                      <p className="font-medium break-words text-sm">
                        {order.user?.name || 'Not available'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Email:</p>
                      <p className="font-medium break-all text-sm">
                        {order.user?.email || 'Not available'}
                      </p>
                    </div>
                    {order.user?.phone && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">HP:</p>
                        <p className="font-medium break-all text-sm">
                          {order.user.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {order.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <h4 className="font-medium">Catatan</h4>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-muted-foreground break-words text-sm leading-relaxed">
                          {order.notes}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 space-y-3">
                  <Button className="w-full" asChild>
                    <Link href="/orders">
                      Lihat Semua Pesanan
                    </Link>
                  </Button>
                  
                  {/* Show cancel button only if order is still in PENDING status and not paid yet */}
                  {order.orderStatus === 'PENDING' && order.paymentStatus === 'PENDING' && (
                    <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:border-red-800 dark:hover:bg-red-900/20"
                        >
                          <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Batalkan Pesanan</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-4 sm:mx-auto max-w-md">
                        <DialogHeader className="space-y-3">
                          <DialogTitle className="text-center text-base sm:text-lg">
                            Konfirmasi Pembatalan Pesanan
                          </DialogTitle>
                          <DialogDescription className="text-center text-sm">
                            Apakah Anda yakin ingin membatalkan pesanan ini?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4 dark:border-red-800 dark:bg-red-900/10">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="text-red-700 dark:text-red-300">
                                  Pembatalan pesanan bersifat <strong>permanen</strong> dan tidak dapat diubah kembali.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsCancelDialogOpen(false)}
                            disabled={isCancelling}
                            className="w-full sm:flex-1"
                          >
                            Kembali
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={handleCancelOrder}
                            disabled={isCancelling}
                            className="w-full sm:flex-1 gap-2"
                          >
                            {isCancelling ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                                <span className="truncate">Membatalkan...</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">Ya, Batalkan</span>
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}