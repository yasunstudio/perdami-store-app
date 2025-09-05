import { useState, useEffect } from 'react'
import type { MaintenanceStatus } from '@/lib/maintenance'

export function useMaintenanceStatus() {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/maintenance/status')
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance status')
      }
      
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      console.error('Error fetching maintenance status:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return {
    status,
    loading,
    error,
    refetch: fetchStatus
  }
}
