import { Metadata } from 'next'
import { StoreFormPage } from '../../../../features/admin/stores/components/store-form-page'

export const metadata: Metadata = {
  title: 'Tambah Toko Baru | Admin Perdami Store',
  description: 'Tambah toko partner baru ke dalam sistem',
}

export default function NewStorePage() {
  return <StoreFormPage mode="create" />
}