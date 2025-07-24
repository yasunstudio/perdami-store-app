'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePaymentStatus } from '@/hooks/use-payment-status'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface MarkAsFailedDialogProps {
  orderId: string
  orderNumber: string
  totalAmount: number
  onClose: () => void
  onSuccess?: () => void
}

export function MarkAsFailedDialog({ 
  orderId, 
  orderNumber, 
  totalAmount, 
  onClose, 
  onSuccess 
}: MarkAsFailedDialogProps) {
  const [reason, setReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [refundRequired, setRefundRequired] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const { loading, markAsFailed } = usePaymentStatus({
    onSuccess: () => {
      onSuccess?.()
      onClose()
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    await markAsFailed(orderId, {
      reason: reason.trim(),
      adminNotes: adminNotes.trim() || undefined,
      refundRequired
    })
  }

  if (!showForm) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Tandai Pembayaran Gagal
          </CardTitle>
          <CardDescription>
            Order #{orderNumber} - Rp {totalAmount.toLocaleString('id-ID')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tindakan ini akan:
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Mengubah status pembayaran ke FAILED</li>
                <li>Membatalkan order (status: CANCELLED)</li>
                <li>Mengembalikan stok produk</li>
                <li>Mengirim notifikasi ke customer</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowForm(true)}
              className="flex-1"
            >
              Lanjutkan
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Tandai Pembayaran Gagal
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Order #{orderNumber} - Rp {totalAmount.toLocaleString('id-ID')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Pembayaran Gagal *</Label>
            <Textarea
              id="reason"
              placeholder="Contoh: Bukti transfer tidak valid, rekening tidak ditemukan, dll."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={5}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNotes">Catatan Admin (Opsional)</Label>
            <Textarea
              id="adminNotes"
              placeholder="Catatan internal untuk admin..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="refundRequired"
              checked={refundRequired}
              onCheckedChange={(checked) => setRefundRequired(checked === true)}
              disabled={loading}
            />
            <Label htmlFor="refundRequired" className="text-sm">
              Refund diperlukan (jika customer sudah transfer)
            </Label>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setShowForm(false)}
              disabled={loading}
              className="flex-1"
            >
              Kembali
            </Button>
            <Button 
              type="submit"
              variant="destructive" 
              disabled={loading || !reason.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Tandai Gagal'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
