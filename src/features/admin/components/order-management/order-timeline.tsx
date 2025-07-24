'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  History, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  User,
  FileText,
  Loader2,
  CreditCard,
  Package,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface OrderTimelineProps {
  orderId: string
  onTimelineUpdate: () => void
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
      return <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
    case 'PROCESS_REFUND':
      return <RefreshCw className="h-4 w-4 text-blue-500 dark:text-blue-400" />
    case 'UPDATE_PAYMENT_STATUS':
      return <CreditCard className="h-4 w-4 text-green-500 dark:text-green-400" />
    case 'UPDATE_ORDER_STATUS':
      return <Package className="h-4 w-4 text-purple-500 dark:text-purple-400" />
    case 'ORDER_CREATED':
      return <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
    case 'ORDER_UPDATED':
      return <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
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
    case 'UPDATE_ORDER_STATUS':
      return 'Status Order Diperbarui'
    case 'ORDER_CREATED':
      return 'Order Dibuat'
    case 'ORDER_UPDATED':
      return 'Order Diperbarui'
    default:
      return action.replace(/_/g, ' ')
  }
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    case 'STAFF':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
    case 'USER':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700'
  }
}

export function OrderTimeline({ orderId, onTimelineUpdate }: OrderTimelineProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTimeline()
  }, [orderId])

  const fetchTimeline = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/orders/${orderId}/activity-logs`)
      if (!response.ok) {
        throw new Error('Failed to fetch timeline')
      }
      
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error fetching timeline:', error)
      setError('Gagal memuat timeline')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchTimeline()
    onTimelineUpdate()
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
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <History className="h-5 w-5" />
            Timeline Aktivitas
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
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <History className="h-5 w-5" />
            Timeline Aktivitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <History className="h-5 w-5" />
            Timeline Aktivitas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {logs.length} aktivitas
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Belum ada aktivitas tercatat untuk order ini
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] w-full">
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
                        <div className="p-1 bg-background border-2 border-border rounded-full">
                          {getActionIcon(log.action)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-foreground">
                              {getActionLabel(log.action)}
                            </h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getRoleBadgeColor(log.user.role)}`}
                            >
                              {log.user.role}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{log.user.name || log.user.email}</span>
                          </div>
                          
                          {details.reason && (
                            <div className="flex items-start gap-2 text-xs">
                              <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />
                              <div>
                                <strong className="text-foreground">Alasan:</strong>{' '}
                                <span className="text-muted-foreground">{details.reason}</span>
                              </div>
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
                              <Badge variant="secondary" className="text-xs">
                                {details.previousStatus}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                              <Badge variant="secondary" className="text-xs">
                                {details.newStatus}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {index < logs.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
