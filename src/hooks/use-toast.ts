'use client'

import { toast as sonnerToast, ExternalToast } from 'sonner'

// Disable default Toaster creation by sonner
if (typeof window !== 'undefined') {
  // Override sonner's default toaster creation
  const originalToast = sonnerToast
  Object.defineProperty(window, 'sonnerToasterCreated', { value: true })
}

// Custom toast hook that ensures proper configuration
export const useToast = () => {
  return {
    success: (message: string, options?: ExternalToast) => sonnerToast.success(message, options),
    error: (message: string, options?: ExternalToast) => sonnerToast.error(message, options),
    info: (message: string, options?: ExternalToast) => sonnerToast.info(message, options),
    warning: (message: string, options?: ExternalToast) => sonnerToast.warning(message, options),
    loading: (message: string, options?: ExternalToast) => sonnerToast.loading(message, options),
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  }
}

// Export toast for direct usage (maintains same API)
export const toast = {
  success: (message: string, options?: ExternalToast) => sonnerToast.success(message, options),
  error: (message: string, options?: ExternalToast) => sonnerToast.error(message, options),
  info: (message: string, options?: ExternalToast) => sonnerToast.info(message, options),
  warning: (message: string, options?: ExternalToast) => sonnerToast.warning(message, options),
  loading: (message: string, options?: ExternalToast) => sonnerToast.loading(message, options),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
}
