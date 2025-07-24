import { Clock, CheckCircle, AlertCircle, Package } from 'lucide-react'

export const statusConfig = {
  order: {
    PENDING: { 
      label: 'Menunggu', 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800', 
      icon: Clock 
    },
    CONFIRMED: { 
      label: 'Dikonfirmasi', 
      color: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800', 
      icon: CheckCircle 
    },
    PROCESSING: { 
      label: 'Diproses', 
      color: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800', 
      icon: Package 
    },
    READY: { 
      label: 'Siap', 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-800', 
      icon: CheckCircle 
    },
    COMPLETED: { 
      label: 'Selesai', 
      color: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800', 
      icon: CheckCircle 
    },
    CANCELLED: { 
      label: 'Dibatalkan', 
      color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800', 
      icon: AlertCircle 
    }
  },
  payment: {
    PENDING: { 
      label: 'Menunggu', 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800', 
      icon: Clock 
    },
    PAID: { 
      label: 'Dibayar', 
      color: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800', 
      icon: CheckCircle 
    },
    FAILED: { 
      label: 'Gagal', 
      color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800', 
      icon: AlertCircle 
    },
    REFUNDED: { 
      label: 'Dikembalikan', 
      color: 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-700', 
      icon: AlertCircle 
    }
  }
}
