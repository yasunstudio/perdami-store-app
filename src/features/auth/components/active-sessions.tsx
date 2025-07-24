'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Monitor, Smartphone, Tablet, MapPin, Clock, LogOut, AlertTriangle } from 'lucide-react'

interface Session {
  id: string
  sessionToken: string
  expires: string
  createdAt: string
  updatedAt: string
  userAgent?: string
  ipAddress?: string
  isCurrent?: boolean
}

interface ActiveSessionsProps {
  userId: string
}

export function ActiveSessions({ userId }: ActiveSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRevoking, setIsRevoking] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [userId])

  const fetchSessions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}/sessions`)
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const data = await response.json()
      setSessions(data)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setError('Gagal memuat sesi aktif')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Apakah Anda yakin ingin mengakhiri sesi ini?')) {
      return
    }

    try {
      setIsRevoking(sessionId)
      setError('')
      
      const response = await fetch(`/api/users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke session')
      }

      await fetchSessions()
    } catch (error) {
      console.error('Error revoking session:', error)
      setError('Gagal mengakhiri sesi')
    } finally {
      setIsRevoking(null)
    }
  }

  const handleRevokeAllOtherSessions = async () => {
    if (!confirm('Apakah Anda yakin ingin mengakhiri semua sesi lain? Anda akan tetap masuk di perangkat ini.')) {
      return
    }

    try {
      setError('')
      
      const response = await fetch(`/api/users/${userId}/sessions/revoke-others`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke other sessions')
      }

      await fetchSessions()
    } catch (error) {
      console.error('Error revoking other sessions:', error)
      setError('Gagal mengakhiri sesi lain')
    }
  }

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-5 w-5" />
    
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return 'Perangkat tidak dikenal'
    
    // Simple user agent parsing
    const ua = userAgent.toLowerCase()
    let browser = 'Browser tidak dikenal'
    let os = 'OS tidak dikenal'
    
    // Browser detection
    if (ua.includes('chrome')) browser = 'Chrome'
    else if (ua.includes('firefox')) browser = 'Firefox'
    else if (ua.includes('safari')) browser = 'Safari'
    else if (ua.includes('edge')) browser = 'Edge'
    
    // OS detection
    if (ua.includes('windows')) os = 'Windows'
    else if (ua.includes('mac')) os = 'macOS'
    else if (ua.includes('linux')) os = 'Linux'
    else if (ua.includes('android')) os = 'Android'
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'
    
    return `${browser} di ${os}`
  }

  const formatLastActive = (updatedAt: string) => {
    const date = new Date(updatedAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Baru saja'
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`
    
    return date.toLocaleDateString('id-ID')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sesi Aktif</CardTitle>
          <CardDescription>
            Kelola sesi login aktif di berbagai perangkat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesi Aktif</CardTitle>
        <CardDescription>
          Kelola sesi login aktif di berbagai perangkat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {sessions.length > 1 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAllOtherSessions}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Akhiri Semua Sesi Lain
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map((session) => {
            const isRevokingThis = isRevoking === session.id
            const isExpired = new Date(session.expires) < new Date()

            return (
              <div
                key={session.id}
                className={`p-4 border rounded-lg ${
                  session.isCurrent ? 'border-primary bg-primary/5' : ''
                } ${
                  isExpired ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getDeviceIcon(session.userAgent)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium">
                          {getDeviceInfo(session.userAgent)}
                        </div>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="text-green-600">
                            Sesi Ini
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge variant="destructive">
                            Kedaluwarsa
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {session.ipAddress && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{session.ipAddress}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Terakhir aktif: {formatLastActive(session.updatedAt)}</span>
                        </div>
                        <div className="text-xs">
                          Kedaluwarsa: {new Date(session.expires).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && !isExpired && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={isRevokingThis}
                      className="text-red-600 hover:text-red-700"
                    >
                      {isRevokingThis ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4 mr-1" />
                      )}
                      Akhiri
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada sesi aktif
          </div>
        )}
      </CardContent>
    </Card>
  )
}