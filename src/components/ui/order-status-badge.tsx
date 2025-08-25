'use client'

import { cn } from '@/lib/utils'

interface OrderStatusBadgeProps {
  status: string
  type?: 'order' | 'payment'
  className?: string
}

export function OrderStatusBadge({ status, type = 'order', className }: OrderStatusBadgeProps) {
  const getStatusStyles = () => {
    if (type === 'order') {
      switch (status) {
        case 'PENDING':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
        case 'CONFIRMED':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500'
        case 'PROCESSING':
          return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-500'
        case 'READY':
          return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500'
        case 'COMPLETED':
          return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
        case 'CANCELLED':
          return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500'
      }
    } else {
      switch (status) {
        case 'PENDING':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
        case 'PAID':
          return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
        case 'FAILED':
          return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
        case 'REFUNDED':
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500'
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500'
      }
    }
  }

  const getStatusLabel = () => {
    if (type === 'order') {
      switch (status) {
        case 'PENDING': return 'Pending'
        case 'CONFIRMED': return 'Dikonfirmasi'
        case 'PROCESSING': return 'Diproses'
        case 'READY': return 'Siap Diambil'
        case 'COMPLETED': return 'Selesai'
        case 'CANCELLED': return 'Dibatalkan'
        default: return status
      }
    } else {
      switch (status) {
        case 'PENDING': return 'Pending'
        case 'PAID': return 'Dibayar'
        case 'FAILED': return 'Gagal'
        case 'REFUNDED': return 'Dikembalikan'
        default: return status
      }
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        getStatusStyles(),
        className
      )}
    >
      {getStatusLabel()}
    </span>
  )
}
