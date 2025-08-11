'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, /* Edit, */ Trash2 } from 'lucide-react'
import { OrderWithRelations } from '../types/order.types'
import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface OrderListTableProps {
  orders: OrderWithRelations[]
  onView: (order: OrderWithRelations) => void
  // onEdit: (order: OrderWithRelations) => void // Disabled - use View Details instead
  onDelete: (order: OrderWithRelations) => void
  isDeleting: boolean
  getStatusBadge: (status: string) => React.ReactNode
  getPaymentStatusBadge: (status: string) => React.ReactNode
}

export function OrderListTable({
  orders,
  onView,
  // onEdit, // Disabled - use View Details instead
  onDelete,
  isDeleting,
  getStatusBadge,
  getPaymentStatusBadge
}: OrderListTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="min-w-[950px]">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[18%]">No. Pesanan</TableHead>
              <TableHead className="w-[18%]">Customer</TableHead>
              <TableHead className="w-[10%]">Items</TableHead>
              <TableHead className="w-[10%] text-right">Total</TableHead>
              <TableHead className="w-[9%]">Status</TableHead>
              <TableHead className="w-[10%]">Pembayaran</TableHead>
              <TableHead className="w-[9%]">Dibuat</TableHead>
              <TableHead className="w-[9%]">Pickup</TableHead>
              <TableHead className="w-[7%] text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/50">
                <TableCell className="font-medium w-[18%]">
                  <div className="font-mono text-sm break-all">{order.orderNumber}</div>
                </TableCell>
                <TableCell className="w-[18%]">
                  <div className="space-y-1">
                    <div className="font-medium truncate">
                      {order.customer?.name || order.user?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {order.customer?.email || order.user?.email || 'N/A'}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-[10%]">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {(order.items || order.orderItems || []).length} item(s)
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {(order.items || order.orderItems || [])
                        .slice(0, 2)
                        .map(item => item.bundle.name)
                        .join(', ')}
                      {(order.items || order.orderItems || []).length > 2 && '...'}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium w-[10%] text-right">
                  <div className="truncate">{formatPrice(order.totalAmount)}</div>
                </TableCell>
                <TableCell className="w-[9%]">
                  {getStatusBadge(order.orderStatus)}
                </TableCell>
                <TableCell className="w-[10%]">
                  {getPaymentStatusBadge(order.paymentStatus)}
                </TableCell>
                <TableCell className="w-[9%]">
                  <div className="space-y-1">
                    <div className="text-sm">
                      {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: id })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), 'HH:mm')}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-[9%]">
                  <div className="space-y-1">
                    {order.pickupDate ? (
                      <>
                        <div className="text-sm">
                          {format(new Date(order.pickupDate), 'dd MMM yyyy', { locale: id })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(order.pickupDate), 'HH:mm')}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400">
                        Belum dijadwalkan
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="w-[7%] text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat Detail
                      </DropdownMenuItem>
                      {/* Edit option disabled - use View Details instead
                      <DropdownMenuItem onClick={() => onEdit(order)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      */}
                      <DropdownMenuItem 
                        onClick={() => onDelete(order)}
                        className="text-destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
