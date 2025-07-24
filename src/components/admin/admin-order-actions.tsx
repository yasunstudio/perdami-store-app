'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MarkAsFailedDialog } from '@/components/admin/mark-as-failed-dialog'
import { ProcessRefundDialog } from '@/components/admin/process-refund-dialog'
import { PaymentStatusHistory } from '@/components/admin/payment-status-history'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal, 
  XCircle, 
  RefreshCw, 
  History,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react'

interface AdminOrderActionsProps {
  order: {
    id: string
    orderNumber: string
    totalAmount: number
    orderStatus: string
    paymentStatus: string
  }
  onStatusChange?: () => void
}

export function AdminOrderActions({ order, onStatusChange }: AdminOrderActionsProps) {
  const [showFailedDialog, setShowFailedDialog] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)

  const canMarkAsFailed = order.paymentStatus === 'PENDING' || order.paymentStatus === 'PAID'
  const canProcessRefund = order.paymentStatus === 'PAID'
  const isAlreadyProcessed = order.paymentStatus === 'FAILED' || order.paymentStatus === 'REFUNDED'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Menunggu'
      case 'PAID':
        return 'Dibayar'
      case 'FAILED':
        return 'Gagal'
      case 'REFUNDED':
        return 'Dikembalikan'
      default:
        return status
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      <Badge className={getStatusColor(order.paymentStatus)}>
        {getStatusText(order.paymentStatus)}
      </Badge>

      {/* Status Indicator */}
      {order.paymentStatus === 'PAID' && (
        <CheckCircle className="h-4 w-4 text-green-500" />
      )}
      {order.paymentStatus === 'FAILED' && (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      {order.paymentStatus === 'REFUNDED' && (
        <RefreshCw className="h-4 w-4 text-gray-500" />
      )}
      {order.paymentStatus === 'PENDING' && (
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
      )}

      {/* Action Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowHistoryDialog(true)}>
            <History className="h-4 w-4 mr-2" />
            Lihat Riwayat
          </DropdownMenuItem>
          
          {canMarkAsFailed && (
            <DropdownMenuItem 
              onClick={() => setShowFailedDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Tandai Gagal
            </DropdownMenuItem>
          )}
          
          {canProcessRefund && (
            <DropdownMenuItem onClick={() => setShowRefundDialog(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Proses Refund
            </DropdownMenuItem>
          )}
          
          {isAlreadyProcessed && (
            <DropdownMenuItem disabled>
              <CheckCircle className="h-4 w-4 mr-2" />
              Sudah Diproses
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <Dialog open={showFailedDialog} onOpenChange={setShowFailedDialog}>
        <DialogContent className="max-w-md">
          <MarkAsFailedDialog
            orderId={order.id}
            orderNumber={order.orderNumber}
            totalAmount={order.totalAmount}
            onClose={() => setShowFailedDialog(false)}
            onSuccess={() => {
              onStatusChange?.()
              setShowFailedDialog(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md">
          <ProcessRefundDialog
            orderId={order.id}
            orderNumber={order.orderNumber}
            totalAmount={order.totalAmount}
            onClose={() => setShowRefundDialog(false)}
            onSuccess={() => {
              onStatusChange?.()
              setShowRefundDialog(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <PaymentStatusHistory
            orderId={order.id}
            className="border-0 shadow-none"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
