'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  History, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  User,
  FileText,
  Loader2
} from 'lucide-react'

interface PaymentStatusHistoryProps {
  orderId: string
  className?: string
}

interface ActivityLog {
  id: string
  action: string
  details: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'MARK_PAYMENT_FAILED':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'PROCESS_REFUND':
      return <RefreshCw className="h-4 w-4 text-blue-500" />
    case 'UPDATE_PAYMENT_STATUS':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

const getActionLabel = (action: string) => {
  switch (action) {
    case 'MARK_PAYMENT_FAILED':
      return 'Pembayaran Ditandai Gagal'
    case 'PROCESS_REFUND':
      return 'Refund Diproses'
    case 'UPDATE_PAYMENT_STATUS':
      return 'Status Pembayaran Diperbarui'
    default:
      return action
  }
}

export function PaymentStatusHistory({ orderId, className }: PaymentStatusHistoryProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentHistory()
  }, [orderId])

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/orders/${orderId}/payment-history`)
      if (!response.ok) {
        throw new Error('Failed to fetch payment history')
      }
      
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error fetching payment history:', error)
      setError('Gagal memuat riwayat pembayaran')
    } finally {
      setLoading(false)
    }
  }

  const parseDetails = (details: string) => {
    try {
      return JSON.parse(details)
    } catch {
      return { message: details }
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Riwayat Status Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Riwayat Status Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPaymentHistory}
              className="mt-4"
            >
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (logs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Riwayat Status Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Belum ada riwayat perubahan status pembayaran
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5" />
          Riwayat Status Pembayaran
        </CardTitle>
        <CardDescription>
          {logs.length} aktivitas tercatat
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-4">
            {logs.map((log, index) => {
              const details = parseDetails(log.details)
              
              return (
                <div key={log.id} className="relative">
                  {index < logs.length - 1 && (
                    <div className="absolute left-4 top-8 h-full w-px bg-border" />
                  )}
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">
                          {getActionLabel(log.action)}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {log.user.role}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{log.user.name || log.user.email}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {details.reason && (
                          <div className="flex items-start gap-2 text-xs">
                            <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              <strong>Alasan:</strong> {details.reason}
                            </span>
                          </div>
                        )}
                        
                        {details.refundAmount && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Jumlah Refund:</strong> Rp {details.refundAmount.toLocaleString('id-ID')}
                          </div>
                        )}
                        
                        {details.refundMethod && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Metode Refund:</strong> {details.refundMethod}
                          </div>
                        )}
                        
                        {details.refundReference && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Referensi:</strong> {details.refundReference}
                          </div>
                        )}
                        
                        {details.adminNotes && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Catatan Admin:</strong> {details.adminNotes}
                          </div>
                        )}
                        
                        {details.previousStatus && details.newStatus && (
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {details.previousStatus}
                            </Badge>
                            <span>→</span>
                            <Badge variant="outline" className="text-xs">
                              {details.newStatus}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < logs.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
