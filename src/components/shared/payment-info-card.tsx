// Payment Info Card Component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PaymentStatusBadge } from './payment-status-badge'
import { 
  getPaymentStatusInfo, 
  getPaymentMethodText, 
  formatPaymentAmount,
  getPaymentTimeRemaining,
  isPaymentOverdue
} from '@/lib/utils/payment.utils'
import type { OrderWithPayment } from '@/lib/utils/payment.utils'
import { CreditCard, Clock, AlertTriangle } from 'lucide-react'

interface PaymentInfoCardProps {
  order: OrderWithPayment
  className?: string
}

export function PaymentInfoCard({ order, className = '' }: PaymentInfoCardProps) {
  const paymentInfo = getPaymentStatusInfo(order)
  const isOverdue = isPaymentOverdue(order)
  const timeRemaining = getPaymentTimeRemaining(order)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Informasi Pembayaran
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <PaymentStatusBadge status={paymentInfo.status} />
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Metode</p>
            <p className="font-medium">{getPaymentMethodText(paymentInfo.method)}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Total Pembayaran</p>
          <p className="text-2xl font-bold text-primary">
            {formatPaymentAmount(order.totalAmount)}
          </p>
        </div>

        {paymentInfo.isPending && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <Clock className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Batas Waktu Pembayaran
              </p>
              <p className="text-xs text-yellow-600">
                {isOverdue ? 'Kadaluarsa' : `Sisa waktu: ${timeRemaining}`}
              </p>
            </div>
          </div>
        )}

        {isOverdue && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Pembayaran Kadaluarsa
              </p>
              <p className="text-xs text-red-600">
                Silakan lakukan pembayaran ulang
              </p>
            </div>
          </div>
        )}

        {paymentInfo.isPaid && paymentInfo.proofUrl && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Bukti Pembayaran</p>
            <img 
              src={paymentInfo.proofUrl} 
              alt="Bukti pembayaran" 
              className="max-w-full h-auto rounded-lg border"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
