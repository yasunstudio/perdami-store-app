'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ZustandErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    console.error('Zustand Store Error:', error, errorInfo)
    
    // Clear potentially corrupted localStorage data
    if (error.message.includes('State loaded from storage') || 
        error.message.includes('migrate function')) {
      
      console.log('Clearing corrupted Zustand store data...')
      
      // Clear specific Zustand storage keys
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('cart-storage') || 
        key.includes('perdami') || 
        key.includes('zustand')
      )
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log('Removed corrupted key:', key)
      })
      
      // Reload the page to reinitialize with fresh state
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md border">
            <h2 className="text-xl font-bold text-foreground mb-4">
              🔧 Sedang Memperbaiki...
            </h2>
            <p className="text-muted-foreground mb-4">
              Aplikasi sedang membersihkan data lama. Halaman akan dimuat ulang secara otomatis.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
