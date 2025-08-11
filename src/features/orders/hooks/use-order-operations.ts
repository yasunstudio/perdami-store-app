'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export interface OrderWithDetails {
  id: string
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  subtotalAmount: number
  serviceFee: number
  totalAmount: number
  createdAt: string | Date
  user?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    bundle: {
      id: string
      name: string
      imageUrl?: string
      contents: string
      store: {
        id: string
        name: string
      }
    }
  }>
  payment?: {
    id: string
    status: string
    amount: number
  }
  bank?: {
    id: string
    bankName: string
    accountNumber: string
    accountHolder: string
  }
}

export function useOrderOperations(orderId: string) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const { data: session } = useSession()

  const fetchOrder = useCallback(async (showLoadingToast = false) => {
    try {
      if (showLoadingToast) {
        toast.loading('Memuat data pesanan...', { id: 'fetch-order' })
      }
      
      const response = await fetch(`/api/orders/${orderId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Pesanan tidak ditemukan')
        }
        throw new Error('Gagal memuat data pesanan')
      }

      const data = await response.json()
      setOrder(data.order)
      setError(null)
      
      if (showLoadingToast) {
        toast.success('Data pesanan berhasil dimuat', { id: 'fetch-order' })
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      setError(errorMessage)
      
      if (showLoadingToast) {
        toast.error(errorMessage, { id: 'fetch-order' })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [orderId])

  const refreshOrder = useCallback(async () => {
    setIsRefreshing(true)
    await fetchOrder(true)
  }, [fetchOrder])

  const cancelOrder = useCallback(async () => {
    if (!order) return

    try {
      toast.loading('Membatalkan pesanan...', { id: 'cancel-order' })
      
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Gagal membatalkan pesanan')
      }

      await refreshOrder()
      toast.success('Pesanan berhasil dibatalkan', { id: 'cancel-order' })
      
    } catch (error) {
      console.error('Error canceling order:', error)
      toast.error('Gagal membatalkan pesanan', { id: 'cancel-order' })
    }
  }, [order, orderId, refreshOrder])

  const updatePaymentProof = useCallback(async (file: File) => {
    if (!order) return

    try {
      toast.loading('Mengunggah bukti pembayaran...', { id: 'upload-proof' })
      
      const formData = new FormData()
      formData.append('paymentProof', file)
      
      const response = await fetch(`/api/orders/${orderId}/payment-proof`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Gagal mengunggah bukti pembayaran')
      }

      await refreshOrder()
      toast.success('Bukti pembayaran berhasil diunggah', { id: 'upload-proof' })
      
    } catch (error) {
      console.error('Error uploading payment proof:', error)
      toast.error('Gagal mengunggah bukti pembayaran', { id: 'upload-proof' })
    }
  }, [order, orderId, refreshOrder])

  // Auto-refresh for pending orders
  useEffect(() => {
    fetchOrder()
    
    if (!order) return

    const shouldAutoRefresh = order.orderStatus === 'PENDING' || 
                            order.paymentStatus === 'PENDING'
    
    if (shouldAutoRefresh) {
      const interval = setInterval(() => {
        fetchOrder()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [fetchOrder, order])

  return {
    order,
    isLoading,
    isRefreshing,
    error,
    refreshOrder,
    cancelOrder,
    updatePaymentProof,
  }
}
