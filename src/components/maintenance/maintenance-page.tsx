import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Clock, Wrench } from 'lucide-react'

interface MaintenancePageProps {
  message?: string
}

export function MaintenancePage({ message }: MaintenancePageProps) {
  const defaultMessage = `
🔧 Sistem sedang dalam pemeliharaan

Mohon maaf, aplikasi Perdami Store sedang dalam tahap pemeliharaan untuk meningkatkan layanan. 
Silakan coba lagi dalam beberapa saat.

Untuk informasi lebih lanjut, hubungi tim organizer event.
  `

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <Wrench className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistem Dalam Pemeliharaan
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {message || defaultMessage}
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Estimasi Waktu Pemeliharaan
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Pemeliharaan biasanya selesai dalam 15-30 menit
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Informasi Penting
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Data pesanan Anda tetap aman</li>
                  <li>• Tidak ada transaksi yang hilang</li>
                  <li>• Silakan coba akses kembali setelah pemeliharaan selesai</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Coba Lagi
            </button>
          </div>
        </CardContent>
      </Card>
      
      <div className="fixed bottom-4 right-4 text-sm text-gray-500 dark:text-gray-400">
        Perdami Store © 2025
      </div>
    </div>
  )
}
