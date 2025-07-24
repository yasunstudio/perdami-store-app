'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface StoreStats {
  totalStores: number
  totalBundles: number
  activeStores: number
  topStoresByBundles: any[]
}

export function StoresStats() {
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stores/stats')
      const result = await response.json()
      
      if (response.ok) {
        setStats(result)
        setError(null)
      } else {
        setError(result.error || 'Gagal mengambil statistik toko')
      }
    } catch (error) {
      console.error('Error fetching store stats:', error)
      setError('Terjadi kesalahan saat mengambil statistik toko')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg shadow-md p-6 text-center border">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-lg shadow-md p-6 text-center border">
          <h3 className="text-2xl font-bold text-red-600">-</h3>
          <p className="text-muted-foreground">Total Toko</p>
        </div>
        <div className="bg-card rounded-lg shadow-md p-6 text-center border">
          <h3 className="text-2xl font-bold text-red-600">-</h3>
          <p className="text-muted-foreground">Total Bundle Produk</p>
        </div>
        <div className="bg-card rounded-lg shadow-md p-6 text-center border">
          <h3 className="text-2xl font-bold text-red-600">-</h3>
          <p className="text-muted-foreground">Toko Aktif</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-card rounded-lg shadow-md p-6 text-center border">
        <h3 className="text-2xl font-bold text-blue-600">{stats?.totalStores || 0}</h3>
        <p className="text-muted-foreground">Total Toko</p>
      </div>
      <div className="bg-card rounded-lg shadow-md p-6 text-center border">
        <h3 className="text-2xl font-bold text-green-600">{stats?.totalBundles || 0}</h3>
        <p className="text-muted-foreground">Total Bundle Produk</p>
      </div>
      <div className="bg-card rounded-lg shadow-md p-6 text-center border">
        <h3 className="text-2xl font-bold text-purple-600">{stats?.activeStores || 0}</h3>
        <p className="text-muted-foreground">Toko Aktif</p>
      </div>
    </div>
  )
}
