'use client'

import { OrderStatus } from '@/types'
import { 
  ShoppingCart, // Order placed
  CheckCircle2, // Confirmed
  Package2, // Processing
  PackageCheck, // Ready
  Star, // Completed
  XCircle // Cancelled
} from 'lucide-react'

interface OrderProgressIndicatorProps {
  currentStatus: OrderStatus
  compact?: boolean // For list view vs detail view
}

export function OrderProgressIndicator({ currentStatus, compact = false }: OrderProgressIndicatorProps) {
  // Define the order steps
  const steps = [
    { 
      status: 'PENDING' as OrderStatus, 
      label: 'Pesanan Dibuat',
      icon: ShoppingCart 
    },
    { 
      status: 'CONFIRMED' as OrderStatus, 
      label: 'Dikonfirmasi',
      icon: CheckCircle2
    },
    { 
      status: 'PROCESSING' as OrderStatus, 
      label: 'Diproses',
      icon: Package2
    },
    { 
      status: 'READY' as OrderStatus, 
      label: 'Siap Diambil',
      icon: PackageCheck
    },
    { 
      status: 'COMPLETED' as OrderStatus, 
      label: 'Selesai',
      icon: Star
    }
  ]
  
  // Find the current step index
  const currentStepIndex = steps.findIndex(step => step.status === currentStatus)
  
  // Special case for cancelled orders
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-center">
        <XCircle className="h-6 w-6 mx-auto text-red-500" />
        <p className="text-sm font-medium text-red-700 dark:text-red-400 mt-2">
          Pesanan Dibatalkan
        </p>
      </div>
    )
  }
  
  return (
    <div className={`w-full ${compact ? 'py-2' : 'py-4'}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          // Determine if step is completed, current, or upcoming
          const isCompleted = currentStepIndex > index
          const isCurrent = currentStepIndex === index
          const isUpcoming = currentStepIndex < index
          
          // Determine the appearance based on step status
          let iconClass = `h-${compact ? '4' : '6'} w-${compact ? '4' : '6'}`
          let textClass = `text-${compact ? 'xxs' : 'xs'} mt-1`
          let lineClass = 'h-1 flex-1'
          
          if (isCompleted) {
            iconClass += ' text-green-500'
            textClass += ' text-green-700 dark:text-green-400'
            lineClass += ' bg-green-500'
          } else if (isCurrent) {
            iconClass += ' text-blue-500'
            textClass += ' text-blue-700 dark:text-blue-400 font-medium'
            lineClass += ' bg-gray-300 dark:bg-gray-700'
          } else {
            iconClass += ' text-gray-400 dark:text-gray-500'
            textClass += ' text-gray-400 dark:text-gray-500'
            lineClass += ' bg-gray-300 dark:bg-gray-700'
          }
          
          const Icon = step.icon
          
          return (
            <div key={step.status} className={`flex flex-col items-center ${compact ? 'flex-1' : 'flex-1'}`}>
              <div className="flex items-center w-full">
                {/* Display connector line before icons (except first) */}
                {index > 0 && (
                  <div className={lineClass}></div>
                )}
                
                {/* Icon circle */}
                <div className={`
                  flex-shrink-0 rounded-full ${compact ? 'p-1' : 'p-2'} border-2
                  ${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 
                    isCurrent ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 
                    'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'}
                `}>
                  <Icon className={iconClass} />
                </div>
                
                {/* Display connector line after icons (except last) */}
                {index < steps.length - 1 && (
                  <div className={lineClass}></div>
                )}
              </div>
              
              {/* Only show labels in non-compact mode or optionally in compact mode */}
              {(!compact || (compact && isCurrent)) && (
                <span className={`${textClass} text-center ${compact ? 'text-[10px]' : ''} mt-1`}>
                  {step.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
