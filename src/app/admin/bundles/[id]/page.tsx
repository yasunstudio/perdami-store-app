import { BundleDetailPage } from '@/features/admin/bundles/components/bundle-detail-page'

export default function AdminBundleDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  return <BundleDetailPage bundleId={params.id} />
}
