import { MaintenancePage } from '@/components/maintenance'
import { getMaintenanceMessage } from '@/lib/maintenance'

export default async function Maintenance() {
  let message = ''
  
  try {
    message = await getMaintenanceMessage()
  } catch (error) {
    // Fallback for build time when database is not available
    console.log('Using fallback maintenance message for build')
    message = '🔧 Order Tutup Sementara - Dibuka Besok Pagi\n\nMohon maaf, sistem pemesanan Perdami Store ditutup sementara untuk persiapan event.\n\n📅 Order akan dibuka kembali: BESOK PAGI\n⏰ Estimasi waktu: Sekitar pukul 08:00 WIB\n\nKami sedang mempersiapkan segala sesuatu agar proses pemesanan berjalan lancar di hari event.\n\nTerima kasih atas kesabaran Anda! 🙏'
  }
  
  return <MaintenancePage message={message} />
}
