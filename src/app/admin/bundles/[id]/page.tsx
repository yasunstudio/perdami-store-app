import { Suspense } from 'react'
import { BundleDetailPage } from '../../../../features/admin/bundles/components'

interface AdminBundleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminBundleDetailPage({ params }: AdminBundleDetailPageProps) {
  const { id } = await params
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BundleDetailPage bundleId={id} />
    </Suspense>
  )
}
