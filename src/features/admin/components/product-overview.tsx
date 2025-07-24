import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { Package2, Star, Store, AlertTriangle, CheckCircle } from 'lucide-react'
import { PopularProduct, getStockLevelColor, getStockLevelText } from '../types/dashboard.types'

interface ProductOverviewProps {
  products: PopularProduct[]
  isLoading?: boolean
}

export function ProductOverview({ products, isLoading }: ProductOverviewProps) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Produk Populer
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Package2 className="h-4 w-4" />
          Produk Populer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Package2 className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada produk populer</p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                    <Package2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      {product.isFeatured && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          <Star className="h-2.5 w-2.5 mr-1" />
                          Unggulan
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product.storeName} • {product.totalSold} terjual
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatPrice(product.price)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge 
                      variant={product.totalSold > 0 ? 'default' : 'secondary'}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {product.totalSold > 0 ? `${product.totalSold} terjual` : 'Belum ada penjualan'}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatPrice(product.revenue)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
