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
import { OrderPickupQR } from '@/components/qr/order-pickup-qr'
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
  Truck
} from 'lucide-react'
import Link from 'next/link'
import { Order, OrderStatus, PaymentStatus } from '@/types'
import { formatPrice } from '@/lib/utils'

interface OrderDetailPageProps {
  orderId: string
  status?: string
}

interface OrderWithDetails extends Order {
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | undefined>(undefined)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchOrder = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true)
        toast.loading('Memperbarui status pesanan...', { id: 'refresh-order' })
      }
      
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
      
      const previousStatus = order?.orderStatus
      const previousPaymentStatus = order?.paymentStatus
      
      setOrder(data.order)
      setLastUpdated(new Date())
      
      // Show notification for status changes
      if (isManualRefresh && order) {
        if (data.order.orderStatus !== previousStatus || data.order.paymentStatus !== previousPaymentStatus) {
          toast.success('Status pesanan berhasil diperbarui!', { id: 'refresh-order' })
        } else {
          toast.success('Status pesanan sudah terbaru', { id: 'refresh-order' })
        }
      }
      
      if (isManualRefresh) {
        toast.success('Status pesanan berhasil diperbarui')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      setError(errorMessage)
      
      if (isManualRefresh) {
        toast.error('Gagal memperbarui status: ' + errorMessage)
      }
    } finally {
      setLoading(false)
      if (isManualRefresh) {
        setIsRefreshing(false)
      }
    }
  }

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  // Auto-refresh for pending orders
  useEffect(() => {
    if (!autoRefreshEnabled || !order) return
    
    // Only auto-refresh for pending orders that need monitoring
    const shouldAutoRefresh = order.orderStatus === 'PENDING' || 
                             (order.paymentStatus === 'PENDING' && order.payment?.proofUrl)
    
    if (!shouldAutoRefresh) return

    const interval = setInterval(() => {
      fetchOrder()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [order, autoRefreshEnabled, orderId])

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

  // Parse bundle contents
  const parseBundleContents = (contents: any): Array<{name: string, quantity: number}> => {
    if (!contents) return []
    
    try {
      if (typeof contents === 'string') {
        return JSON.parse(contents)
      }
      return Array.isArray(contents) ? contents : []
    } catch (error) {
      console.error('Error parsing bundle contents:', error)
      return []
    }
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
          {/* Enhanced Loading Skeleton */}
          <div className="animate-pulse space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-48 mb-2"></div>
                <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded w-64"></div>
              </div>
              <div className="h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg w-full sm:w-40"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Skeleton */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status Overview Skeleton */}
                <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 space-y-4">
                  <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-40"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-24 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
                    <div className="h-24 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
                  </div>
                  <div className="h-20 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
                </div>

                {/* Items Skeleton */}
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 space-y-4">
                  <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-32"></div>
                  {[1, 2].map((item) => (
                    <div key={item} className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
                        <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="lg:col-span-1">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 space-y-4">
                  <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-32"></div>
                  <div className="h-48 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
                  <div className="h-32 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
                  <div className="h-24 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
                </div>
              </div>
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
    <div className="py-4 px-2 sm:py-6 sm:px-3 lg:py-8 lg:px-4 min-h-screen">
      <div className="container mx-auto max-w-6xl overflow-hidden w-full">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-foreground">Detail Pesanan</h1>
              {/* Live Status Indicator */}
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-muted-foreground">
                  {autoRefreshEnabled ? 'Live' : 'Manual'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <p className="text-xs sm:text-sm text-muted-foreground break-all sm:break-words">
                Nomor: <span className="font-medium">{order.orderNumber}</span>
              </p>
              <span className="hidden sm:block text-muted-foreground">•</span>
              <p className="text-xs text-muted-foreground">
                Update: {lastUpdated.toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 w-full sm:w-auto">
            {/* Auto-refresh Toggle */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className="flex items-center gap-1.5 px-2 min-w-0 h-8"
              title={autoRefreshEnabled ? 'Matikan pembaruan otomatis' : 'Aktifkan pembaruan otomatis'}
            >
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs">{autoRefreshEnabled ? 'Auto' : 'Manual'}</span>
            </Button>
            <Button variant="outline" asChild className="flex-1 sm:flex-none flex-shrink-0 px-2 sm:px-3 h-8">
              <Link href="/orders">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                <span className="truncate text-xs">Kembali</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Success Alert */}
        {status === 'success' && (
          <Alert className="mb-4 sm:mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <AlertDescription className="text-green-800 dark:text-green-400 text-sm font-medium pl-1">
              {getStatusMessage(order.orderStatus as OrderStatus, order.paymentStatus as PaymentStatus)}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6 min-w-0">
            {/* Unified Order Overview */}
            <Card className="bg-gradient-to-br from-primary/5 via-blue-50/50 to-violet-50/50 dark:from-primary/10 dark:via-blue-900/20 dark:to-violet-900/20 border-primary/20">
              <CardHeader className="pb-2 sm:pb-3 lg:pb-4 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-primary/10 rounded-lg flex-shrink-0">
                      <Clock className="h-3 w-3 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-primary" />
                    </div>
                    <span className="truncate text-xs sm:text-sm lg:text-base">Overview Pesanan</span>
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => fetchOrder(true)}
                    disabled={loading}
                    className="h-6 sm:h-7 lg:h-8 px-1.5 sm:px-2 gap-1 hover:bg-primary/5 flex-shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    <span className="text-xs hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                {/* Status Grid */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {/* Order Status */}
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-xl">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Status Pesanan
                        </p>
                        <Badge className={`${getStatusColor(order.orderStatus as OrderStatus)} text-xs mt-1`}>
                          {getStatusText(order.orderStatus as OrderStatus)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Status */}
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Status Pembayaran
                        </p>
                        <Badge className={`${getStatusColor(order.paymentStatus as PaymentStatus)} text-xs mt-1`}>
                          {getStatusText(order.paymentStatus as PaymentStatus)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pickup Date Information */}
                {order.pickupDate && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200/50 dark:border-green-800/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Jadwal Pickup
                        </p>
                        <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                          {new Date(order.pickupDate).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          📍 Venue Perdami 2025 • ⏰ 09:00 - 17:00 WIB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Enhanced Order Progress Indicator */}
                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Progress Pesanan</span>
                  </div>
                  <OrderProgressIndicator currentStatus={order.orderStatus as OrderStatus} />
                </div>
              </CardContent>
            </Card>

            {/* Payment Countdown */}
            <PaymentCountdown 
              order={order} 
              onRefresh={fetchOrder}
            />

            {/* Payment Verification Status - Show when proof is uploaded but not verified yet */}
            {order.orderStatus === 'PENDING' && 
             order.paymentStatus === 'PENDING' && 
             order.payment && 
             order.payment.proofUrl && (
              <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-900/10">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                            Bukti Pembayaran Berhasil Diupload
                          </h3>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Menunggu verifikasi admin
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-xs">
                        Diproses
                      </Badge>
                    </div>

                    {/* Verification Info */}
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                        <strong>Terima kasih!</strong> Bukti pembayaran Anda sudah kami terima. 
                        Tim kami akan memverifikasi pembayaran dalam waktu <strong>1x24 jam</strong> pada hari kerja.
                      </AlertDescription>
                    </Alert>

                    {/* Verification Timeline */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                      <h4 className="font-medium text-xs mb-2 text-blue-900 dark:text-blue-100">
                        Timeline Verifikasi:
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-green-700 dark:text-green-400">
                            Bukti pembayaran diupload
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {order.payment.createdAt ? new Date(order.payment.createdAt).toLocaleString('id-ID') : 'Baru saja'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="text-blue-700 dark:text-blue-400">
                            Verifikasi oleh admin
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            Dalam proses
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-muted-foreground">
                            Konfirmasi pembayaran
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            Menunggu
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Refresh Button */}
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchOrder(true)}
                        disabled={isRefreshing}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20 text-xs"
                      >
                        {isRefreshing ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            Memperbarui...
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Refresh Status
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4 flex-shrink-0 text-primary" />
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
                        <div className="flex-1 min-w-0 space-y-2">
                          <h4 className="font-medium text-sm line-clamp-2 leading-tight">
                            {item.bundle?.name || 'Bundle name not available'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {item.bundle?.store?.name || 'Store not available'}
                          </p>
                          
                          {/* Enhanced Bundle Contents */}
                          {item.bundle?.contents && (
                            <div className="mt-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
                                  <Package className="h-2.5 w-2.5 text-primary" />
                                </div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                  Isi Bundle
                                </p>
                              </div>
                              <div className="grid gap-2">
                                {(() => {
                                  try {
                                    // Parse JSON contents or handle array
                                    const contents = typeof item.bundle.contents === 'string' 
                                      ? JSON.parse(item.bundle.contents) 
                                      : item.bundle.contents;
                                    
                                    if (Array.isArray(contents)) {
                                      return contents.map((content: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center py-1.5 px-2 bg-white/60 dark:bg-slate-900/60 rounded border border-slate-200/50 dark:border-slate-600/50">
                                          <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                              {content.name || content.item || content}
                                            </span>
                                          </div>
                                          {content.quantity && (
                                            <Badge variant="secondary" className="text-xs h-5 px-2">
                                              {content.quantity}x
                                            </Badge>
                                          )}
                                        </div>
                                      ));
                                    } else {
                                      // Handle object format
                                      return Object.entries(contents).map(([key, value]: [string, any], idx: number) => (
                                        <div key={idx} className="flex justify-between items-center py-1.5 px-2 bg-white/60 dark:bg-slate-900/60 rounded border border-slate-200/50 dark:border-slate-600/50">
                                          <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                              {key}
                                            </span>
                                          </div>
                                          <Badge variant="secondary" className="text-xs h-5 px-2">
                                            {value}x
                                          </Badge>
                                        </div>
                                      ));
                                    }
                                  } catch (error) {
                                    // Fallback for invalid JSON
                                    return (
                                      <div className="py-1.5 px-2 bg-white/60 dark:bg-slate-900/60 rounded border border-slate-200/50 dark:border-slate-600/50">
                                        <span className="text-xs text-slate-600 dark:text-slate-400">
                                          {String(item.bundle.contents)}
                                        </span>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Qty:</span>
                              <span className="font-medium">{item.quantity}</span>
                              <span className="text-muted-foreground">×</span>
                              <span className="font-medium">Rp {item.unitPrice?.toLocaleString('id-ID') || '0'}</span>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="font-semibold text-sm">
                                Rp {item.totalPrice?.toLocaleString('id-ID') || '0'}
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
                  <CreditCard className="h-4 w-4 flex-shrink-0 text-primary" />
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
                      <h3 className="font-medium text-sm text-blue-900 dark:text-blue-100">
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
                        <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
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
                      <div className="bg-muted/50 rounded-lg p-2 sm:p-3 lg:p-4 border">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 lg:mb-4">
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-lg">
                            <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-xs sm:text-sm">
                              {order.bank.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Bank Tujuan Transfer
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Nama Penerima
                            </label>
                            <div className="bg-background rounded-lg p-2 sm:p-3 border">
                              <p className="font-medium text-xs sm:text-sm break-all">
                                {order.bank.accountName}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Kode Bank
                            </label>
                            <div className="bg-background rounded-lg p-2 sm:p-3 border">
                              <p className="font-mono font-medium text-xs sm:text-sm">
                                {order.bank.code}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Account Number - Prominent Display */}
                      <div className="bg-muted/50 rounded-lg p-2 sm:p-3 lg:p-4 border">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              Nomor Rekening
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(order.bank!.accountNumber)}
                              className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-muted"
                              title="Salin nomor rekening"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="bg-background rounded-lg p-2 sm:p-3 lg:p-4 border border-dashed">
                            <p className="font-mono font-medium text-xs sm:text-sm text-center text-foreground break-all">
                              {order.bank.accountNumber}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            Tap untuk menyalin nomor rekening
                          </p>
                        </div>
                      </div>

                      {/* Transfer Amount - Prominent Display */}
                      <div className="bg-muted/50 rounded-lg p-2 sm:p-3 lg:p-4 border">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              Jumlah Transfer
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(order.totalAmount.toString())}
                              className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-muted"
                              title="Salin jumlah transfer"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="bg-background rounded-lg p-2 sm:p-3 lg:p-4 border border-dashed">
                            <p className="font-semibold text-sm sm:text-base text-center text-foreground break-all">
                              Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
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
                                        <p>Jumlah: Rp {(order.totalAmount || 0).toLocaleString('id-ID')}</p>
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
                                    <p>Jumlah: Rp {(order.totalAmount || 0).toLocaleString('id-ID')}</p>
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

          {/* Enhanced Order Summary */}
          <div className="lg:col-span-1 min-w-0">
            <Card className="lg:sticky lg:top-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-3 lg:pb-4 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm lg:text-base truncate">Ringkasan Pesanan</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {order.orderNumber.slice(-6).toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 lg:space-y-6 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                {/* Payment Breakdown */}
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 rounded-lg p-2 sm:p-3 lg:p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2">
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="truncate">Rincian Pembayaran</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs gap-2">
                        <span className="text-muted-foreground">Subtotal Items</span>
                        <span className="font-medium text-right">Rp {order.subtotalAmount?.toLocaleString('id-ID') || '0'}</span>
                      </div>
                      <div className="flex justify-between text-xs items-start gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-muted-foreground">Ongkos Kirim</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {(() => {
                              // Hitung jumlah toko unik dari order items
                              const uniqueStores = new Set(
                                order.orderItems
                                  .filter(item => item.bundle?.store?.id)
                                  .map(item => item.bundle!.store!.id)
                              );
                              const storeCount = uniqueStores.size;
                              
                              if (storeCount === 1) {
                                return `1 toko`;
                              } else if (storeCount > 1) {
                                return `${storeCount} toko`;
                              } else {
                                return 'Biaya pengiriman';
                              }
                            })()}
                          </span>
                        </div>
                        <span className="font-medium text-xs">Rp {order.serviceFee?.toLocaleString('id-ID') || '0'}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm">Total Pembayaran</span>
                        <div className="text-right min-w-0">
                          <div className="font-bold text-sm sm:text-base lg:text-lg text-primary break-all">
                            Rp {order.totalAmount?.toLocaleString('id-ID') || '0'}
                          </div>
                          <Badge 
                            variant={order.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                            className="text-xs mt-1"
                          >
                            {order.paymentStatus === 'PAID' ? '✓ Lunas' : 'Belum Lunas'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Shipping Information */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                      <Truck className="h-4 w-4" />
                      Informasi Ongkos Kirim
                    </h4>
                    {(() => {
                      // Hitung informasi toko dan ongkos kirim
                      const storeItemsMap = new Map();
                      
                      order.orderItems.forEach(item => {
                        if (item.bundle?.store) {
                          const storeId = item.bundle.store.id;
                          const storeName = item.bundle.store.name;
                          
                          if (!storeItemsMap.has(storeId)) {
                            storeItemsMap.set(storeId, {
                              name: storeName,
                              items: []
                            });
                          }
                          
                          storeItemsMap.get(storeId).items.push({
                            name: item.bundle.name,
                            quantity: item.quantity
                          });
                        }
                      });
                      
                      const uniqueStores = Array.from(storeItemsMap.entries());
                      const storeCount = uniqueStores.length;
                      const feePerStore = order.serviceFee && storeCount > 0 ? Math.round(order.serviceFee / storeCount) : 0;
                      
                      return (
                        <div className="space-y-3">
                          <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-700/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                                Total Ongkos Kirim
                              </span>
                              <span className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                                Rp {order.serviceFee?.toLocaleString('id-ID') || '0'}
                              </span>
                            </div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400">
                              {storeCount === 1 
                                ? `Pengiriman dari 1 toko` 
                                : `Pengiriman dari ${storeCount} toko berbeda`
                              }
                            </div>
                          </div>
                          
                          {storeCount > 1 && (
                            <div className="space-y-2">
                              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                                Rincian per toko:
                              </div>
                              {uniqueStores.map(([storeId, storeData], index) => (
                                <div key={storeId} className="bg-white/60 dark:bg-slate-900/60 rounded-lg p-2 border border-emerald-200/30 dark:border-emerald-700/30">
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-emerald-900 dark:text-emerald-100 truncate">
                                        {storeData.name}
                                      </div>
                                      <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                        {storeData.items.length} item{storeData.items.length > 1 ? 's' : ''}
                                      </div>
                                    </div>
                                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                      Rp {feePerStore.toLocaleString('id-ID')}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20">
                            <InfoIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <AlertDescription className="text-emerald-800 dark:text-emerald-200 text-xs">
                              <strong>Catatan:</strong> Ongkos kirim dihitung berdasarkan jumlah toko yang berbeda dalam pesanan Anda.
                              {storeCount > 1 && ` Setiap toko dikenakan biaya pengiriman sebesar Rp ${feePerStore.toLocaleString('id-ID')}.`}
                            </AlertDescription>
                          </Alert>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Payment Instructions - Only show if not paid */}
                  {order.paymentStatus === 'PENDING' && order.bank && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <Building2 className="h-4 w-4" />
                        Transfer ke {order.bank.name}
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                          <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Nomor Rekening</div>
                          <div className="flex items-center justify-between">
                            <code className="font-mono font-semibold text-sm text-blue-900 dark:text-blue-100">
                              {order.bank.accountNumber}
                            </code>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(order.bank!.accountNumber)}
                              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-800"
                              title="Salin nomor rekening"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                          <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Atas Nama</div>
                          <div className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                            {order.bank.accountName}
                          </div>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                          <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Jumlah Transfer Exact</div>
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-base text-blue-900 dark:text-blue-100">
                              Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(order.totalAmount.toString())}
                              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-800"
                              title="Salin jumlah transfer"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Alert className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                        <InfoIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                          <strong>Penting:</strong> Transfer dengan nominal yang tepat untuk mempercepat verifikasi.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>

                {/* Order Activity Timeline */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Timeline Pesanan
                  </h4>
                  <div className="space-y-3">
                    {/* Dynamic timeline based on order status */}
                    {(() => {
                      const activities = [];
                      
                      // Order created
                      activities.push({
                        title: "Pesanan Dibuat",
                        time: new Date(order.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }),
                        status: "completed",
                        icon: Package
                      });

                      // Payment pending
                      if (order.orderStatus !== 'CANCELLED') {
                        activities.push({
                          title: "Menunggu Pembayaran",
                          time: order.paymentStatus === 'PAID' ? "Selesai" : "Berlangsung",
                          status: order.paymentStatus === 'PAID' ? "completed" : "current",
                          icon: CreditCard
                        });
                      }

                      // Payment verified
                      if (order.paymentStatus === 'PAID') {
                        activities.push({
                          title: "Pembayaran Dikonfirmasi",
                          time: order.payment?.updatedAt ? new Date(order.payment.updatedAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : "Baru saja",
                          status: "completed",
                          icon: CheckCircle
                        });
                      }

                      // Order processing
                      if (['CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED'].includes(order.orderStatus)) {
                        activities.push({
                          title: "Pesanan Diproses",
                          time: order.orderStatus === 'CONFIRMED' ? "Berlangsung" : "Selesai",
                          status: order.orderStatus === 'CONFIRMED' ? "current" : "completed",
                          icon: Clock
                        });
                      }

                      // Ready for pickup
                      if (['READY', 'COMPLETED'].includes(order.orderStatus)) {
                        activities.push({
                          title: "Siap Diambil",
                          time: order.pickupDate ? new Date(order.pickupDate).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short'
                          }) : "Menunggu jadwal",
                          status: order.orderStatus === 'READY' ? "current" : "completed",
                          icon: Calendar
                        });
                      }

                      // Completed
                      if (order.orderStatus === 'COMPLETED') {
                        activities.push({
                          title: "Pesanan Selesai",
                          time: "Sudah diambil",
                          status: "completed",
                          icon: CheckCircle
                        });
                      }

                      // Cancelled
                      if (order.orderStatus === 'CANCELLED') {
                        activities.push({
                          title: "Pesanan Dibatalkan",
                          time: new Date(order.updatedAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }),
                          status: "cancelled",
                          icon: XCircle
                        });
                      }

                      return activities.map((activity, index) => {
                        const IconComponent = activity.icon;
                        const isLast = index === activities.length - 1;
                        
                        return (
                          <div key={index} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`
                                flex items-center justify-center w-8 h-8 rounded-full border-2
                                ${activity.status === 'completed' 
                                  ? 'bg-green-100 border-green-500 text-green-600 dark:bg-green-900/30 dark:border-green-400 dark:text-green-400' 
                                  : activity.status === 'current'
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : activity.status === 'cancelled'
                                  ? 'bg-red-100 border-red-500 text-red-600 dark:bg-red-900/30 dark:border-red-400 dark:text-red-400'
                                  : 'bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-600'
                                }
                              `}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              {!isLast && (
                                <div className={`
                                  w-0.5 h-6 mt-1
                                  ${activity.status === 'completed' 
                                    ? 'bg-green-300 dark:bg-green-600' 
                                    : 'bg-slate-200 dark:bg-slate-700'
                                  }
                                `} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pb-4">
                              <div className="flex justify-between items-start">
                                <h5 className={`
                                  font-medium text-sm
                                  ${activity.status === 'completed' 
                                    ? 'text-green-900 dark:text-green-100' 
                                    : activity.status === 'current'
                                    ? 'text-primary'
                                    : activity.status === 'cancelled'
                                    ? 'text-red-900 dark:text-red-100'
                                    : 'text-slate-600 dark:text-slate-400'
                                  }
                                `}>
                                  {activity.title}
                                </h5>
                                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                  {activity.time}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
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

                {/* QR Code for Pickup */}
                <Separator />
                <OrderPickupQR 
                  orderId={order.id}
                  orderStatus={order.orderStatus}
                  pickupStatus={order.pickupStatus}
                />

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