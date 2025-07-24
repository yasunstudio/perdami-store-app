import { useState } from 'react'
import { toast } from 'sonner'

interface UsePaymentStatusOptions {
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
}

export function usePaymentStatus({ onSuccess, onError }: UsePaymentStatusOptions = {}) {
  const [loading, setLoading] = useState(false)

  const markAsFailed = async (orderId: string, data: {
    reason: string
    adminNotes?: string
    refundRequired?: boolean
  }) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/orders/${orderId}/mark-failed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to mark payment as failed')
      }

      toast.success(result.message || 'Payment berhasil ditandai sebagai FAILED')
      onSuccess?.(result)
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      toast.error(errorMessage)
      onError?.(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const processRefund = async (orderId: string, data: {
    reason: string
    refundAmount: number
    refundMethod: 'BANK_TRANSFER'
    adminNotes?: string
    refundReference?: string
  }) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/orders/${orderId}/process-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process refund')
      }

      toast.success(result.message || 'Refund berhasil diproses')
      onSuccess?.(result)
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      toast.error(errorMessage)
      onError?.(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    markAsFailed,
    processRefund
  }
}
