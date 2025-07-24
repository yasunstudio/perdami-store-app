import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NotificationHistoryList } from '@/components/shared/notification-history-list'

export default async function NotificationHistoryPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  // Fetch user's notification history
  const notifications = await prisma.inAppNotification.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50 // Limit to last 50 notifications
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Riwayat Notifikasi</h1>
        <p className="text-gray-600 mt-2">
          Lihat semua notifikasi yang pernah Anda terima
        </p>
      </div>

      <NotificationHistoryList notifications={notifications} />
    </div>
  )
}
