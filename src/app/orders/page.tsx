import { Metadata } from 'next'
import { Suspense } from 'react'
import OrdersPage from '@/features/orders/orders-list'

export const metadata: Metadata = {
  title: 'Pesanan Saya - Perdami Store',
  description: 'Lihat riwayat dan status pesanan Anda',
}

function OrdersLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrdersPageWrapper() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersPage />
    </Suspense>
  )
}
