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
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium">Belum ada pesanan terbaru</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Pesanan akan muncul di sini setelah ada transaksi</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                    <User className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      #{order.orderNumber} • {order.itemCount} item
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatPrice(order.totalAmount)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge 
                      variant={getOrderStatusColor(order.status)}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {getOrderStatusText(order.status)}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(order.createdAt)}
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
