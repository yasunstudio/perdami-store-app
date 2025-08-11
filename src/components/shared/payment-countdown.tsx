'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Order } from '@/types'

interface PaymentCountdownProps {
  order: Order
  onRefresh?: () => void
  compact?: boolean
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function PaymentCountdown({ order, onRefresh, compact = false }: PaymentCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  })
  const [isExpired, setIsExpired] = useState(false)
  const [status, setStatus] = useState<'normal' | 'warning' | 'danger' | 'expired'>('normal')

  // Calculate payment deadline (24 hours from order creation)
  const getPaymentDeadline = useCallback(() => {
    const deadline = new Date(order.createdAt)
    deadline.setHours(deadline.getHours() + 24)
    return deadline
  }, [order.createdAt])

  const calculateTimeRemaining = useCallback(() => {
    const now = new Date()
    const deadline = getPaymentDeadline()
    const diff = deadline.getTime() - now.getTime()

    if (diff <= 0) {
      setIsExpired(true)
      setStatus('expired')
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0
      }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    // Set status based on time remaining
    if (diff <= 30 * 60 * 1000) { // 30 minutes
      setStatus('danger')
    } else if (diff <= 60 * 60 * 1000) { // 1 hour
      setStatus('warning')
    } else {
      setStatus('normal')
    }

    return {
      days,
      hours,
      minutes,
      seconds,
      total: diff
    }
  }, [getPaymentDeadline])

  useEffect(() => {
    // Only show countdown for pending orders with pending payment
    // AND no payment proof uploaded yet
    if (order.orderStatus !== 'PENDING' || 
        order.paymentStatus !== 'PENDING' ||
        (order.payment && order.payment.proofUrl)) {
      return
    }

    const updateTimer = () => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [order.orderStatus, order.paymentStatus, calculateTimeRemaining])

  // Don't show countdown if order is not pending, payment is not pending, or proof is uploaded
  const paymentStatus = order.payment?.status || order.paymentStatus
  if (order.orderStatus !== 'PENDING' || 
      paymentStatus !== 'PENDING' ||
      (order.payment && order.payment.proofUrl)) {
    return null
  }

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0')
  }

  const getStatusColor = () => {
    switch (status) {
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      case 'danger':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'normal':
        return <Clock className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'danger':
        return <AlertTriangle className="h-4 w-4" />
      case 'expired':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'normal':
        return 'Waktu pembayaran masih cukup'
      case 'warning':
        return 'Segera lakukan pembayaran!'
      case 'danger':
        return 'URGENT! Pembayaran akan berakhir dalam 30 menit'
      case 'expired':
        return 'Waktu pembayaran telah habis'
      default:
        return 'Waktu pembayaran'
    }
  }

  const getAlertVariant = () => {
    switch (status) {
      case 'danger':
      case 'expired':
        return 'destructive'
      case 'warning':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <Card className={`border-2 border-dashed ${compact ? 'border border-dashed' : ''}`}>
      <CardContent className={`${compact ? 'p-3' : 'p-4 sm:p-6'}`}>
        <div className={`space-y-${compact ? '2' : '4'}`}>
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <h3 className={`font-medium ${compact ? 'text-xs' : 'text-sm sm:text-base'}`}>
                {compact ? 'Batas Bayar' : 'Batas Waktu Pembayaran'}
              </h3>
            </div>
            <Badge className={getStatusColor()}>
              {isExpired ? 'Kadaluarsa' : (compact ? 
                (status === 'danger' ? 'URGENT!' : 
                 status === 'warning' ? 'Segera!' : 'OK') : 
                getStatusMessage())}
            </Badge>
          </div>

          {/* Countdown Timer */}
          {!isExpired ? (
            <div className={`grid grid-cols-4 gap-${compact ? '1' : '2 sm:gap-4'}`}>
              <div className="text-center">
                <div className={`bg-muted rounded-lg ${compact ? 'p-1' : 'p-2 sm:p-3'}`}>
                  <div className={`${compact ? 'text-sm' : 'text-lg sm:text-2xl'} font-bold text-primary`}>
                    {formatTime(timeRemaining.days)}
                  </div>
                  <div className={`${compact ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}>
                    Hari
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className={`bg-muted rounded-lg ${compact ? 'p-1' : 'p-2 sm:p-3'}`}>
                  <div className={`${compact ? 'text-sm' : 'text-lg sm:text-2xl'} font-bold text-primary`}>
                    {formatTime(timeRemaining.hours)}
                  </div>
                  <div className={`${compact ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}>
                    Jam
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className={`bg-muted rounded-lg ${compact ? 'p-1' : 'p-2 sm:p-3'}`}>
                  <div className={`${compact ? 'text-sm' : 'text-lg sm:text-2xl'} font-bold text-primary`}>
                    {formatTime(timeRemaining.minutes)}
                  </div>
                  <div className={`${compact ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}>
                    Menit
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className={`bg-muted rounded-lg ${compact ? 'p-1' : 'p-2 sm:p-3'}`}>
                  <div className={`${compact ? 'text-sm' : 'text-lg sm:text-2xl'} font-bold text-primary`}>
                    {formatTime(timeRemaining.seconds)}
                  </div>
                  <div className={`${compact ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}>
                    Detik
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <XCircle className={`${compact ? 'h-6 w-6' : 'h-12 w-12'} mx-auto mb-2 text-red-500`} />
              <div className={`${compact ? 'text-sm' : 'text-lg'} font-medium text-red-600`}>
                {compact ? 'Waktu Habis' : 'Waktu Pembayaran Telah Habis'}
              </div>
              {!compact && (
                <div className="text-sm text-muted-foreground">
                  Pesanan ini akan dibatalkan secara otomatis
                </div>
              )}
            </div>
          )}

          {/* Alert Messages - Only show in non-compact mode */}
          {!compact && (
            <>
              {status === 'danger' && !isExpired && (
                <Alert variant={getAlertVariant()}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Perhatian!</strong> Pembayaran akan berakhir dalam 30 menit. 
                    Pesanan akan dibatalkan otomatis jika tidak dibayar tepat waktu.
                  </AlertDescription>
                </Alert>
              )}

              {status === 'warning' && !isExpired && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Waktu pembayaran tinggal 1 jam lagi. Segera lakukan pembayaran untuk menghindari pembatalan pesanan.
                  </AlertDescription>
                </Alert>
              )}

              {isExpired && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pembayaran Kadaluarsa!</strong> Pesanan ini telah melewati batas waktu pembayaran 
                    dan akan dibatalkan secara otomatis. Stok produk akan dikembalikan ke inventory.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Refresh Button - Only show in non-compact mode */}
          {!compact && onRefresh && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="text-xs sm:text-sm"
              >
                Refresh Status
              </Button>
            </div>
          )}

          {/* Deadline Info - Only show in non-compact mode */}
          {!compact && (
            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              Batas waktu: {getPaymentDeadline().toLocaleString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
