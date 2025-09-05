import { MaintenancePage } from '@/components/maintenance'
import { getMaintenanceMessage } from '@/lib/maintenance'

export default async function Maintenance() {
  let message = ''
  
  try {
    message = await getMaintenanceMessage()
  } catch (error) {
    // Fallback for build time when database is not available
    console.log('Using fallback maintenance message for build')
    message = 'Mohon maaf, aplikasi Perdami Store sedang dalam tahap pemeliharaan untuk meningkatkan layanan.\n\nSilakan coba lagi dalam beberapa saat.\n\nUntuk informasi lebih lanjut, hubungi tim organizer event.'
  }
  
  return <MaintenancePage message={message} />
}
