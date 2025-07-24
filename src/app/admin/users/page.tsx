import { Metadata } from 'next'
import { UserAdmin } from '@/features/admin/users'

export const metadata: Metadata = {
  title: 'Manajemen User | Admin Perdami Store',
  description: 'Kelola akun admin dan customer Perdami Store',
}

export default function UsersAdminPage() {
  return <UserAdmin />
}
