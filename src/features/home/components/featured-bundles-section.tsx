'use client'

import { BundleCard } from '@/components/shared/bundle-card'
import { Button } from '@/components/ui/button'
import { ProductBundle } from '@/types'
import { ArrowRight, Package } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface FeaturedBundle extends ProductBundle {
  store: {
    id: string
    name: string
  }
}

export function FeaturedBundlesSection() {
  const [bundles, setBundles] = useState<FeaturedBundle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedBundles = async () => {
      try {
        const response = await fetch('/api/bundles?featured=true&limit=4')
        if (response.ok) {
          const data = await response.json()
          setBundles(data.bundles)
        }
      } catch (error) {
        console.error('Error fetching featured bundles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedBundles()
  }, [])

  if (loading) {
    return (
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Paket Produk Unggulan
            </h2>
            <p className="text-xl text-muted-foreground">
              Hemat lebih banyak dengan paket produk pilihan kami
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-square rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="bg-muted h-4 rounded"></div>
                  <div className="bg-muted h-4 rounded w-2/3"></div>
                  <div className="bg-muted h-6 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (bundles.length === 0) {
    return null
  }

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Paket Produk Unggulan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hemat lebih banyak dengan paket produk pilihan kami. Dapatkan berbagai produk berkualitas dengan harga lebih terjangkau.
          </p>
        </div>

        {/* Featured Bundles Grid - 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/bundles">
              Lihat Semua Paket Produk
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
