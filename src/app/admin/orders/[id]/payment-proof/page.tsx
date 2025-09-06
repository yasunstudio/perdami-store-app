'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface OrderPaymentProof {
  id: string
  orderNumber: string
  paymentProofUrl: string
  paymentStatus: string
  user: {
    name: string | null
    email: string
  }
}

export default function PaymentProofPage() {
  const params = useParams()
  const [order, setOrder] = useState<OrderPaymentProof | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchPaymentProof = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${params.id}/payment-proof`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch payment proof')
        }

        const data = await response.json()
        setOrder(data)
      } catch (error: any) {
        console.error('Error fetching payment proof:', error)
        setError(error.message || 'Failed to load payment proof')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPaymentProof()
    }
  }, [params.id])

  const handleDownload = () => {
    if (order?.paymentProofUrl) {
      const link = document.createElement('a')
      link.href = order.paymentProofUrl
      link.download = `payment-proof-${order.orderNumber}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const openInNewTab = () => {
    if (order?.paymentProofUrl) {
      window.open(order.paymentProofUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p className="text-lg font-semibold">Payment Proof Not Available</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/admin/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
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

      {/* Payment Proof Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Payment Proof</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.paymentStatus === 'PAID' 
                ? 'bg-green-100 text-green-800' 
                : order.paymentStatus === 'PENDING'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {order.paymentStatus}
            </span>
          </CardTitle>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Order:</span> #{order.orderNumber}</p>
            <p><span className="font-medium">Customer:</span> {order.user.name || order.user.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Image Display */}
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              {!imageError ? (
                <div className="relative">
                  <Image
                    src={order.paymentProofUrl}
                    alt="Payment Proof"
                    width={800}
                    height={600}
                    className="w-full h-auto max-h-[70vh] object-contain"
                    onError={() => setImageError(true)}
                    priority
                  />
                </div>
              ) : (
                <div className="p-8 text-center">
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

            {/* Actions */}
            <div className="flex justify-center space-x-2 pt-4">
              <Button onClick={() => setImageError(false)} variant="outline" size="sm">
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
        </CardContent>
      </Card>
    </div>
  )
}
