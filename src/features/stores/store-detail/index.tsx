'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, MapPin, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BundleCard } from '@/components/shared/bundle-card'
import { toast } from 'sonner'

interface Store {
  id: string
  name: string
  description: string | null
  image: string | null
  address: string | null
  city: string | null
  province: string | null
  isActive: boolean
}

interface Bundle {
  id: string
  name: string
  description: string | null
  image: string | null
  price: number
  contents: any
  isActive: boolean
  isFeatured: boolean
  showToCustomer: boolean
  storeId: string
  createdAt?: string
  updatedAt?: string
  store: {
    id: string
    name: string
  }
}

interface StoreDetailProps {
  storeId: string
}

export default function StoreDetail({ storeId }: StoreDetailProps) {
  const router = useRouter()
  
  const [store, setStore] = useState<Store | null>(null)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStoreData()
  }, [storeId])

  const loadStoreData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stores/${storeId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load store data')
      }

      const data = await response.json()
      setStore(data)
      setBundles(data.bundles || [])
    } catch (error) {
      console.error('Error loading store:', error)
      toast.error('Gagal memuat data toko')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8 px-4">
        <div className="container mx-auto">
          <div className="text-center py-8">
            <div className="text-lg">Memuat data toko...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="py-8 px-4">
        <div className="container mx-auto">
          <div className="text-center py-8">
            <div className="text-lg">Toko tidak ditemukan</div>
            <Button onClick={() => router.back()} className="mt-4">
              Kembali
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const activeBundles = bundles.filter(bundle => bundle.isActive && bundle.showToCustomer)

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4 -ml-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        {/* Store Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Store Image */}
              <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={store.image || '/images/products/placeholder.jpg'}
                  alt={store.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Store Info */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {store.name}
                  </h1>
                  {store.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {store.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>
                    {store.address ? `${store.address}, ` : ''}
                    {store.city ? `${store.city}` : 'Lokasi tidak tersedia'}
                    {store.province ? `, ${store.province}` : ''}
                  </span>
                </div>

                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Package className="h-4 w-4 mr-2" />
                  <span>{activeBundles.length} bundle tersedia</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bundles Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Bundle Tersedia</h2>
          
          {activeBundles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Belum ada bundle
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Toko ini belum memiliki bundle yang tersedia
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {activeBundles.map((bundle) => (
                <BundleCard 
                  key={bundle.id} 
                  bundle={{
                    id: bundle.id,
                    name: bundle.name,
                    description: bundle.description,
                    image: bundle.image,
                    price: bundle.price,
                    contents: bundle.contents,
                    isActive: bundle.isActive,
                    isFeatured: bundle.isFeatured,
                    showToCustomer: bundle.showToCustomer,
                    storeId: bundle.storeId,
                    createdAt: new Date(bundle.createdAt || Date.now()),
                    updatedAt: new Date(bundle.updatedAt || Date.now()),
                    store: {
                      id: bundle.store.id,
                      name: bundle.store.name
                    }
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}