// User Profile Notification Settings Page
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { NotificationSettingsPanel } from '@/features/user-notifications'

export const metadata: Metadata = {
  title: 'Pengaturan Notifikasi - Perdami Store',
  description: 'Kelola preferensi notifikasi dan komunikasi dari Perdami Store',
}

export default async function UserNotificationSettingsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/profile/notifications')
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <NotificationSettingsPanel />
    </div>
  )
}
