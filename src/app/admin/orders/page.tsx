import { Metadata } from 'next'
import { OrderManagement } from '@/features/admin/orders'

export const metadata: Metadata = {
  title: 'Manajemen Pesanan | Admin Perdami Store',
  description: 'Kelola semua pesanan pelanggan dan status pembayaran',
}

export default function OrdersPage() {
  return <OrderManagement />
}