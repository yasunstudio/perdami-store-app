'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, MapPin, Package } from "lucide-react"
import { type StoreWithCounts } from '@/types'

interface FeaturedStore {
  id: string
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  bundleCount: number
}

export function FeaturedStoresSection() {
  const [stores, setStores] = useState<FeaturedStore[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedStores = async () => {
      try {
        setIsLoading(true)
        console.log('Fetching featured stores...')
        
        const response = await fetch('/api/stores?limit=6&status=active')
        console.log('Response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('API Error:', errorData)
          throw new Error(`Failed to fetch stores: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('API Response:', data)
        
        if (data.success) {
          setStores(data.data.slice(0, 3)) // Show only first 3 stores
          console.log(`Set ${data.data.slice(0, 3).length} featured stores`)
        } else {
          throw new Error(data.error || 'API returned unsuccessful response')
        }
      } catch (error) {
        console.error('Error fetching featured stores:', error)
        // You can add user-friendly error handling here if needed
        // For now, we'll just fail silently and show no stores
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedStores()
  }, [])

  return (
    <section className="py-8 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Toko Pilihan
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Toko Partner Terpercaya
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Kami bekerja sama dengan toko-toko terbaik di Bandung untuk memberikan produk berkualitas
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="h-6 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                    <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {stores.map((store) => (
              <Card key={store.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  {store.image ? (
                    <img 
                      src={store.image} 
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">Foto Toko</span>
                  )}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {store.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {store.description || 'Toko oleh-oleh khas Bandung'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {store.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Location - Static venue location */}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Venue PIT PERDAMI 2025, Bandung</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                       <Package className="h-4 w-4 mr-2 text-primary" />
                       <span className="font-medium">
                         {store.bundleCount ? `${store.bundleCount} Bundle` : 'Belum ada bundle'}
                       </span>
                     </div>
                    
                    <Button asChild className="w-full mt-4" variant="outline">
                      <Link href={`/stores/${store.id}`}>
                        Lihat Toko
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className="text-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/stores">
              Lihat Semua Toko
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
