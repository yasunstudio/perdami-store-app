'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Clock, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  MapPin,
  Calendar,
  Loader2,
  Bell
} from 'lucide-react'

interface OrderProgressControlsProps {
  orderId: string
  orderNumber: string
  currentStatus: string
  onStatusUpdate?: () => void
}

interface ProgressAction {
  id: string
  label: string
  action: string
  icon: React.ReactNode
  description: string
  requiresInput?: boolean
  disabled?: boolean
}

export function OrderProgressControls({ 
  orderId, 
  orderNumber, 
  currentStatus,
  onStatusUpdate 
}: OrderProgressControlsProps) {
  const [loading, setLoading] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    estimatedTime: '',
    pickupTime: '',
    pickupLocation: 'Venue Event',
    pickupHours: '08:00 - 17:00',
    reason: '',
    notes: ''
  })

  const progressActions: ProgressAction[] = [
    {
      id: 'start_preparation',
      label: 'Mulai Persiapan',
      action: 'start_preparation',
      icon: <Package className="h-4 w-4" />,
      description: 'Tandai pesanan mulai disiapkan',
      requiresInput: true,
      disabled: !['CONFIRMED'].includes(currentStatus)
    },
    {
      id: 'complete_preparation',
      label: 'Selesai Persiapan',
      action: 'complete_preparation',
      icon: <CheckCircle className="h-4 w-4" />,
      description: 'Tandai pesanan selesai disiapkan',
      requiresInput: true,
      disabled: !['PROCESSING'].includes(currentStatus)
    },
    {
      id: 'mark_delayed',
      label: 'Tandai Tertunda',
      action: 'mark_delayed',
      icon: <AlertTriangle className="h-4 w-4" />,
      description: 'Beri tahu customer bahwa pesanan tertunda',
      requiresInput: true,
      disabled: !['PROCESSING'].includes(currentStatus)
    },
    {
      id: 'ready_for_pickup',
      label: 'Siap Diambil',
      action: 'ready_for_pickup',
      icon: <MapPin className="h-4 w-4" />,
      description: 'Tandai pesanan siap untuk diambil',
      requiresInput: true,
      disabled: !['PROCESSING'].includes(currentStatus)
    }
  ]

  const handleProgressAction = async (action: string) => {
    if (!action) return

    setLoading(true)
    try {
      const payload: any = {
        action,
        orderId,
        ...formData
      }

      // Remove empty fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
          delete payload[key]
        }
      })

      const response = await fetch('/api/admin/order-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update order progress')
      }

      toast.success(result.message || 'Order progress updated successfully')
      
      // Reset form
      setFormData({
        estimatedTime: '',
        pickupTime: '',
        pickupLocation: 'Venue Event',
        pickupHours: '08:00 - 17:00',
        reason: '',
        notes: ''
      })
      setSelectedAction(null)

      // Refresh parent component
      if (onStatusUpdate) {
        onStatusUpdate()
      }

    } catch (error) {
      console.error('Error updating order progress:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update order progress')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PROCESSING':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Menunggu'
      case 'CONFIRMED':
        return 'Dikonfirmasi'
      case 'PROCESSING':
        return 'Diproses'
      case 'READY':
        return 'Siap Diambil'
      case 'COMPLETED':
        return 'Selesai'
      default:
        return status
    }
  }

  const renderInputFields = (action: string) => {
    switch (action) {
      case 'start_preparation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="estimatedTime">Estimasi Waktu (Opsional)</Label>
              <Input
                id="estimatedTime"
                placeholder="Contoh: 30 menit"
                value={formData.estimatedTime}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
        )

      case 'complete_preparation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pickupTime">Waktu Pengambilan (Opsional)</Label>
              <Input
                id="pickupTime"
                placeholder="Contoh: 14:00 - 16:00"
                value={formData.pickupTime}
                onChange={(e) => setFormData(prev => ({ ...prev, pickupTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
        )

      case 'mark_delayed':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Alasan Keterlambatan *</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alasan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Antrian panjang">Antrian panjang</SelectItem>
                  <SelectItem value="Bahan habis">Bahan habis</SelectItem>
                  <SelectItem value="Kendala teknis">Kendala teknis</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estimatedTime">Estimasi Waktu Baru (Opsional)</Label>
              <Input
                id="estimatedTime"
                placeholder="Contoh: 1 jam lagi"
                value={formData.estimatedTime}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
        )

      case 'ready_for_pickup':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pickupLocation">Lokasi Pengambilan *</Label>
              <Select
                value={formData.pickupLocation}
                onValueChange={(value) => setFormData(prev => ({ ...prev, pickupLocation: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lokasi..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venue Event">Venue Event</SelectItem>
                  <SelectItem value="Stand Perdami">Stand Perdami</SelectItem>
                  <SelectItem value="Counter Utama">Counter Utama</SelectItem>
                  <SelectItem value="Pintu Masuk">Pintu Masuk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pickupHours">Jam Operasional *</Label>
              <Select
                value={formData.pickupHours}
                onValueChange={(value) => setFormData(prev => ({ ...prev, pickupHours: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jam..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00 - 17:00">08:00 - 17:00</SelectItem>
                  <SelectItem value="09:00 - 18:00">09:00 - 18:00</SelectItem>
                  <SelectItem value="10:00 - 16:00">10:00 - 16:00</SelectItem>
                  <SelectItem value="24 Jam">24 Jam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Kontrol Progress Pesanan
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status saat ini:</span>
          <Badge className={getStatusColor(currentStatus)}>
            {getStatusText(currentStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {progressActions.map((progressAction) => (
            <Dialog key={progressAction.id}>
              <DialogTrigger asChild>
                <Button
                  variant={progressAction.disabled ? "secondary" : "outline"}
                  disabled={progressAction.disabled || loading}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => {
                    if (!progressAction.requiresInput) {
                      handleProgressAction(progressAction.action)
                    } else {
                      setSelectedAction(progressAction.action)
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {progressAction.icon}
                    <span className="font-medium">{progressAction.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left">
                    {progressAction.description}
                  </span>
                </Button>
              </DialogTrigger>
              
              {progressAction.requiresInput && (
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {progressAction.icon}
                      {progressAction.label}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <Alert>
                      <Bell className="h-4 w-4" />
                      <AlertDescription>
                        Customer akan menerima notifikasi tentang update ini melalui email dan in-app notification.
                      </AlertDescription>
                    </Alert>

                    {renderInputFields(progressAction.action)}

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleProgressAction(progressAction.action)}
                        disabled={loading || (progressAction.action === 'mark_delayed' && !formData.reason)}
                        className="flex-1"
                      >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {progressAction.label}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          ))}
        </div>

        {currentStatus === 'READY' && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Pesanan Siap Diambil</span>
            </div>
            <p className="text-sm text-green-700">
              Customer telah menerima notifikasi bahwa pesanan siap untuk diambil. 
              Sistem akan otomatis mengirim pengingat jika pesanan belum diambil dalam 1 jam.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
