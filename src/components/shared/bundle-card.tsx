'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { ProductBundle } from '@/types'
import { useCartStore } from '@/stores/cart-store'
import { ShoppingCart, Package } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

interface BundleCardProps {
  bundle: ProductBundle & {
    store: {
      id: string
      name: string
    }
  }
}

export function BundleCard({ bundle }: BundleCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addBundle } = useCartStore()

  // Parse bundle contents from JSON - handle both direct array and { items: [] } format
  const parseContents = (): any[] => {
    try {
      if (!bundle.contents) return []
      
      let rawContents = bundle.contents
      
      // Handle if contents is a string (JSON)
      if (typeof bundle.contents === 'string') {
        rawContents = JSON.parse(bundle.contents)
      }
      
      // Handle if contents is already an array (direct format)
      if (Array.isArray(rawContents)) {
        return rawContents
      }
      
      // Handle if contents is an object with items property
      if (typeof rawContents === 'object' && rawContents && rawContents.hasOwnProperty('items')) {
        return (rawContents as any).items || []
      }
      
      return []
    } catch (error) {
      console.error('Error parsing bundle contents:', error)
      return []
    }
  }

  const bundleItems: any[] = parseContents()

  const handleAddToCart = async () => {
    setIsLoading(true)
    try {
      // Use actual store information from bundle data
      const storeId = bundle.store?.id || bundle.storeId || 'default-store';
      const storeName = bundle.store?.name || 'Bundle Store';
      
      addBundle({
        bundleId: bundle.id,
        name: bundle.name,
        price: bundle.price,
        image: bundle.image || undefined,
        storeId,
        storeName,
        stock: 999, // Default stock for bundles
        contents: bundleItems // Use parsed bundle contents
      })
      toast.success(`${bundle.name} ditambahkan ke keranjang`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Gagal menambahkan ke keranjang')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative">
        <Link href={`/bundles/${bundle.id}`}>
          <div className="aspect-square relative overflow-hidden">
            {bundle.image ? (
              <Image
                src={bundle.image}
                alt={bundle.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 flex flex-col items-center justify-center">
                <Package className="w-16 h-16 text-blue-400 dark:text-blue-500 mb-2" />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium text-center px-2">
                  Bundle Produk
                </p>
              </div>
            )}
          </div>
        </Link>
        
        {/* Remove discount badge since no price comparison is available */}
      </div>

      <CardContent className="p-4">
        <Link href={`/bundles/${bundle.id}`}>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {bundle.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
          {bundle.description}
        </p>

        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
            {bundleItems.length > 0 ? `${bundleItems.length} produk dalam paket` : 'Bundle produk'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatPrice(bundle.price)}
            </span>
            {/* Remove original price line-through since we don't have individual prices */}
          </div>
        </div>

        {/* Display bundle contents */}
        {bundleItems.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Isi Paket:
            </p>
            {bundleItems.slice(0, 3).map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {parseInt(item.quantity || '1') || 1}x
                </span>
                <span className="line-clamp-1 flex-1">{item.name || 'Item Bundle'}</span>
                {/* Remove individual item prices since they're not in the database schema */}
              </div>
            ))}
            {bundleItems.length > 3 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                +{bundleItems.length - 3} item lainnya
              </p>
            )}
          </div>
        )}
        
        {/* Show store info if available */}
        {bundle.store && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Toko:</span> {bundle.store.name}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={handleAddToCart}
          disabled={isLoading}
          className="w-full"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isLoading ? 'Menambahkan...' : 'Tambah ke Keranjang'}
        </Button>
      </CardFooter>
    </Card>
  )
}
