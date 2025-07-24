import { Metadata } from 'next'
import { BundleFormPageNew } from '@/features/admin/bundles/components/bundle-form-page-new'

export const metadata: Metadata = {
  title: 'Tambah Paket Produk | Admin Perdami Store',
  description: 'Buat paket produk baru',
}

export default function NewBundlePage() {
  return <BundleFormPageNew mode="create" />
}
