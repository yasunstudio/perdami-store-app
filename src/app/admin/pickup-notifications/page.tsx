import { Metadata } from 'next'
import { PickupNotificationManagement } from '@/components/admin/pickup-notification-management'

export const metadata: Metadata = {
  title: 'Pickup Notification Management | Admin',
  description: 'Kelola notifikasi pickup reminder untuk pesanan',
}

export default function PickupNotificationManagementPage() {
  return <PickupNotificationManagement />
}
