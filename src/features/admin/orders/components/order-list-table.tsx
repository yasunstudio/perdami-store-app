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
import { MoreHorizontal, Eye, Trash2, MessageCircle } from 'lucide-react'
import { OrderWithRelations } from '../types/order.types'
import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { generateCustomerPickupMessage, openWhatsApp, validateIndonesianPhone } from '@/lib/whatsapp'
import { toast } from 'sonner'

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

  // Handle WhatsApp notification to customer
  const handleNotifyCustomer = (order: OrderWithRelations) => {
    try {
      const customerPhone = order.customer?.phone || order.user?.phone
      const customerName = order.customer?.name || order.user?.name

      if (!customerPhone) {
        toast.error('Nomor telepon customer tidak tersedia')
        return
      }

      if (!validateIndonesianPhone(customerPhone)) {
        toast.error('Format nomor telepon tidak valid')
        return
      }

      const message = generateCustomerPickupMessage(order)
      openWhatsApp(customerPhone, message)
      toast.success(`WhatsApp terbuka untuk notifikasi ke ${customerName}`)
    } catch (error) {
      console.error('Error opening WhatsApp:', error)
      toast.error('Gagal membuka WhatsApp')
    }
  }

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[15%]">No. Pesanan</TableHead>
              <TableHead className="w-[15%]">Customer</TableHead>
              <TableHead className="w-[12%]">Items</TableHead>
              <TableHead className="w-[12%] text-right">Total</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[12%]">Pembayaran</TableHead>
              <TableHead className="w-[10%]">Dibuat</TableHead>
              <TableHead className="w-[10%]">Pickup</TableHead>
              <TableHead className="w-[4%] text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-mono text-sm break-all">{order.orderNumber}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium truncate">
                      {order.customer?.name || order.user?.name || 'N/A'}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {order.customer?.email || order.user?.email || 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium">
                      {(order.items || order.orderItems || []).length} item(s)
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {(order.items || order.orderItems || [])
                        .slice(0, 2)
                        .map(item => item.bundle.name)
                        .join(', ')}
                      {(order.items || order.orderItems || []).length > 2 && '...'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">{formatPrice(order.totalAmount)}</span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(order.orderStatus)}
                </TableCell>
                <TableCell>
                  {getPaymentStatusBadge(order.paymentStatus)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-sm">
                      {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: id })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), 'HH:mm')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-0.5">
                    {order.pickupDate ? (
                      <>
                        <span className="text-sm">
                          {format(new Date(order.pickupDate), 'dd MMM yyyy', { locale: id })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.pickupDate), 'HH:mm')}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Belum dijadwalkan
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat Detail
                      </DropdownMenuItem>
                      {/* WhatsApp notification - show if customer has phone and order is ready */}
                      {(order.customer?.phone || order.user?.phone) && order.orderStatus === 'READY' && (
                        <DropdownMenuItem onClick={() => handleNotifyCustomer(order)}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Notifikasi WhatsApp
                        </DropdownMenuItem>
                      )}
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
