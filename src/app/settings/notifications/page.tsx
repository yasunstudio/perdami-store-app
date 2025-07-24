import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NotificationSettingsForm } from '@/components/shared/notification-settings-form'

export default async function NotificationSettingsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  // Fetch user's notification settings
  const settings = await prisma.userNotificationSettings.findUnique({
    where: { userId: session.user.id }
  })

  // Create default settings if none exist
  const defaultSettings = {
    orderUpdates: true,
    paymentConfirmations: true,
    securityAlerts: true,
    accountUpdates: true,
    productAnnouncements: true,
    promotionalEmails: false,
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pengaturan Notifikasi</h1>
        <p className="text-gray-600 mt-2">
          Kelola preferensi notifikasi Anda untuk mendapatkan informasi yang paling relevan
        </p>
      </div>

      <NotificationSettingsForm 
        initialSettings={settings || defaultSettings}
        userId={session.user.id}
      />
    </div>
  )
}
