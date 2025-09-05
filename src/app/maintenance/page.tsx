import { MaintenancePage } from '@/components/maintenance'
import { getMaintenanceMessage } from '@/lib/maintenance'

// Force dynamic rendering to ensure we always get fresh data from database
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Maintenance() {
  let message = ''
  
  try {
    message = await getMaintenanceMessage()
    console.log('✅ Successfully fetched maintenance message from database')
  } catch (error) {
    // Fallback for build time when database is not available
    console.error('❌ Failed to fetch maintenance message, using fallback:', error)
    message = '🔧 Order Tutup Sementara - Dibuka Besok Pagi\n\nMohon maaf, sistem pemesanan Perdami Store ditutup sementara untuk persiapan event.\n\n📅 Order akan dibuka kembali: BESOK PAGI\n⏰ Estimasi waktu: Sekitar pukul 07:00 WIB\n\nKami sedang mempersiapkan segala sesuatu agar proses pemesanan berjalan lancar di hari event.\n\nTerima kasih atas kesabaran Anda! 🙏'
  }
  
  return <MaintenancePage message={message} />
}
