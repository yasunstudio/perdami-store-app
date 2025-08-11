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
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Package2 className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada produk populer</p>
            </div>
          ) : (
            products.slice(0, 5).map((product) => (
              <div key={product.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {/* Product Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <Package2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {product.name}
                        </h4>
                        {product.isFeatured && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                            <Star className="h-3 w-3 mr-1" />
                            Unggulan
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.storeName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </div>
                
                {/* Product Stats */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={product.totalSold > 0 ? 'default' : 'secondary'}
                      className="text-xs px-2 py-1"
                    >
                      {product.totalSold > 0 ? `${product.totalSold} terjual` : 'Belum ada penjualan'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Revenue: {formatPrice(product.revenue)}
                    </p>
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
