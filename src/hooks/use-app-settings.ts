'use client'

import { useState, useEffect } from 'react'

export interface AppSettings {
  id: string
  appName: string
  appDescription: string
  appLogo?: string
  businessAddress: string
  pickupLocation: string
  pickupCity: string
  eventName: string
  eventYear: string
  copyrightText: string
  copyrightSubtext: string
  isMaintenanceMode: boolean
  maintenanceMessage?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch app settings'}`)
      }
      
      const data = await response.json()
      
      // Ensure data is an object
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format: expected object')
      }
      
      setSettings(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error fetching app settings:', err)
      
      // Set default settings as fallback
      setSettings({
        id: 'default',
        appName: 'Perdami Store',
        appDescription: 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025. Nikmati kemudahan berbelanja online dan ambil langsung di venue event.',
        appLogo: '/images/logo.png',
        businessAddress: 'Venue PIT PERDAMI 2025, Bandung, Jawa Barat',
        pickupLocation: 'Venue PIT PERDAMI 2025',
        pickupCity: 'Bandung, Jawa Barat',
        eventName: 'PIT PERDAMI 2025',
        eventYear: '2025',
        copyrightText: '© 2025 Perdami Store. Dibuat khusus untuk PIT PERDAMI 2025.',
        copyrightSubtext: 'Semua hak cipta dilindungi.',
        isMaintenanceMode: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
  }
}
