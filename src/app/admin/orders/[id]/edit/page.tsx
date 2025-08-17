'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { AdminOrderEditForm } from '@/components/admin/orders/admin-order-edit-form'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface OrderData {
  id: string
  orderNumber: string
  user: {
    name: string | null
  }
}

export default function AdminOrderEditPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrderBasicInfo()
    } else {
      setError('Order ID tidak valid')
      setLoading(false)
    }
  }, [orderId])

  const fetchOrderBasicInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching order details for edit page, ID:', orderId)
      
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
        if (response.status === 403) {
          throw new Error('Akses ditolak')
        }
        
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`Gagal memuat detail order (${response.status})`)
      }
      
      const data = await response.json()
      console.log('Received order data for edit:', data)
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order for edit:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat order')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderUpdate = () => {
    toast.success('Order berhasil diperbarui')
    router.push(`/admin/orders/${orderId}`)
  }

  // Early return for invalid orderId
  if (!orderId || typeof orderId !== 'string') {
    return (
      <AdminPageLayout 
        title="Error"
        description="Order ID tidak valid"
        showBackButton={true}
        backUrl="/admin/orders"
      >
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Order ID Tidak Valid</h2>
          <p className="text-muted-foreground mb-6">Order ID yang Anda akses tidak valid.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => router.push('/admin/orders')} variant="outline">
              Kembali ke Daftar Order
            </Button>
          </div>
        </div>
      </AdminPageLayout>
    )
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
      >
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Terjadi Kesalahan</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={fetchOrderBasicInfo} variant="outline">
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
      title={`Edit Order #${order.orderNumber}`}
      description={`Edit informasi dan status order dari ${order.user.name || 'Pengguna'}`}
      showBackButton={true}
      backUrl={`/admin/orders/${order.id}`}
      actions={
        <Button size="sm" variant="outline" onClick={() => router.push(`/admin/orders/${orderId}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Lihat Detail
        </Button>
      }
    >
      <AdminOrderEditForm orderId={orderId} onOrderUpdate={handleOrderUpdate} />
    </AdminPageLayout>
  )
}
