// Script untuk mengupdate maintenance message di database
const { PrismaClient } = require('@prisma/client')

async function updateMaintenanceMessage() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Updating maintenance message in database...')
    
    const newMessage = `🔧 Order Tutup Sementara - Dibuka Besok Pagi

Mohon maaf, sistem pemesanan Perdami Store ditutup sementara untuk persiapan event.

📅 Order akan dibuka kembali: BESOK PAGI
⏰ Estimasi waktu: Sekitar pukul 07:00 WIB

Kami sedang mempersiapkan segala sesuatu agar proses pemesanan berjalan lancar di hari event.

Terima kasih atas kesabaran Anda! 🙏`
    
    // Update app settings
    const settings = await prisma.appSettings.updateMany({
      data: {
        maintenanceMessage: newMessage,
        isMaintenanceMode: true
      }
    })
    
    console.log('✅ Updated', settings.count, 'records')
    
    // Verify update
    const updated = await prisma.appSettings.findFirst()
    console.log('\n📝 New maintenance message:')
    console.log('---')
    console.log(updated.maintenanceMessage)
    console.log('---')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateMaintenanceMessage()
