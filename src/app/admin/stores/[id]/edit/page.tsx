import { Metadata } from 'next'
import { StoreFormPage } from '../../../../../features/admin/stores/components/store-form-page'

interface EditStorePageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: 'Edit Toko | Admin Perdami Store',
  description: 'Edit informasi toko partner',
}

export default async function EditStorePage({ params }: EditStorePageProps) {
  const { id } = await params
  return <StoreFormPage mode="edit" storeId={id} />
}