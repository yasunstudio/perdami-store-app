'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { OrderInformation } from '@/features/admin/components/order-management/order-information'
import { OrderItems } from '@/features/admin/components/order-management/order-items'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, ArrowLeft, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface OrderWithDetails {
  id: string
  orderNumber: string
  userId: string
  bankId: string | null
  totalAmount: number
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  pickupMethod: 'VENUE'
  notes?: string | null
  createdAt: string
  updatedAt: string
  // Backward compatibility fields
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentMethod: 'BANK_TRANSFER'
  paymentProof?: string
  user: {
    id: string
    name: string | null
    email: string
    phone?: string | null
  }
  orderItems: Array<{
    id: string
    orderId: string
    bundleId: string
    quantity: number
    price: number
    bundle: {
      id: string
      name: string
      price: number
      image?: string | null
      storeId: string
      store: {
        id: string
        name: string
      }
    }
  }>
  items: Array<{
    id: string
    bundleId: string
    quantity: number
    price: number
    bundle: {
      id: string
      name: string
      price: number
      image?: string | null
      store: {
        id: string
        name: string
      }
    }
  }>
  bank?: {
    id: string
    name: string
    accountNumber: string
    accountName: string
  } | null
  payment?: {
    id: string
    status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
    method: 'BANK_TRANSFER'
    amount: number
    proofUrl?: string | null
    notes?: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching order details for ID:', orderId)
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order tidak ditemukan')
        }
        if (response.status === 401) {
          throw new Error('Anda tidak memiliki akses ke halaman ini')
        }
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error('Gagal memuat detail order')
      }
      
      const data = await response.json()
      console.log('Received order data:', data)
      
      // Set order data directly from API response
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderUpdate = () => {
    fetchOrderDetails()
    toast.success('Order berhasil diperbarui')
  }

  const handleBackToList = () => {
    router.push('/admin/orders')
  }

  if (loading) {
    return (
      <AdminPageLayout 
        title="Memuat Order..."
        description="Sedang memuat detail order"
        showBackButton={true}
        backUrl="/admin/orders"
      >
        <div className="space-y-6">          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  if (error) {
    return (
      <AdminPageLayout 
        title="Error"
        description="Terjadi kesalahan saat memuat order"
        showBackButton={true}
        backUrl="/admin/orders"
      >          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Terjadi Kesalahan</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={fetchOrderDetails} variant="outline">
                Coba Lagi
              </Button>
            </div>
          </div>
      </AdminPageLayout>
    )
  }

  if (!order) {
    return (
      <AdminPageLayout 
        title="Order Tidak Ditemukan"
        description="Order dengan ID tersebut tidak ditemukan"
        showBackButton={true}
        backUrl="/admin/orders"
      >
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Order Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">Order dengan ID tersebut tidak ditemukan.</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout 
      title={`Order #${order.orderNumber}`}
      description={`Manajemen order dari ${order.user.name || 'Pengguna'}`}
      showBackButton={true}
      backUrl="/admin/orders"
      onRefresh={handleOrderUpdate}
    >
      <div className="space-y-6">
        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6">
          {/* Order Information */}
          <OrderInformation 
            order={{
              id: order.id,
              orderNumber: order.orderNumber,
              subtotalAmount: order.totalAmount - 25000, // Assuming 25k service fee
              serviceFee: 25000,
              totalAmount: order.totalAmount,
              orderStatus: order.orderStatus,
              paymentStatus: order.paymentStatus,
              paymentMethod: order.paymentMethod,
              paymentProof: order.paymentProof,
              notes: order.notes,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              user: order.user,
              bank: order.bank
            }}
            onOrderUpdate={handleOrderUpdate}
          />

          {/* Order Items */}
          <OrderItems 
            order={{
              id: order.id,
              orderNumber: order.orderNumber,
              createdAt: order.createdAt,
              orderStatus: order.orderStatus,
              paymentStatus: order.paymentStatus,
              payment: order.payment ? {
                method: order.payment.method
              } : undefined,
              user: {
                name: order.user.name,
                email: order.user.email,
                phone: order.user.phone
              }
            }}
            items={order.items}
            totalAmount={order.totalAmount}
          />
        </div>
      </div>
    </AdminPageLayout>
  )
}
