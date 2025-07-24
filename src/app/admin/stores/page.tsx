import { Metadata } from 'next'
import { StoreManagement } from '@/features/admin/stores/index'

export const metadata: Metadata = {
  title: 'Manajemen Toko | Admin Perdami Store',
  description: 'Kelola semua toko partner dan informasinya',
}

export default function StoresAdminPage() {
  return <StoreManagement />
}
