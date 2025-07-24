// Payment hooks - centralized payment state management
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { OrderWithPayment, PaymentStatusInfo } from '@/lib/utils/payment.utils'
import { getPaymentStatusInfo, formatPaymentAmount } from '@/lib/utils/payment.utils'

interface UsePaymentActionsOptions {
  order: OrderWithPayment
  onSuccess?: () => void
  onError?: (error: string) => void
}

export interface PaymentActions {
  uploadPaymentProof: (file: File) => Promise<boolean>
  cancelOrder: () => Promise<boolean>
  retryPayment: () => Promise<boolean>
  isLoading: boolean
  uploadingProof: boolean
  cancelling: boolean
  retrying: boolean
}

/**
 * Hook for payment actions (upload proof, cancel, retry)
 */
export function usePaymentActions({ order, onSuccess, onError }: UsePaymentActionsOptions): PaymentActions {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const router = useRouter()

  const uploadPaymentProof = useCallback(async (file: File): Promise<boolean> => {
    if (!order.payment?.id) {
      toast.error('Payment ID tidak ditemukan')
      return false
    }

    setUploadingProof(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('paymentId', order.payment.id)

      const response = await fetch('/api/payments/upload-proof', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengupload bukti pembayaran')
      }

      toast.success('Bukti pembayaran berhasil diupload')
      onSuccess?.()
      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload bukti pembayaran'
      toast.error(errorMessage)
      onError?.(errorMessage)
      return false
    } finally {
      setUploadingProof(false)
    }
  }, [order.payment?.id, onSuccess, onError])

  const cancelOrder = useCallback(async (): Promise<boolean> => {
    setCancelling(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membatalkan pesanan')
      }

      toast.success('Pesanan berhasil dibatalkan')
      onSuccess?.()
      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal membatalkan pesanan'
      toast.error(errorMessage)
      onError?.(errorMessage)
      return false
    } finally {
      setCancelling(false)
    }
  }, [order.id, onSuccess, onError])

  const retryPayment = useCallback(async (): Promise<boolean> => {
    setRetrying(true)
    try {
      // Redirect to payment page
      router.push(`/checkout/payment/${order.id}`)
      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal melakukan retry pembayaran'
      toast.error(errorMessage)
      onError?.(errorMessage)
      return false
    } finally {
      setRetrying(false)
    }
  }, [order.id, router, onError])

  useEffect(() => {
    setIsLoading(uploadingProof || cancelling || retrying)
  }, [uploadingProof, cancelling, retrying])

  return {
    uploadPaymentProof,
    cancelOrder,
    retryPayment,
    isLoading,
    uploadingProof,
    cancelling,
    retrying
  }
}

/**
 * Hook for payment status monitoring
 */
export function usePaymentStatus(order: OrderWithPayment) {
  const [paymentInfo, setPaymentInfo] = useState<PaymentStatusInfo>(() => 
    getPaymentStatusInfo(order)
  )

  useEffect(() => {
    setPaymentInfo(getPaymentStatusInfo(order))
  }, [order])

  return paymentInfo
}

/**
 * Hook for payment polling (real-time updates)
 */
export function usePaymentPolling(orderId: string, enabled: boolean = true) {
  const [order, setOrder] = useState<OrderWithPayment | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPaymentStatus = useCallback(async () => {
    if (!enabled || !orderId) return

    try {
      setIsPolling(true)
      const response = await fetch(`/api/orders/${orderId}/payment-status`)
      
      if (!response.ok) {
        throw new Error('Gagal memuat status pembayaran')
      }

      const data = await response.json()
      setOrder(data.order)
      setError(null)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memuat status pembayaran'
      setError(errorMessage)
      console.error('Payment polling error:', error)
    } finally {
      setIsPolling(false)
    }
  }, [orderId, enabled])

  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchPaymentStatus()

    // Setup polling interval (every 30 seconds)
    const interval = setInterval(fetchPaymentStatus, 30000)

    return () => clearInterval(interval)
  }, [fetchPaymentStatus, enabled])

  return {
    order,
    isPolling,
    error,
    refetch: fetchPaymentStatus
  }
}

/**
 * Hook for payment form validation
 */
export function usePaymentValidation(order: OrderWithPayment) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validatePaymentProof = useCallback((file: File | null): boolean => {
    const newErrors: Record<string, string> = {}

    if (!file) {
      newErrors.file = 'Bukti pembayaran wajib diupload'
    } else {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        newErrors.file = 'File harus berupa gambar'
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        newErrors.file = 'Ukuran file maksimal 5MB'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [])

  const validatePaymentAmount = useCallback((amount: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (amount <= 0) {
      newErrors.amount = 'Jumlah pembayaran harus lebih besar dari 0'
    } else if (amount !== order.totalAmount) {
      newErrors.amount = `Jumlah pembayaran harus ${formatPaymentAmount(order.totalAmount)}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [order.totalAmount])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    errors,
    validatePaymentProof,
    validatePaymentAmount,
    clearErrors
  }
}
