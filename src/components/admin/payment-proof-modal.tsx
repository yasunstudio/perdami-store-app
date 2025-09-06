'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, ExternalLink, FileImage, X } from 'lucide-react'
import { OrderWithRelations } from '@/features/admin/orders/types/order.types'

interface PaymentProofModalProps {
  order: OrderWithRelations
  trigger?: React.ReactNode
}

export function PaymentProofModal({ order, trigger }: PaymentProofModalProps) {
  const [imageError, setImageError] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  if (!order.paymentProofUrl) {
    return null
  }

  const handleDownload = () => {
    if (order.paymentProofUrl) {
      const link = document.createElement('a')
      link.href = order.paymentProofUrl
      link.download = `payment-proof-${order.orderNumber}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const openInNewTab = () => {
    if (order.paymentProofUrl) {
      window.open(order.paymentProofUrl, '_blank')
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileImage className="h-4 w-4 mr-2" />
            View Payment Proof
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Payment Proof</DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-600">
                  Order #{order.orderNumber}
                </span>
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={openInNewTab} variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button onClick={handleDownload} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Customer:</h4>
            <p className="text-gray-600">{order.user.name || order.user.email}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Total Amount:</h4>
            <p className="text-gray-600 font-medium">
              Rp {order.totalAmount.toLocaleString('id-ID')}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Order Status:</h4>
            <p className="text-gray-600">{order.orderStatus}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Created:</h4>
            <p className="text-gray-600">
              {new Date(order.createdAt).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>

        <Separator />

        {/* Payment Proof Image */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Payment Proof Image:</h4>
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            {!imageError ? (
              <div className="relative">
                <Image
                  src={order.paymentProofUrl}
                  alt={`Payment proof for order ${order.orderNumber}`}
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-[60vh] object-contain"
                  onError={() => setImageError(true)}
                  priority
                />
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Unable to display image</p>
                <div className="space-x-2">
                  <Button onClick={openInNewTab} variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Original
                  </Button>
                  <Button onClick={handleDownload} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Image Actions */}
          <div className="flex justify-center space-x-2">
            <Button 
              onClick={() => setImageError(false)} 
              variant="outline" 
              size="sm"
            >
              Retry Loading
            </Button>
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Full Size
            </Button>
            <Button onClick={handleDownload} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
