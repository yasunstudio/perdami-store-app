import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface UseAuthWithErrorHandlingOptions {
  required?: boolean
  redirectTo?: string
  onError?: (error: any) => void
}

export function useAuthWithErrorHandling(options: UseAuthWithErrorHandlingOptions = {}) {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Handle NextAuth fetch errors
    const handleAuthError = (event: any) => {
      if (event.detail?.error || event.detail?.message) {
        console.error('🚨 NextAuth Client Error:', event.detail)
        
        // Check if it's the specific JSON parse error
        if (event.detail.message?.includes('Unexpected token')) {
          console.log('🔄 Attempting to recover from auth error...')
          
          // Clear potentially corrupted session data
          localStorage.removeItem('next-auth.session-token')
          sessionStorage.clear()
          
          // Show user-friendly message
          toast.error('Session expired. Please refresh the page.', {
            id: 'auth-error',
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload()
            }
          })
          
          if (options.onError) {
            options.onError(event.detail)
          }
          
          return
        }
        
        // For other auth errors
        toast.error('Authentication error occurred. Please try again.')
      }
    }

    // Listen for NextAuth errors
    window.addEventListener('nextauth:error', handleAuthError)
    
    return () => {
      window.removeEventListener('nextauth:error', handleAuthError)
    }
  }, [options.onError])

  // Handle loading and authentication states
  useEffect(() => {
    if (status === 'loading') return

    if (options.required && status === 'unauthenticated') {
      const redirectUrl = options.redirectTo || '/auth/login'
      router.push(redirectUrl)
    }
  }, [status, options.required, options.redirectTo, router])

  // Provide session refresh function
  const refreshSession = async () => {
    try {
      await update()
      toast.success('Session refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh session:', error)
      toast.error('Failed to refresh session')
    }
  }

  return {
    session,
    status,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
    unauthenticated: status === 'unauthenticated',
    refreshSession,
    update
  }
}

// Error boundary component for NextAuth errors
export function NextAuthErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('Unexpected token') && event.message?.includes('<!DOCTYPE')) {
        event.preventDefault()
        console.error('🚨 NextAuth JSON parse error intercepted:', event.message)
        
        toast.error('Authentication service temporarily unavailable. Please refresh the page.', {
          id: 'nextauth-error',
          duration: 10000,
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload()
          }
        })
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  return children
}
