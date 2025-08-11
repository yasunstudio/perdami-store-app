import { Metadata } from 'next'
import { EditUserPage } from '../../../../../features/admin/users/components/edit-user-page'

interface EditUserPageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: 'Edit User | Admin Perdami Store',
  description: 'Edit informasi user',
}

export default async function UserEditPage({ params }: EditUserPageProps) {
  const { id } = await params
  return <EditUserPage userId={id} />
}
