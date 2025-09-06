'use client';

import { Suspense, useEffect } from 'react'
import { isStoreClosed } from '@/lib/timezone'
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
  useEffect(() => {
    // Redirect to homepage if store is closed
    if (isStoreClosed()) {
      window.location.href = '/';
    }
  }, []);

  // If store is closed, show nothing (will redirect)
  if (isStoreClosed()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPage />
    </Suspense>
  )
}
