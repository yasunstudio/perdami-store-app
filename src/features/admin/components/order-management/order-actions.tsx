'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminOrderActions } from '@/components/admin/admin-order-actions'
import { OrderProgressControls } from '@/components/admin/order-progress-controls'
import { Package } from 'lucide-react'

interface OrderActionsProps {
  order: {
    id: string
    orderNumber: string
    totalAmount: number
    orderStatus: string
    paymentStatus: string
    paymentMethod: string
    createdAt: string
    updatedAt: string
    user: {
      id: string
      name: string | null
      email: string
      phone?: string | null
    }
  }
  onOrderUpdate: () => void
}

export function OrderActions({ order, onOrderUpdate }: OrderActionsProps) {
  return (
    <div className="space-y-6">
      {/* Order Management Actions */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Package className="h-5 w-5" />
            Aksi Manajemen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminOrderActions
            order={{
              id: order.id,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              orderStatus: order.orderStatus,
              paymentStatus: order.paymentStatus
            }}
            onStatusChange={onOrderUpdate}
          />
        </CardContent>
      </Card>

      {/* Order Progress Controls */}
      <OrderProgressControls
        orderId={order.id}
        orderNumber={order.orderNumber}
        currentStatus={order.orderStatus}
        onStatusUpdate={onOrderUpdate}
      />
    </div>
  )
}
