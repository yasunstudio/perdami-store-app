'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, RefreshCw, Loader2, AlertTriangle, InfoIcon } from 'lucide-react'
import Link from 'next/link'
import { OrderStatus, PaymentStatus } from '@/types'

// Import modular components
import { InvoiceActions } from './components/invoice-actions'
import { OrderOverview } from './components/order-overview'
import { OrderItems } from './components/order-items'
import { useOrderOperations } from './hooks/use-order-operations'

interface OrderDetailPageProps {
  orderId: string
}

interface ParsedBundleContent {
  product: {
    name: string
  }
  quantity: number
}

export default function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const router = useRouter()
  
  // Use modular hook for order operations
  const { 
    order, 
    isLoading, 
    isRefreshing, 
    error, 
    refreshOrder
  } = useOrderOperations(orderId)

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

  // Status utility functions
  const getStatusColor = (status: OrderStatus): string => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      READY: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
    return statusColors[status] || statusColors.PENDING
  }

  const getStatusText = (status: OrderStatus): string => {
    const statusTexts = {
      PENDING: 'Menunggu Pembayaran',
      CONFIRMED: 'Dikonfirmasi',
      PROCESSING: 'Diproses',
      READY: 'Siap Diambil',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan'
    }
    return statusTexts[status] || 'Unknown'
  }

  const getPaymentStatusColor = (status: PaymentStatus): string => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
    return statusColors[status as keyof typeof statusColors] || statusColors.PENDING
  }

  const getPaymentStatusText = (status: PaymentStatus): string => {
    const statusTexts = {
      PENDING: 'Menunggu Pembayaran',
      PAID: 'Sudah Dibayar',
      REFUNDED: 'Dikembalikan',
      FAILED: 'Pembayaran Gagal',
      EXPIRED: 'Pembayaran Kedaluwarsa'
    }
    return statusTexts[status as keyof typeof statusTexts] || 'Unknown'
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
              Detail Pesanan #{order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola dan pantau status pesanan Anda
            </p>
          </div>
        </div>
        
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

      {/* Invoice Actions */}
      <InvoiceActions 
        order={order}
        isVisible={order.paymentStatus === 'PAID' || order.orderStatus === 'COMPLETED'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Overview */}
          <OrderOverview 
            order={order}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
            getPaymentStatusColor={getPaymentStatusColor}
            getPaymentStatusText={getPaymentStatusText}
          />

          {/* Order Items */}
          <OrderItems 
            order={order}
            parseBundleContents={parseBundleContents}
          />
        </div>

        {/* Payment Sidebar */}
        <div className="space-y-6">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">Status Pembayaran</h3>
            <p className="text-sm text-muted-foreground">
              {getPaymentStatusText(order.paymentStatus as PaymentStatus)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
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
              Detail Pesanan #{order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola dan pantau status pesanan Anda
            </p>
          </div>
        </div>
        
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

      {/* Invoice Actions */}
      <InvoiceActions 
        order={order}
        isVisible={order.paymentStatus === 'PAID' || order.orderStatus === 'COMPLETED'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Overview */}
          <OrderOverview 
            order={order}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
            getPaymentStatusColor={getPaymentStatusColor}
            getPaymentStatusText={getPaymentStatusText}
          />

          {/* Progress Indicator */}
          <OrderProgressIndicator currentStatus={order.orderStatus as OrderStatus} />

          {/* Order Items */}
          <OrderItems 
            order={order}
            parseBundleContents={parseBundleContents}
          />
        </div>

        {/* Payment Sidebar */}
        <div className="space-y-6">
          {/* Payment Information */}
          {order.orderStatus === 'PENDING' && order.payment && order.payment.status === 'PENDING' && (
            <>
              <PaymentCountdown
                createdAt={order.createdAt}
                paymentWindow={24} // 24 hours
                onExpired={() => refreshOrder()}
              />

              {!order.bank && (
                <BankSelection
                  onBankSelected={setSelectedBank}
                  orderId={order.id}
                  disabled={order.orderStatus === 'CANCELLED'}
                />
              )}

              {(order.bank || selectedBank) && (
                <PaymentActions
                  bank={order.bank || selectedBank!}
                  totalAmount={order.totalAmount}
                  orderNumber={order.orderNumber}
                  onCopyAccountNumber={copyToClipboard}
                  onCopyAmount={copyToClipboard}
                />
              )}

              {order.bank && order.payment && order.payment.status === 'PENDING' && order.orderStatus !== 'CANCELLED' && (
                <PaymentProofUpload
                  orderId={order.id}
                  onUploadSuccess={refreshOrder}
                />
              )}
            </>
          )}

          {/* Payment Proof Info */}
          {order.payment?.paymentProof && (
            <PaymentProofInfo 
              paymentProof={order.payment.paymentProof}
              paymentStatus={order.payment.status}
            />
          )}

          {/* Cancel Order */}
          {order.orderStatus === 'PENDING' && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                Batalkan Pesanan
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                Pesanan hanya dapat dibatalkan sebelum pembayaran dikonfirmasi.
              </p>
              <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    Batalkan Pesanan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Konfirmasi Pembatalan</DialogTitle>
                    <DialogDescription>
                      Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCancelDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        cancelOrder()
                        setIsCancelDialogOpen(false)
                      }}
                    >
                      Ya, Batalkan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
