'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  CreditCard, 
  User,
  MapPin,
  RefreshCw,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { formatPrice } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface OrderManagementHeaderProps {
  order: {
    id: string
    orderNumber: string
    totalAmount: number
    orderStatus: string
    paymentStatus: string
    createdAt: string
    customer: {
      name: string
      email: string
      phone?: string
    }
  }
  onBackClick: () => void
  onOrderUpdate: () => void
}

const statusConfig = {
  order: {
    PENDING: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    CONFIRMED: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    PROCESSING: { label: 'Diproses', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    READY: { label: 'Siap', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    COMPLETED: { label: 'Selesai', color: 'bg-green-100 text-green-800 border-green-200' },
    CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800 border-red-200' }
  },
  payment: {
    PENDING: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    PAID: { label: 'Dibayar', color: 'bg-green-100 text-green-800 border-green-200' },
    FAILED: { label: 'Gagal', color: 'bg-red-100 text-red-800 border-red-200' },
    REFUNDED: { label: 'Dikembalikan', color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
}

export function OrderManagementHeader({ order, onBackClick, onOrderUpdate }: OrderManagementHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onOrderUpdate()
    setIsRefreshing(false)
  }

  const orderStatusConfig = statusConfig.order[order.orderStatus as keyof typeof statusConfig.order]
  const paymentStatusConfig = statusConfig.payment[order.paymentStatus as keyof typeof statusConfig.payment]

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBackClick}
          className="flex items-center gap-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Order
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Order
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Package className="h-4 w-4 mr-2" />
                Print Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{order.orderNumber}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {order.customer.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:items-end gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className={`${orderStatusConfig?.color || 'bg-gray-100 text-gray-800'} border`}
              >
                {orderStatusConfig?.label || order.orderStatus}
              </Badge>
              
              <Badge 
                variant="outline" 
                className={`${paymentStatusConfig?.color || 'bg-gray-100 text-gray-800'} border`}
              >
                {paymentStatusConfig?.label || order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
