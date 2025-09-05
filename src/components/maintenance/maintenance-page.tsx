import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, Wrench, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface MaintenancePageProps {
  message?: string
}

export function MaintenancePage({ message }: MaintenancePageProps) {
  const defaultMessage = `Mohon maaf, aplikasi Perdami Store sedang dalam tahap pemeliharaan untuk meningkatkan layanan. 

Silakan coba lagi dalam beberapa saat.

Untuk informasi lebih lanjut, hubungi tim organizer event.`

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-4">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-full flex items-center justify-center shadow-lg">
              <Wrench className="w-10 h-10 text-orange-600 dark:text-orange-400" />
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                🔧 Sistem Dalam Pemeliharaan
              </CardTitle>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Perdami Store Event 2025
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-0">
            {/* Main Message */}
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">
                {message || defaultMessage}
              </p>
            </div>
            
            {/* Time Estimate Card */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Estimasi Waktu Pemeliharaan
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Biasanya selesai dalam 15-30 menit
                  </p>
                </div>
              </div>
            </div>
            
            {/* Important Information */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-200 dark:bg-amber-800 rounded-lg mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Informasi Penting
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Data pesanan Anda tetap aman
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Tidak ada transaksi yang hilang
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Silakan coba akses kembali setelah pemeliharaan selesai
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleRefresh}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all duration-200 h-12"
                size="lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Coba Lagi
              </Button>
              
              <Link href="/auth/login" className="flex-1">
                <Button 
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 h-12"
                  size="lg"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Ke Halaman Login
                </Button>
              </Link>
            </div>
            
            {/* Support Info */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Butuh bantuan? Hubungi tim organizer event
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Maintenance ID: {new Date().getTime().toString().slice(-6)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Perdami Store © 2025 • Event PIT PERDAMI 2025
          </p>
        </div>
      </div>
    </div>
  )
}
