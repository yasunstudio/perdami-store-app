'use client'

import { useState, useEffect } from 'react'
import { 
  StoresPageHeader, 
  StoresStats, 
  StoresGrid 
} from './components'
import { type StoreWithCounts as Store } from '@/types'

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStores = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/stores')
        if (!response.ok) {
          throw new Error('Failed to fetch stores')
        }
        const storesData = await response.json()
        if (storesData.success) {
          setStores(storesData.data)
        }
      } catch (error) {
        console.error('Error loading stores:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStores()
  }, [])



  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <StoresPageHeader />
        <StoresStats />
        <StoresGrid stores={stores} isLoading={isLoading} />
      </div>
    </div>
  )
}
