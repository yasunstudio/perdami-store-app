'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  subtotalAmount: number
  serviceFee: number
  totalAmount: number
  orderStatus: string
  paymentStatus: string
  pickupMethod: string
  pickupDate: string | null
  notes: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
    phone: string | null
  }
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    bundle: {
      name: string
      sellingPrice: number
      store: {
        name: string
      }
    }
  }>
}

export default function InvoicePage() {
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${params.id}/invoice`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch order')
        }

        const data = await response.json()
        setOrder(data)
      } catch (error) {
        console.error('Error fetching order:', error)
        setError('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  const handlePrint = () => {
    window.print()
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
        <div className="text-center text-red-600">{error || 'Order not found'}</div>
      </div>
    )
  }

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .container { max-width: none; margin: 0; padding: 0; }
          .card { box-shadow: none; border: none; }
          .text-gray-600 { color: #000 !important; }
          .text-gray-900 { color: #000 !important; }
          table { page-break-inside: avoid; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
      
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header with actions - hidden when printing */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <Button onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>

        {/* Invoice Content */}
        <Card className="w-full">
          <CardHeader className="pb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  INVOICE
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Order #{order.orderNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="font-semibold">
                  {new Date(order.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium">{order.user.name || 'N/A'}</p>
                  <p>{order.user.email}</p>
                  {order.user.phone && <p>{order.user.phone}</p>}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Details:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Status:</span> {order.orderStatus}</p>
                  <p><span className="font-medium">Payment:</span> {order.paymentStatus}</p>
                  <p><span className="font-medium">Pickup:</span> {order.pickupMethod}</p>
                  {order.pickupDate && (
                    <p><span className="font-medium">Pickup Date:</span> {new Date(order.pickupDate).toLocaleDateString('id-ID')}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Order Items:</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-900">Item</th>
                      <th className="text-left py-2 font-medium text-gray-900">Store</th>
                      <th className="text-center py-2 font-medium text-gray-900">Qty</th>
                      <th className="text-right py-2 font-medium text-gray-900">Unit Price</th>
                      <th className="text-right py-2 font-medium text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.orderItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 text-sm">{item.bundle.name}</td>
                        <td className="py-3 text-sm text-gray-600">{item.bundle.store.name}</td>
                        <td className="py-3 text-sm text-center">{item.quantity}</td>
                        <td className="py-3 text-sm text-right">
                          Rp {item.price.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 text-sm text-right font-medium">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium">
                    Rp {order.subtotalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Service Fee:</span>
                  <span className="text-sm font-medium">
                    Rp {order.serviceFee.toLocaleString('id-ID')}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-lg text-gray-900">
                    Rp {order.totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              </>
            )}

            {/* Footer */}
            <Separator />
            <div className="text-center text-sm text-gray-500 pt-4">
              <p>Thank you for your business!</p>
              <p className="mt-1">This is a computer-generated invoice.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
