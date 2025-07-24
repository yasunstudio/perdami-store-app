import { Metadata } from 'next'
import { BankFormPage } from '@/features/admin/banks/index'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: 'Edit Bank | Admin Perdami Store',
  description: 'Edit informasi bank',
}

export default async function EditBankPage({ params }: PageProps) {
  const { id } = await params
  return <BankFormPage mode="edit" bankId={id} />
}