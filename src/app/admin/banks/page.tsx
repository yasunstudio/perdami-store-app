import { Metadata } from 'next'
import { BankManagementLayout } from '@/features/admin/banks/index'

export const metadata: Metadata = {
  title: 'Manajemen Bank | Admin Perdami Store',
  description: 'Kelola semua bank untuk metode pembayaran',
}

export default function BanksAdminPage() {
  return <BankManagementLayout />
}