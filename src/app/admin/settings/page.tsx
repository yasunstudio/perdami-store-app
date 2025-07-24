import { Metadata } from 'next'
import { AdminPageWrapper } from '@/components/layout/admin-page-wrapper'
import { SettingsContainer } from '@/components/admin/settings-container'

export const metadata: Metadata = {
  title: 'Pengaturan | Admin Perdami Store',
  description: 'Kelola pengaturan sistem dan aplikasi',
}

export default function SettingsAdminPage() {
  return (
    <AdminPageWrapper
      title="Pengaturan Aplikasi"
      description="Kelola konfigurasi dan preferensi aplikasi Perdami Store"
    >
      <SettingsContainer />
    </AdminPageWrapper>
  )
}
