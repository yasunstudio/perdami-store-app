import { Metadata } from 'next'
import { BankFormPage } from '@/features/admin/banks/index'

export const metadata: Metadata = {
  title: 'Tambah Bank | Admin Perdami Store',
  description: 'Tambahkan bank baru untuk metode pembayaran',
}

export default function NewBankPage() {
  return <BankFormPage mode="create" />
}