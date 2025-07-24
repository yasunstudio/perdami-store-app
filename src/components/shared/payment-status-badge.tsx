// Payment Status Badge Component
import { Badge } from '@/components/ui/badge'
import { getPaymentStatusColor, getPaymentStatusText } from '@/lib/utils/payment.utils'
import type { PaymentStatus } from '@prisma/client'

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  className?: string
}

export function PaymentStatusBadge({ status, className = '' }: PaymentStatusBadgeProps) {
  return (
    <Badge className={`${getPaymentStatusColor(status)} ${className}`}>
      {getPaymentStatusText(status)}
    </Badge>
  )
}
