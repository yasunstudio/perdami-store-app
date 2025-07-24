// Payment Actions Component
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePaymentActions, usePaymentValidation } from '@/hooks/use-payment'
import { 
  getPaymentStatusInfo, 
  canUploadPaymentProof, 
  canCustomerCancelOrder 
} from '@/lib/utils/payment.utils'
import type { OrderWithPayment } from '@/lib/utils/payment.utils'
import { useState, useRef } from 'react'
import { Upload, X, RotateCcw, Loader2 } from 'lucide-react'

interface PaymentActionsProps {
  order: OrderWithPayment
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

export function PaymentActions({ 
  order, 
  onSuccess, 
  onError, 
  className = '' 
}: PaymentActionsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const paymentInfo = getPaymentStatusInfo(order)
  const canUploadProof = canUploadPaymentProof(order)
  const canCancel = canCustomerCancelOrder(order)
  
  const { 
    uploadPaymentProof, 
    cancelOrder, 
    retryPayment, 
    uploadingProof, 
    cancelling, 
    retrying 
  } = usePaymentActions({ order, onSuccess, onError })
  
  const { errors, validatePaymentProof, clearErrors } = usePaymentValidation(order)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      clearErrors()
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    if (!validatePaymentProof(selectedFile)) return
    
    const success = await uploadPaymentProof(selectedFile)
    if (success) {
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCancel = async () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      await cancelOrder()
    }
  }

  const handleRetry = async () => {
    await retryPayment()
  }

  if (!canUploadProof && !canCancel && !paymentInfo.isFailed) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Aksi Pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Payment Proof */}
        {canUploadProof && (
          <div className="space-y-3">
            <Label htmlFor="payment-proof">Upload Bukti Pembayaran</Label>
            <div className="flex items-center gap-2">
              <Input
                id="payment-proof"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadingProof}
                size="sm"
              >
                {uploadingProof ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload
              </Button>
            </div>
            {errors.file && (
              <p className="text-sm text-red-600">{errors.file}</p>
            )}
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <span className="text-sm text-blue-800">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Retry Payment */}
        {paymentInfo.isFailed && (
          <Button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full"
            variant="outline"
          >
            {retrying ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Coba Bayar Lagi
          </Button>
        )}

        {/* Cancel Order */}
        {canCancel && (
          <Button
            onClick={handleCancel}
            disabled={cancelling}
            variant="destructive"
            className="w-full"
          >
            {cancelling ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Batalkan Pesanan
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
