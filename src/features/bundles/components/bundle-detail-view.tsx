'use client'

import { ProductBundle } from '@/types'
import { BundleBreadcrumb } from './bundle-breadcrumb'
import { BundleImageGallery } from './bundle-image-gallery'
import { BundleProductInfo } from './bundle-product-info'
import { BundleOrderPanel } from './bundle-order-panel'

interface BundleDetailViewProps {
  bundle: ProductBundle & {
    store: {
      id: string
      name: string
      description: string | null
    }
  }
}

export function BundleDetailView({ bundle }: BundleDetailViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <BundleBreadcrumb bundleName={bundle.name} />

        {/* 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
          {/* Column 1: Image Gallery (33%) */}
          <div className="lg:col-span-4 order-1 lg:order-1">
            <BundleImageGallery bundle={bundle} />
          </div>

          {/* Column 2: Product Information (44%) */}
          <div className="lg:col-span-5 order-3 lg:order-2">
            <BundleProductInfo bundle={bundle} />
          </div>

          {/* Column 3: Order Panel (23%) */}
          <div className="lg:col-span-3 order-2 lg:order-3">
            <BundleOrderPanel bundle={bundle} />
          </div>
        </div>
      </div>
    </div>
  )
}
