'use client';

import { Metadata } from 'next'
import { useEffect } from 'react'
import { isStoreClosed } from '@/lib/timezone'
import StoreDetailPage from '@/features/stores/store-detail'

interface StorePageProps {
  params: Promise<{
    id: string
  }>
}

// Note: generateMetadata removed since this is now a client component
export default function StorePage({ params }: { params: { id: string } }) {
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

  return <StoreDetailPage storeId={params.id} />
}