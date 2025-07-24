// Payment utility functions - centralized payment logic
import type { Order, Payment, PaymentStatus, PaymentMethod } from '@prisma/client'

export type OrderWithPayment = Order & {
  payment?: Payment | null
  user?: any
  orderItems?: any[]
  bank?: any
}

export interface PaymentStatusInfo {
  status: PaymentStatus
  method: PaymentMethod | null
  proofUrl: string | null
  canPay: boolean
  canCancel: boolean
  canRefund: boolean
  isPending: boolean
  isPaid: boolean
  isFailed: boolean
  isRefunded: boolean
}

/**
 * Get payment status information from order
 */
export function getPaymentStatusInfo(order: OrderWithPayment): PaymentStatusInfo {
  const payment = order.payment
  
  if (!payment) {
    return {
      status: 'PENDING',
      method: null,
      proofUrl: null,
      canPay: false,
      canCancel: false,
      canRefund: false,
      isPending: true,
      isPaid: false,
      isFailed: false,
      isRefunded: false
    }
  }

  const isPending = payment.status === 'PENDING'
  const isPaid = payment.status === 'PAID'
  const isFailed = payment.status === 'FAILED'
  const isRefunded = payment.status === 'REFUNDED'

  return {
    status: payment.status,
    method: payment.method,
    proofUrl: payment.proofUrl,
    canPay: isPending && order.orderStatus !== 'CANCELLED',
    canCancel: isPending && order.orderStatus === 'PENDING',
    canRefund: isPaid && order.orderStatus !== 'CANCELLED',
    isPending,
    isPaid,
    isFailed,
    isRefunded
  }
}

/**
 * Get payment status text for display
 */
export function getPaymentStatusText(status: PaymentStatus): string {
  const statusMap: Record<PaymentStatus, string> = {
    PENDING: 'Menunggu Pembayaran',
    PAID: 'Sudah Bayar',
    FAILED: 'Gagal',
    REFUNDED: 'Dikembalikan'
  }
  return statusMap[status] || status
}

/**
 * Get payment status color for badges
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colorMap: Record<PaymentStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PAID: 'bg-green-100 text-green-800 border-green-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
    REFUNDED: 'bg-blue-100 text-blue-800 border-blue-200'
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Get payment method text for display
 */
export function getPaymentMethodText(method: PaymentMethod | null): string {
  if (!method) return 'Belum ditentukan'
  
  const methodMap: Record<PaymentMethod, string> = {
    BANK_TRANSFER: 'Transfer Bank'
  }
  return methodMap[method] || method
}

/**
 * Get combined order and payment status message
 */
export function getOrderStatusMessage(order: OrderWithPayment): string {
  const paymentInfo = getPaymentStatusInfo(order)
  const orderStatus = order.orderStatus
  
  if (orderStatus === 'CANCELLED') {
    if (paymentInfo.isPaid) {
      return 'Pesanan dibatalkan. Pembayaran akan dikembalikan.'
    }
    return 'Pesanan dibatalkan.'
  }
  
  if (orderStatus === 'PENDING') {
    if (paymentInfo.isPending) {
      return 'Menunggu pembayaran untuk memproses pesanan.'
    }
    if (paymentInfo.isPaid) {
      return 'Pembayaran diterima. Pesanan akan segera diproses.'
    }
    if (paymentInfo.isFailed) {
      return 'Pembayaran gagal. Silakan coba lagi.'
    }
  }
  
  if (orderStatus === 'CONFIRMED' || orderStatus === 'PROCESSING') {
    return 'Pesanan sedang diproses.'
  }
  
  if (orderStatus === 'READY') {
    return 'Pesanan siap diambil.'
  }
  
  if (orderStatus === 'COMPLETED') {
    return 'Pesanan selesai.'
  }
  
  return 'Status pesanan tidak diketahui.'
}

/**
 * Check if order can be cancelled by customer
 */
export function canCustomerCancelOrder(order: OrderWithPayment): boolean {
  const paymentInfo = getPaymentStatusInfo(order)
  return (
    order.orderStatus === 'PENDING' &&
    paymentInfo.isPending &&
    paymentInfo.canCancel
  )
}

/**
 * Check if payment proof can be uploaded
 */
export function canUploadPaymentProof(order: OrderWithPayment): boolean {
  const paymentInfo = getPaymentStatusInfo(order)
  return (
    order.orderStatus !== 'CANCELLED' &&
    paymentInfo.isPending &&
    paymentInfo.method === 'BANK_TRANSFER'
  )
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(order: OrderWithPayment, amount: number): boolean {
  return amount > 0 && amount === order.totalAmount
}

/**
 * Format payment amount for display
 */
export function formatPaymentAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

/**
 * Get payment deadline (example: 24 hours from order creation)
 */
export function getPaymentDeadline(order: OrderWithPayment): Date {
  const deadline = new Date(order.createdAt)
  deadline.setHours(deadline.getHours() + 24)
  return deadline
}

/**
 * Check if payment is overdue
 */
export function isPaymentOverdue(order: OrderWithPayment): boolean {
  const paymentInfo = getPaymentStatusInfo(order)
  if (!paymentInfo.isPending) return false
  
  const deadline = getPaymentDeadline(order)
  return new Date() > deadline
}

/**
 * Get time remaining for payment
 */
export function getPaymentTimeRemaining(order: OrderWithPayment): string {
  const deadline = getPaymentDeadline(order)
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  
  if (diff <= 0) return 'Kadaluarsa'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours} jam ${minutes} menit`
  }
  return `${minutes} menit`
}

/**
 * Get pickup method display text
 */
export function getPickupMethodText(method: string | null): string {
  if (!method) return 'Belum ditentukan'
  
  const methodMap: Record<string, string> = {
    VENUE: 'Venue PIT PERDAMI 2025'
  }
  return methodMap[method] || method
}
