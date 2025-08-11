'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { OrderWithRelations } from '../types/order.types'
import { formatPrice } from '@/lib/utils'

interface OrderGridViewProps {
  orders: OrderWithRelations[]
  onView: (order: OrderWithRelations) => void
  // onEdit: (order: OrderWithRelations) => void // Disabled - use View Details instead
  onDelete: (order: OrderWithRelations) => void
  getStatusBadge: (status: string) => React.ReactNode
  getPaymentStatusBadge: (status: string) => React.ReactNode
  getQuickActions: (order: OrderWithRelations) => React.ReactNode
  needsPaymentVerification: (order: OrderWithRelations) => boolean
}

export function OrderGridView({
  orders,
  onView,
  // onEdit, // Disabled - use View Details instead
  onDelete,
  getStatusBadge,
  getPaymentStatusBadge,
  getQuickActions,
  needsPaymentVerification
}: OrderGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm truncate">{order.orderNumber}</h3>
                <div className="flex gap-1">
                  {getStatusBadge(order.orderStatus)}
                </div>
              </div>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <p><strong>Customer:</strong> {order.user?.name || order.customer?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{order.user?.email || order.customer?.email || ''}</p>
                </div>
                
                <div>
                  <p><strong>Items:</strong> {(order.items || order.orderItems || []).length} item(s)</p>
                  <div className="text-xs text-gray-500">
                    {(order.items || order.orderItems || [])
                      .slice(0, 2)
                      .map(item => item.bundle.name)
                      .join(', ')}
                    {(order.items || order.orderItems || []).length > 2 && '...'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p><strong>Subtotal:</strong> {formatPrice(order.subtotalAmount)}</p>
                  <p><strong>Ongkos Kirim:</strong> {formatPrice(order.serviceFee)}</p>
                  <p className="font-semibold text-foreground">
                    <strong>Total:</strong> {formatPrice(order.totalAmount)}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span><strong>Pembayaran:</strong></span>
                  {getPaymentStatusBadge(order.paymentStatus)}
                </div>
                
                <div className="space-y-1">
                  <p><strong>Dibuat:</strong> {new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                  {order.pickupDate && (
                    <p><strong>Pickup:</strong> {new Date(order.pickupDate).toLocaleDateString('id-ID')}</p>
                  )}
                  {!order.pickupDate && (
                    <p><strong>Pickup:</strong> <span className="text-gray-400">Belum dijadwalkan</span></p>
                  )}
                </div>
                
                {needsPaymentVerification(order) && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-700">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium text-xs">Butuh Verifikasi Bukti Transfer</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t">
                {getQuickActions(order)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
