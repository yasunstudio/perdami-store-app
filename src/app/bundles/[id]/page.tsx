'use client';

import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isStoreClosed } from '@/lib/timezone'
import { BundleDetailView } from '@/features/bundles/components/bundle-detail-view'
import { BundleService } from '@/lib/services/bundle.service'

interface BundlePageProps {
  params: {
    id: string
  }
}

export default function BundlePage({ params }: BundlePageProps) {
  const [bundle, setBundle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect to homepage if store is closed
    if (isStoreClosed()) {
      window.location.href = '/';
      return;
    }

    // Load bundle data
    const loadBundle = async () => {
      try {
        const bundleData = await BundleService.getById(params.id)
        
        if (!bundleData) {
          notFound()
          return
        }

        setBundle(bundleData)
      } catch (error) {
        console.error('Error loading bundle:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    loadBundle()
  }, [params.id]);

  // If store is closed, show nothing (will redirect)
  if (isStoreClosed()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Bundle not found handled by notFound() call
  if (!bundle) {
    return null;
  }

  return <BundleDetailView bundle={bundle} />
}
