'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePickerWithRange, DateRange } from '@/components/ui/date-range-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { OrderStatus, PaymentStatus } from '@/types'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar,
  Filter,
  Users,
  Package,
  CreditCard,
  Loader2
} from 'lucide-react'

interface ExportFilters {
  dateRange?: DateRange
  orderStatus?: OrderStatus | 'all'
  paymentStatus?: PaymentStatus | 'all'
  includeCustomerInfo: boolean
  includeOrderItems: boolean
  includePaymentInfo: boolean
}

interface OrderExportProps {
  totalOrders: number
}

export function OrderExport({ totalOrders }: OrderExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('excel')
  const [filters, setFilters] = useState<ExportFilters>({
    orderStatus: 'all',
    paymentStatus: 'all',
    includeCustomerInfo: true,
    includeOrderItems: true,
    includePaymentInfo: true
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      
      if (filters.dateRange?.from) {
        params.append('startDate', format(filters.dateRange.from, 'yyyy-MM-dd'))
      }
      if (filters.dateRange?.to) {
        params.append('endDate', format(filters.dateRange.to, 'yyyy-MM-dd'))
      }
      if (filters.orderStatus && filters.orderStatus !== 'all') {
        params.append('orderStatus', filters.orderStatus)
      }
      if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        params.append('paymentStatus', filters.paymentStatus)
      }
      
      params.append('format', exportFormat)
      params.append('includeCustomerInfo', filters.includeCustomerInfo.toString())
      params.append('includeOrderItems', filters.includeOrderItems.toString())
      params.append('includePaymentInfo', filters.includePaymentInfo.toString())

      const response = await fetch(`/api/admin/orders/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Gagal mengekspor data')
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `orders-export-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Data berhasil diekspor')
      setIsOpen(false)
    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Gagal mengekspor data')
    } finally {
      setIsExporting(false)
    }
  }

  const getEstimatedRecords = () => {
    // This is a simplified estimation - in a real app, you'd call an API
    let estimated = totalOrders
    
    if (filters.orderStatus && filters.orderStatus !== 'all') {
      estimated = Math.floor(estimated * 0.7) // Rough estimation
    }
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      estimated = Math.floor(estimated * 0.8) // Rough estimation
    }
    if (filters.dateRange?.from || filters.dateRange?.to) {
      estimated = Math.floor(estimated * 0.5) // Rough estimation
    }
    
    return estimated
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Ekspor Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Ekspor Data Pesanan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Format File</Label>
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as 'csv' | 'excel')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (.xlsx)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV (.csv)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rentang Tanggal (Opsional)
            </Label>
            <DatePickerWithRange
              value={filters.dateRange}
              onChange={(dateRange: DateRange | undefined) => setFilters(prev => ({ ...prev, dateRange }))}
              className="w-full"
            />
          </div>

          {/* Status Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status Pesanan</Label>
              <Select 
                value={filters.orderStatus} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, orderStatus: value as OrderStatus | 'all' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="CONFIRMED">Dikonfirmasi</SelectItem>
                  <SelectItem value="READY">Siap</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status Pembayaran</Label>
              <Select 
                value={filters.paymentStatus} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value as PaymentStatus | 'all' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="PAID">Dibayar</SelectItem>
                  <SelectItem value="FAILED">Gagal</SelectItem>
                  <SelectItem value="REFUNDED">Dikembalikan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Data yang Disertakan</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customerInfo"
                  checked={filters.includeCustomerInfo}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, includeCustomerInfo: !!checked }))
                  }
                />
                <Label htmlFor="customerInfo" className="text-sm">
                  Informasi Pelanggan (nama, email, telepon)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="orderItems"
                  checked={filters.includeOrderItems}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, includeOrderItems: !!checked }))
                  }
                />
                <Label htmlFor="orderItems" className="text-sm">
                  Detail Item Pesanan
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="paymentInfo"
                  checked={filters.includePaymentInfo}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, includePaymentInfo: !!checked }))
                  }
                />
                <Label htmlFor="paymentInfo" className="text-sm">
                  Informasi Pembayaran
                </Label>
              </div>
            </div>
          </div>

          {/* Estimated Records */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Perkiraan jumlah record:</span>
                <span className="font-medium">{getEstimatedRecords().toLocaleString()} pesanan</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isExporting ? 'Mengekspor...' : 'Ekspor Data'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}