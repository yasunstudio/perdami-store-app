'use client';

import { Metadata } from 'next'
import { useEffect } from 'react'
import { isStoreClosed } from '@/lib/timezone'
import { BundlesPageView } from '@/features/bundles/components/bundles-page-view'

// Note: metadata export is moved to a separate file since this is now a client component
export default function BundlesPage() {
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

  return <BundlesPageView />
}
