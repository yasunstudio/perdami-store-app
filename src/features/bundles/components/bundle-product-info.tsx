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
    <div className="space-y-3 sm:space-y-4">
      {/* Store Information - Moved to top */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Store className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 dark:text-green-400" />
            </div>
            <span className="truncate">Informasi Toko</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                <Store className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{bundle.store.name}</span>
              </Badge>
              {bundle.isFeatured && (
                <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs flex-shrink-0">
                  ⭐ Unggulan
                </Badge>
              )}
            </div>
            
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base break-words">
                {bundle.store.name}
              </p>
              {bundle.store.description && (
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1 break-words">
                  {bundle.store.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="break-words">Venue PIT PERDAMI 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Header */}
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">
          {bundle.name}
        </h1>
        
        {bundle.description && (
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-xs sm:text-sm break-words">
            {bundle.description}
          </p>
        )}
      </div>

      {/* Bundle Contents */}
      {contents && contents.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="truncate">Isi Paket</span>
              <Badge variant="outline" className="ml-auto text-xs flex-shrink-0">
                {contents.length} item
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {contents.map((item: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm break-words">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
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
