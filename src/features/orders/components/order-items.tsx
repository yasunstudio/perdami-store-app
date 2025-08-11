'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, MapPin } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

interface OrderItemsProps {
  order: any
  parseBundleContents: (contents: string) => any[]
}

export function OrderItems({ order, parseBundleContents }: OrderItemsProps) {
  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3 lg:pb-4 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
            <Package className="h-3 w-3 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <span className="text-xs sm:text-sm lg:text-base">Order Items</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {order.orderItems?.map((item: any, index: number) => {
            const bundleContents = parseBundleContents(item.bundle.contents)
            
            return (
              <div key={index} className="border rounded-lg p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-900/50 dark:to-slate-900/50">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
                  {/* Bundle Image */}
                  <div className="w-full sm:w-20 md:w-24 lg:w-32 h-48 sm:h-20 md:h-24 lg:h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    {item.bundle.imageUrl ? (
                      <Image
                        src={item.bundle.imageUrl}
                        alt={item.bundle.name}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Bundle Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 line-clamp-2">
                          {item.bundle.name}
                        </h3>
                        
                        {/* Store Info */}
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{item.bundle.store.name}</span>
                        </div>

                        {/* Quantity & Price */}
                        <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-1 xs:gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              {item.quantity}x
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 xs:gap-2">
                            <span className="text-gray-600 dark:text-gray-400">@</span>
                            <span className="font-medium">{formatPrice(item.unitPrice)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className="flex flex-col items-end sm:items-end">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Total
                        </div>
                      </div>
                    </div>

                    {/* Bundle Contents */}
                    {bundleContents.length > 0 && (
                      <div className="border-t pt-3 sm:pt-4">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                          Bundle Contents:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2">
                          {bundleContents.map((content, contentIndex) => (
                            <div key={contentIndex} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                              <span className="truncate">
                                {content.product.name} ({content.quantity}x)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
