'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Building2,
  AlertTriangle,
  Upload,
  Loader2,
  XCircle,
  InfoIcon,
  Calendar,
  RefreshCw,
  TrendingUp,
  Truck,
  Printer,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { OrderStatus, PaymentStatus } from '@/types'
import { formatPrice } from '@/lib/utils'

// Import modular components and utilities
import { InvoiceActions } from './components/invoice-actions'
import { useOrderOperations } from './hooks/use-order-operations'

interface OrderDetailPageProps {
  orderId: string
}

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

interface ParsedBundleContent {
  product: {
    name: string
  }
  quantity: number
}

interface OrderWithDetails {
  id: string
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  totalAmount: number
  serviceFee: number
  finalAmount: number
  createdAt: string
  updatedAt: string
  notes?: string
  customerName: string
  customerPhone: string
  estimatedReadyTime?: string
  paymentProof?: string | null
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    bundle: {
      id: string
      name: string
      image?: string | null
      contents?: string | null
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
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
  }
}

function getStatusText(status: OrderStatus) {
  switch (status) {
    case 'PENDING': return 'Menunggu Pembayaran'
    case 'CONFIRMED': return 'Dikonfirmasi'
    case 'PROCESSING': return 'Diproses'
    case 'READY': return 'Siap Diambil'
    case 'COMPLETED': return 'Selesai'
    case 'CANCELLED': return 'Dibatalkan'
    default: return status
  }
}

function getPaymentStatusText(status: PaymentStatus) {
  switch (status) {
    case 'PENDING': return 'Menunggu Pembayaran'
    case 'PAID': return 'Sudah Dibayar'
    case 'FAILED': return 'Pembayaran Gagal'
    case 'REFUNDED': return 'Dikembalikan'
    default: return status
  }
}

export default function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const router = useRouter()
  
  // Use modular hook for order operations
  const { 
    order, 
    isLoading, 
    isRefreshing, 
    error, 
    refreshOrder,
    cancelOrder,
    updatePaymentProof
  } = useOrderOperations(orderId)

  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  // Utility functions
  const parseBundleContents = (contents: string): ParsedBundleContent[] => {
    try {
      const parsed = JSON.parse(contents)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Error parsing bundle contents:', error)
      return []
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      import('sonner').then(({ toast }) => {
        toast.success('Berhasil disalin ke clipboard')
      })
    }).catch(() => {
      import('sonner').then(({ toast }) => {
        toast.error('Gagal menyalin ke clipboard')
      })
    })
  }

  const getStatusMessage = (orderStatus: OrderStatus, paymentStatus: PaymentStatus): { 
    message: string; 
    type: 'info' | 'warning' | 'success' | 'error' 
  } => {
    if (orderStatus === 'CANCELLED') {
      return { 
        message: 'Pesanan ini telah dibatalkan.', 
        type: 'error' 
      }
    }

    if (paymentStatus === 'FAILED') {
      return { 
        message: 'Pembayaran gagal. Silakan lakukan pembayaran ulang atau hubungi customer service.', 
        type: 'error' 
      }
    }

    if (paymentStatus === 'PENDING') {
      return { 
        message: 'Menunggu konfirmasi pembayaran. Pastikan Anda telah melakukan transfer sesuai instruksi.', 
        type: 'info' 
      }
    }

    if (paymentStatus === 'PAID') {
      switch (orderStatus) {
        case 'CONFIRMED':
          return { 
            message: 'Pembayaran berhasil! Pesanan sedang diproses.', 
            type: 'success' 
          }
        case 'PROCESSING':
          return { 
            message: 'Pesanan sedang diproses. Estimasi selesai dalam 30-60 menit.', 
            type: 'info' 
          }
        case 'READY':
          return { 
            message: 'Pesanan siap diambil! Silakan datang ke toko untuk mengambil pesanan.', 
            type: 'success' 
          }
        case 'COMPLETED':
          return { 
            message: 'Pesanan telah selesai. Terima kasih atas kepercayaan Anda!', 
            type: 'success' 
          }
        default:
          return { 
            message: 'Pembayaran berhasil dikonfirmasi.', 
            type: 'success' 
          }
      }
    }

    return { 
      message: 'Status pesanan akan diperbarui secara otomatis.', 
      type: 'info' 
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Memuat detail pesanan...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Terjadi Kesalahan</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/orders')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Daftar Pesanan
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <InfoIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Pesanan Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-4">Pesanan yang Anda cari tidak dapat ditemukan.</p>
            <Button onClick={() => router.push('/orders')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Daftar Pesanan
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const statusMessage = getStatusMessage(order.orderStatus as OrderStatus, order.paymentStatus as PaymentStatus)
  const typedOrder = order as any // Flexible typing for compatibility

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Detail Pesanan #{typedOrder.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola dan pantau status pesanan Anda
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={refreshOrder} 
            variant="outline" 
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Memuat...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      <Alert className={`mb-6 ${
        statusMessage.type === 'error' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
        statusMessage.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
        statusMessage.type === 'success' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' :
        'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
      }`}>
        <AlertDescription className={
          statusMessage.type === 'error' ? 'text-red-800 dark:text-red-200' :
          statusMessage.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
          statusMessage.type === 'success' ? 'text-green-800 dark:text-green-200' :
          'text-blue-800 dark:text-blue-200'
        }>
          {statusMessage.message}
        </AlertDescription>
      </Alert>

      {/* Progress Indicator */}
      <div className="mb-6">
        <OrderProgressIndicator 
          currentStatus={typedOrder.orderStatus as OrderStatus}
        />
      </div>

      {/* Invoice Actions */}
      <InvoiceActions 
        order={typedOrder}
        isVisible={typedOrder.paymentStatus === 'PAID' || typedOrder.orderStatus === 'COMPLETED'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ringkasan Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium">#{typedOrder.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(typedOrder.createdAt).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(typedOrder.orderStatus as OrderStatus)}>
                    {getStatusText(typedOrder.orderStatus as OrderStatus)}
                  </Badge>
                  <Badge className={getStatusColor(typedOrder.paymentStatus as PaymentStatus)}>
                    {getPaymentStatusText(typedOrder.paymentStatus as PaymentStatus)}
                  </Badge>
                </div>
              </div>

              {typedOrder.customerName && (
                <div className="pt-2 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Nama Pelanggan</p>
                      <p className="text-sm text-muted-foreground">{typedOrder.customerName}</p>
                    </div>
                    {typedOrder.customerPhone && (
                      <div>
                        <p className="text-sm font-medium">No. Telepon</p>
                        <p className="text-sm text-muted-foreground">{typedOrder.customerPhone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {typedOrder.estimatedReadyTime && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">Estimasi Selesai</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      {new Date(typedOrder.estimatedReadyTime).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {typedOrder.notes && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <p className="text-sm font-medium mb-1">Catatan</p>
                  <p className="text-sm text-muted-foreground">{typedOrder.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {typedOrder.orderItems?.map((item: any, index: number) => {
                  const bundleContents = item.bundle.contents ? parseBundleContents(item.bundle.contents) : []
                  
                  return (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {item.bundle.image && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                            <img 
                              src={item.bundle.image} 
                              alt={item.bundle.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-base">{item.bundle.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Toko: {item.bundle.store.name}
                              </p>
                              
                              {bundleContents.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-2">Isi bundle:</p>
                                  <div className="space-y-1">
                                    {bundleContents.map((content, idx) => (
                                      <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                                        <span>• {content.product.name}</span>
                                        <span>{content.quantity}x</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @ {formatPrice(item.unitPrice)}
                              </p>
                              <p className="font-medium">
                                {formatPrice(item.totalPrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator className="my-4" />
              
              {/* Price Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(typedOrder.totalAmount)}</span>
                </div>
                {typedOrder.serviceFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Biaya Layanan</span>
                    <span>{formatPrice(typedOrder.serviceFee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(typedOrder.finalAmount || typedOrder.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment & Actions */}
        <div className="space-y-6">
          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Status Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Badge className={`${getStatusColor(typedOrder.paymentStatus as PaymentStatus)} text-sm px-3 py-1`}>
                  {getPaymentStatusText(typedOrder.paymentStatus as PaymentStatus)}
                </Badge>
                
                {typedOrder.paymentStatus === 'PENDING' && (
                  <div className="mt-4 space-y-4">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                        Menunggu konfirmasi pembayaran
                      </p>
                    </div>
                    
                    {typedOrder.bank && (
                      <div className="text-left space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Transfer ke rekening:
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Bank:</span>
                              <span className="text-sm font-medium">{typedOrder.bank.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">No. Rekening:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono">{typedOrder.bank.accountNumber}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(typedOrder.bank!.accountNumber)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Atas Nama:</span>
                              <span className="text-sm font-medium">{typedOrder.bank.accountName}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-sm font-medium">Jumlah Transfer:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                  {formatPrice(typedOrder.finalAmount || typedOrder.totalAmount)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard((typedOrder.finalAmount || typedOrder.totalAmount).toString())}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                        <p className="text-sm text-center">
                          Upload bukti pembayaran setelah transfer
                        </p>
                        <Button className="w-full mt-2" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Bukti Pembayaran
                        </Button>
                      </div>
                      
                      {typedOrder.paymentProof && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-800 dark:text-green-200 text-center">
                            Bukti pembayaran telah diupload
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {typedOrder.paymentProof && typedOrder.paymentStatus === 'PAID' && (
                  <div className="mt-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200 text-center">
                        Pembayaran telah dikonfirmasi
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Actions */}
          {typedOrder.paymentStatus === 'PENDING' && typedOrder.orderStatus !== 'CANCELLED' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Aksi Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <XCircle className="h-4 w-4 mr-2" />
                      Batalkan Pesanan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Batalkan Pesanan</DialogTitle>
                      <DialogDescription>
                        Apakah Anda yakin ingin membatalkan pesanan #{typedOrder.orderNumber}? 
                        Tindakan ini tidak dapat dibatalkan.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={async () => {
                          await cancelOrder()
                          setIsCancelDialogOpen(false)
                        }}
                      >
                        Ya, Batalkan
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
