import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit, MoreHorizontal, Trash2, User, Package, Calendar, CreditCard, Building, MapPin } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getPickupMethodText } from '@/lib/utils/payment.utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Order } from '@/types'
import { OrderStatus, PaymentStatus } from '@/types'

interface OrderMobileCardProps {
  order: Order
  onView: (order: Order) => void
  onDelete: (order: Order) => void
  isDeleting?: boolean
}

const getStatusBadge = (status: OrderStatus) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
    PROCESSING: 'bg-orange-100 text-orange-800 border-orange-200',
    READY: 'bg-purple-100 text-purple-800 border-purple-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200'
  }
  
  return (
    <Badge className={colors[status]}>
      {status}
    </Badge>
  )
}

const getPaymentStatusBadge = (status: PaymentStatus) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PAID: 'bg-green-100 text-green-800 border-green-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
    REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200'
  }
  
  return (
    <Badge className={colors[status]}>
      {status}
    </Badge>
  )
}

export function OrderMobileCard({ order, onView, onDelete, isDeleting = false }: OrderMobileCardProps) {

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white dark:bg-gray-800">
      {/* Header with Order Number and Actions */}
      <div className="relative p-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
              #{order.orderNumber}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {getStatusBadge(order.orderStatus)}
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>
          </div>
          
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                disabled={isDeleting}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(order)}>
                <Edit className="h-4 w-4 mr-2" />
                Kelola Pesanan
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(order)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4 pt-0 space-y-4">
        {/* Customer Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {order.customer.name}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {order.customer.email}
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {(order.items || []).length} item(s)
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {(order.items || []).slice(0, 2).map(item => item.bundle.name).join(', ')}
            {(order.items || []).length > 2 && '...'}
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Pembayaran
          </span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        {/* Order Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="h-3 w-3" />
          <span>
            {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
          </span>
        </div>

        {/* Payment Method */}
        {order.paymentMethod && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <CreditCard className="h-3 w-3" />
            <span>{order.paymentMethod}</span>
          </div>
        )}

        {/* Pickup Method */}
        {order.pickupMethod && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="h-3 w-3" />
            <span>{getPickupMethodText(order.pickupMethod)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}