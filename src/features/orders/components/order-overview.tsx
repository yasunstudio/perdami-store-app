'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Package, User, CreditCard, Calendar, Hash } from 'lucide-react'
import { OrderStatus, PaymentStatus } from '@/types'

interface OrderOverviewProps {
  order: any
  getStatusColor: (status: OrderStatus) => string
  getStatusText: (status: OrderStatus) => string
  getPaymentStatusColor: (status: PaymentStatus) => string
  getPaymentStatusText: (status: PaymentStatus) => string
}

export function OrderOverview({ 
  order, 
  getStatusColor, 
  getStatusText, 
  getPaymentStatusColor, 
  getPaymentStatusText 
}: OrderOverviewProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-blue-50/50 to-violet-50/50 dark:from-primary/10 dark:via-blue-900/20 dark:to-violet-900/20 border-primary/20">
      <CardHeader className="pb-2 sm:pb-3 lg:pb-4 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-primary/10 rounded-lg flex-shrink-0">
              <Clock className="h-3 w-3 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-primary" />
            </div>
            <span className="truncate text-xs sm:text-sm lg:text-base">Overview Pesanan</span>
          </CardTitle>
          <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
            <Badge className={`${getStatusColor(order.orderStatus as OrderStatus)} text-xs mt-1`}>
              {getStatusText(order.orderStatus as OrderStatus)}
            </Badge>
            <Badge className={`${getPaymentStatusColor(order.paymentStatus as PaymentStatus)} text-xs`}>
              {getPaymentStatusText(order.paymentStatus as PaymentStatus)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Order Number */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
              <Hash className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="text-xs sm:text-sm lg:text-base font-medium truncate">
                #{order.orderNumber}
              </p>
            </div>
          </div>

          {/* Customer */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex-shrink-0">
              <User className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="text-xs sm:text-sm lg:text-base font-medium truncate">
                {order.user?.name || 'Customer'}
              </p>
              {order.user?.phone && (
                <p className="text-xs text-muted-foreground truncate">
                  {order.user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Items Count */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex-shrink-0">
              <Package className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="text-xs sm:text-sm lg:text-base font-medium">
                {order.orderItems?.length || 0} Bundle{(order.orderItems?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Order Date */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Order Date</p>
              <p className="text-xs sm:text-sm lg:text-base font-medium">
                {typeof order.createdAt === 'string' 
                  ? new Date(order.createdAt).toLocaleDateString('id-ID')
                  : order.createdAt.toLocaleDateString('id-ID')
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {typeof order.createdAt === 'string'
                  ? new Date(order.createdAt).toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : order.createdAt.toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
