import { Suspense } from 'react'
import CheckoutPage from '@/features/checkout'

function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
            <div className="lg:col-span-1">
              <div className="h-80 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPage />
    </Suspense>
  )
}
