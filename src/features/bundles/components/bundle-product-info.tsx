'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Package, MapPin, Store } from 'lucide-react'

interface BundleProductInfoProps {
  bundle: {
    id: string
    name: string
    description: string | null
    isFeatured: boolean
    contents?: any
    store: {
      id: string
      name: string
      description: string | null
      address: string | null
      city: string | null
    }
  }
}

export function BundleProductInfo({ bundle }: BundleProductInfoProps) {
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

  return (
    <div className="space-y-4">
      {/* Store Information - Moved to top */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Store className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            Informasi Toko
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                <Store className="w-3 h-3 mr-1" />
                {bundle.store.name}
              </Badge>
              {bundle.isFeatured && (
                <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                  ⭐ Unggulan
                </Badge>
              )}
            </div>
            
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-base">
                {bundle.store.name}
              </p>
              {bundle.store.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {bundle.store.description}
                </p>
              )}
            </div>
            
            {(bundle.store.address || bundle.store.city) && (
              <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {bundle.store.address && (
                    <p>{bundle.store.address}</p>
                  )}
                  {bundle.store.city && (
                    <p className="font-medium">{bundle.store.city}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {bundle.name}
        </h1>
        
        {bundle.description && (
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
            {bundle.description}
          </p>
        )}
      </div>

      {/* Bundle Contents */}
      {contents && contents.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              Isi Paket
              <Badge variant="outline" className="ml-auto text-xs">
                {contents.length} item
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {contents.map((item: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium text-xs">
                      {item.quantity} Produk
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Bundle Info */}
      <Card className="border border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Package className="h-3 w-3" />
            <span className="text-xs font-medium">
              Paket siap untuk dipesan • Semua item termasuk dalam harga
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
