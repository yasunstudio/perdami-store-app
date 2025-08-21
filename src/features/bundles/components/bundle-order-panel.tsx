'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Package, Minus, Plus, Truck, Shield, Clock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart-store'

interface BundleOrderPanelProps {
  bundle: {
    id: string
    name: string
    costPrice: number
    sellingPrice: number
    image: string | null
    contents?: any
    store: {
      id: string
      name: string
      description: string | null
    }
  }
}

export function BundleOrderPanel({ bundle }: BundleOrderPanelProps) {
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { addBundle } = useCartStore()

  // Parse bundle contents
  const parseContents = (): any[] => {
    try {
      if (!bundle.contents) return []
      
      let rawContents = bundle.contents
      
      if (typeof bundle.contents === 'string') {
        rawContents = JSON.parse(bundle.contents)
      }
      
      if (Array.isArray(rawContents)) {
        return rawContents
      }
      
      if (typeof rawContents === 'object' && rawContents && rawContents.hasOwnProperty('items')) {
        return (rawContents as any).items || []
      }
      
      return []
    } catch (error) {
      console.error('Error parsing bundle contents:', error)
      return []
    }
  }

  const contents = parseContents()

  const handleAddToCart = () => {
    try {
      setIsLoading(true)
      
      const storeId = bundle.store?.id || 'default-store'
      const storeName = bundle.store?.name || 'Bundle Store'
      
      addBundle({
        bundleId: bundle.id,
        productId: bundle.id,
        name: bundle.name,
        sellingPrice: bundle.sellingPrice,
        image: bundle.image || undefined,
        storeId,
        storeName,
        quantity,
        contents: contents
      })
      
      toast.success(`${bundle.name} berhasil ditambahkan ke keranjang`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Gagal menambahkan ke keranjang')
    } finally {
      setIsLoading(false)
    }
  }

  const totalPrice = ((bundle as any).price || bundle.sellingPrice) * quantity

  return (
    <div className="space-y-3">
      {/* Sticky Order Card */}
      <Card className="border border-gray-200 dark:border-gray-700 lg:sticky lg:top-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="truncate">Pesan Sekarang</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Price Display */}
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 text-right break-words">
              {formatPrice((bundle as any).price || bundle.sellingPrice)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
              Per paket ({contents.length} item)
            </p>
          </div>

          <Separator />

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Jumlah:
            </label>
            <div className="flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-md w-28 sm:w-32 mx-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-8 w-8 rounded-r-none p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex-1 h-8 flex items-center justify-center border-x border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-medium min-w-[20px] text-center">
                  {quantity}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="h-8 w-8 rounded-l-none p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Total Calculator - Only show if quantity > 1 */}
          {quantity > 1 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex justify-between items-center text-sm sm:text-base font-bold">
                <span className="break-words">Total ({quantity} paket):</span>
                <span className="text-blue-600 dark:text-blue-400 break-words">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full h-10 text-xs sm:text-sm font-semibold"
            size="default"
          >
            <ShoppingCart className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{isLoading ? 'Menambahkan...' : 'Tambah ke Keranjang'}</span>
          </Button>

          {/* Additional Info - Streamlined */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 flex-shrink-0" />
              <span>Siap pesan</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3 flex-shrink-0" />
              <span>Ambil di Venue</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
