import { Suspense } from 'react'
import OrderDetailPage from '@/features/orders/order-detail'

interface OrderDetailProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    status?: string
  }>
}

function OrderDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function OrderDetailPageWrapper({ params, searchParams }: OrderDetailProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  return (
    <Suspense fallback={<OrderDetailLoading />}>
      <OrderDetailPage 
        orderId={resolvedParams.id} 
        status={resolvedSearchParams.status}
      />
    </Suspense>
  )
}