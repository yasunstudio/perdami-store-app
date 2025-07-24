import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SettingsContainer } from '@/components/admin/settings-container'

export const metadata: Metadata = {
  title: 'Pengaturan - Perdami Store',
  description: 'Kelola konfigurasi dan preferensi aplikasi Perdami Store',
}

export default async function SettingsPage() {
  const session = await auth()
  
  // Require authentication for settings access
  if (!session) {
    redirect('/auth/login?callbackUrl=/settings')
  }

  // Require admin role for settings access
  if (session.user?.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pengaturan Aplikasi</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Kelola konfigurasi dan preferensi aplikasi Perdami Store
        </p>
      </div>
      
      <SettingsContainer />
    </div>
  )
}
