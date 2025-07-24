import { Metadata } from 'next'
import { BundleManagement } from '@/features/admin/bundles'

export const metadata: Metadata = {
  title: 'Manajemen Bundle | Admin Perdami Store',
  description: 'Kelola semua bundle produk dan informasinya',
}

export default function BundlesPage() {
  return <BundleManagement />
}
