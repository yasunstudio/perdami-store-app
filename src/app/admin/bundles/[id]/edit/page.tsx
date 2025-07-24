import { Metadata } from 'next'
import { BundleFormPageNew } from '@/features/admin/bundles/components/bundle-form-page-new'

interface EditBundlePageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: 'Edit Paket Produk | Admin Perdami Store',
  description: 'Edit informasi paket produk',
}

export default async function EditBundlePage({ params }: EditBundlePageProps) {
  const { id } = await params
  return <BundleFormPageNew mode="edit" bundleId={id} />
}
