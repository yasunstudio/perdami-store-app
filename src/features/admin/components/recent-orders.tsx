import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { Package, Calendar, ShoppingCart, User, Clock, CheckCircle, AlertCircle, MoreHorizontal } from 'lucide-react'
import { RecentOrder, getOrderStatusColor, getOrderStatusText } from '../types/dashboard.types'

interface RecentOrdersProps {
  orders: RecentOrder[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Pesanan Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada pesanan terbaru</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {/* Customer Name - Prominent at top */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      {order.customerName}
                    </h4>
                    <Badge 
                      variant={getOrderStatusColor(order.status)}
                      className="text-xs px-2 py-0.5 flex-shrink-0 ml-2"
                    >
                      {getOrderStatusText(order.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    #{order.orderNumber} • {order.itemCount} item
                  </p>
                </div>
                
                {/* Order Details */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                      <User className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
                
                {/* Order Summary */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    Order ID: <span className="font-medium">#{order.orderNumber}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
