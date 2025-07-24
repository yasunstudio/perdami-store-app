'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Info, 
  Shield, 
  Camera,
  FileText,
  AlertTriangle,
  Smartphone,
  Eye,
  Upload
} from 'lucide-react'

interface PaymentProofInfoProps {
  hasProof: boolean
  bankName?: string
  totalAmount?: number
  className?: string
}

export function PaymentProofInfo({ 
  hasProof, 
  bankName, 
  totalAmount, 
  className 
}: PaymentProofInfoProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Upload className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Upload Bukti Transfer</h3>
      </div>
      
      {/* Status Card */}
      <Card className={hasProof 
        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30" 
        : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
      }>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                hasProof 
                  ? "bg-green-100 dark:bg-green-900/50" 
                  : "bg-amber-100 dark:bg-amber-900/50"
              }`}>
                {hasProof ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                hasProof 
                  ? "text-green-800 dark:text-green-200" 
                  : "text-amber-800 dark:text-amber-200"
              }`}>
                {hasProof ? "Bukti Transfer Berhasil Diupload" : "Menunggu Bukti Transfer"}
              </h4>
              <p className={`mt-1 text-xs ${
                hasProof 
                  ? "text-green-700 dark:text-green-300" 
                  : "text-amber-700 dark:text-amber-300"
              }`}>
                {hasProof 
                  ? "Bukti transfer Anda telah diterima dan sedang diverifikasi oleh tim kami." 
                  : "Silakan upload bukti transfer untuk melanjutkan proses pembayaran."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            {hasProof ? "Langkah Selanjutnya" : "Cara Upload Bukti Transfer"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasProof ? (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Verifikasi Pembayaran</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tim kami akan memverifikasi bukti transfer dalam 1-24 jam</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Konfirmasi & Proses</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pesanan akan diproses setelah pembayaran dikonfirmasi</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifikasi Status</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Anda akan menerima notifikasi update status pesanan</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CreditCard className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Transfer ke Rekening</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Transfer sebesar <span className="font-semibold">Rp {totalAmount?.toLocaleString('id-ID')}</span> ke {bankName}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Camera className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Foto Bukti Transfer</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ambil foto yang jelas dari struk atau screenshot transfer</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Upload File</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Upload file JPG, PNG, atau PDF maksimal 5MB</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Tips Foto Bukti Transfer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center space-x-2 text-xs text-blue-700 dark:text-blue-300">
            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
            <span>Pastikan foto terlihat jelas dan tidak buram</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-blue-700 dark:text-blue-300">
            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
            <span>Sertakan informasi tanggal dan jumlah transfer</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-blue-700 dark:text-blue-300">
            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
            <span>Gunakan pencahayaan yang baik saat mengambil foto</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-blue-700 dark:text-blue-300">
            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
            <span>File akan otomatis tersimpan setelah upload berhasil</span>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Keamanan Data Terjamin
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Bukti transfer Anda disimpan dengan aman dan hanya digunakan untuk verifikasi pembayaran. 
                Data akan dihapus setelah proses selesai.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasProof && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Bukti Transfer Dapat Dilihat
                </span>
              </div>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Tersimpan
              </Badge>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
              Tim customer service dapat melihat bukti transfer Anda untuk proses verifikasi.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
