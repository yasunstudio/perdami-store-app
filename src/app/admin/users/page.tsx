import { Metadata } from 'next'
import { UserAdmin } from '@/features/admin/users'
import { AdminAuthWrapper } from '@/components/admin/admin-auth-wrapper'

export const metadata: Metadata = {
  title: 'Manajemen User | Admin Perdami Store',
  description: 'Kelola akun admin dan customer Perdami Store',
}

export default function UsersAdminPage() {
  return (
    <AdminAuthWrapper>
      <UserAdmin />
    </AdminAuthWrapper>
  )
}
