'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePaymentStatus } from '@/hooks/use-payment-status'
import { RefreshCw, Loader2, X } from 'lucide-react'

interface ProcessRefundDialogProps {
  orderId: string
  orderNumber: string
  totalAmount: number
  onClose: () => void
  onSuccess?: () => void
}

export function ProcessRefundDialog({ 
  orderId, 
  orderNumber, 
  totalAmount, 
  onClose, 
  onSuccess 
}: ProcessRefundDialogProps) {
  const [reason, setReason] = useState('')
  const [refundAmount, setRefundAmount] = useState(totalAmount)
  const [refundMethod, setRefundMethod] = useState<'BANK_TRANSFER'>('BANK_TRANSFER')
  const [adminNotes, setAdminNotes] = useState('')
  const [refundReference, setRefundReference] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { loading, processRefund } = usePaymentStatus({
    onSuccess: () => {
      onSuccess?.()
      onClose()
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || refundAmount <= 0) return

    await processRefund(orderId, {
      reason: reason.trim(),
      refundAmount,
      refundMethod,
      adminNotes: adminNotes.trim() || undefined,
      refundReference: refundReference.trim() || undefined
    })
  }

  if (!showForm) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-5 w-5" />
            Proses Refund
          </CardTitle>
          <CardDescription>
            Order #{orderNumber} - Rp {totalAmount.toLocaleString('id-ID')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              Tindakan ini akan:
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Mengubah status pembayaran ke REFUNDED</li>
                <li>Membatalkan order (status: CANCELLED)</li>
                <li>Mengembalikan stok produk</li>
                <li>Mengirim notifikasi ke customer</li>
                <li>Mencatat transaksi refund</li>
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
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-5 w-5" />
            Proses Refund
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
            <Label htmlFor="reason">Alasan Refund *</Label>
            <Textarea
              id="reason"
              placeholder="Contoh: Produk tidak tersedia, kesalahan order, permintaan customer, dll."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={5}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refundAmount">Jumlah Refund *</Label>
            <Input
              id="refundAmount"
              type="number"
              placeholder="0"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              required
              min={0}
              max={totalAmount}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Maksimal: Rp {totalAmount.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refundMethod">Metode Refund *</Label>
            <Select 
              value={refundMethod} 
              onValueChange={(value) => setRefundMethod(value as 'BANK_TRANSFER')} 
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih metode refund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Transfer Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refundReference">Referensi Refund (Opsional)</Label>
            <Input
              id="refundReference"
              placeholder="Nomor referensi dari bank/sistem"
              value={refundReference}
              onChange={(e) => setRefundReference(e.target.value)}
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
              disabled={loading || !reason.trim() || refundAmount <= 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Proses Refund'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
