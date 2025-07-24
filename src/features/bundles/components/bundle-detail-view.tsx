'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import { ProductBundle } from '@/types'
import { useCartStore } from '@/stores/cart-store'
import { ShoppingCart, Package, Minus, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface BundleDetailViewProps {
  bundle: ProductBundle & {
    store: {
      id: string
      name: string
      description: string | null
      address: string | null
      city: string | null
    }
  }
}

export function BundleDetailView({ bundle }: BundleDetailViewProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
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

  const contents = parseContents()

  const handleAddToCart = () => {
    try {
      setIsLoading(true)
      
      // Use actual store information from bundle data
      const storeId = bundle.store?.id || 'default-store';
      const storeName = bundle.store?.name || 'Bundle Store';
      
      addBundle({
        bundleId: bundle.id,
        name: bundle.name,
        price: bundle.price,
        image: bundle.image || undefined,
        storeId,
        storeName,
        stock: 999, // Bundle stock default for cart
        quantity,
        contents: contents // Use parsed contents from database
      })
      
      toast.success(`${bundle.name} berhasil ditambahkan ke keranjang`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Gagal menambahkan ke keranjang')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Professional Breadcrumb */}
        <nav className="flex items-center space-x-1 text-sm mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1">
            <li>
              <Link 
                href="/" 
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Beranda
              </Link>
            </li>
            <li className="text-gray-400 dark:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <Link 
                href="/bundles" 
                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Paket Produk
              </Link>
            </li>
            <li className="text-gray-400 dark:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
                {bundle.name}
              </span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Image & Contents */}
          <div className="space-y-6">
            {/* Product Image */}
            <div className="w-full aspect-square lg:aspect-[4/3] relative overflow-hidden rounded-xl border bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-sm">
              {bundle.image ? (
                <Image
                  src={bundle.image}
                  alt={bundle.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Package className="w-20 h-20 text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Bundle Produk</p>
                </div>
              )}
            </div>

            {/* Bundle Contents for Desktop */}
            <div className="hidden lg:block">
              {contents && contents.length > 0 && (
                <Card className="border border-gray-200 dark:border-gray-700 w-full shadow-sm">
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        Isi Paket ({contents.length} item)
                      </h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {contents.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {item.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-3">
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium text-xs px-2 py-1">
                              {item.quantity}x
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            <Card className="h-fit">
              <CardContent className="p-6 space-y-6">
            {/* Product Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {bundle.store.name}
                </Badge>
                {bundle.isFeatured && (
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                    Unggulan
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {bundle.name}
              </h1>
              {bundle.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {bundle.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatPrice(bundle.price)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Harga paket lengkap</p>
            </div>

            {/* Bundle Contents for Mobile */}
            <div className="lg:hidden">
              {contents && contents.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      Isi Paket ({contents.length} item)
                    </h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {contents.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {item.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium text-xs px-2 py-1">
                            {item.quantity}x
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator className="lg:hidden" />

            {/* Store Information */}
            <div>
              <h3 className="font-semibold mb-3">Informasi Toko</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{bundle.store.name}</p>
                  {bundle.store.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{bundle.store.description}</p>
                  )}
                </div>
                {bundle.store.address && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>{bundle.store.address}</p>
                    {bundle.store.city && <p>{bundle.store.city}</p>}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Jumlah:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 font-medium min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatPrice(bundle.price * quantity)}
                  </span>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isLoading ? 'Menambahkan...' : 'Tambah ke Keranjang'}
                </Button>

                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Paket siap untuk dipesan
                </p>
              </div>
            </div>
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
