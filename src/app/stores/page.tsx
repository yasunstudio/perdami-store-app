'use client';

import { Metadata } from 'next'
import { useEffect } from 'react'
import { isStoreClosed } from '@/lib/timezone'
import StoresPage from '@/features/stores'

// Note: metadata moved since this is now a client component
export default function StoresPageWrapper() {
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

  return <StoresPage />
}
