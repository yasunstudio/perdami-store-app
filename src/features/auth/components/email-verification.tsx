'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, CheckCircle, XCircle, Clock, Send, AlertTriangle } from 'lucide-react'

interface VerificationToken {
  id: string
  identifier: string
  token: string
  expires: string
  createdAt: string
}

interface EmailVerificationProps {
  userEmail: string
  isEmailVerified: boolean
  onVerificationChange?: (verified: boolean) => void
}

export function EmailVerification({ 
  userEmail, 
  isEmailVerified, 
  onVerificationChange 
}: EmailVerificationProps) {
  const [tokens, setTokens] = useState<VerificationToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchVerificationTokens()
  }, [userEmail])

  const fetchVerificationTokens = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/auth/verification-tokens?email=${encodeURIComponent(userEmail)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch verification tokens')
      }
      const data = await response.json()
      setTokens(data)
    } catch (error) {
      console.error('Error fetching verification tokens:', error)
      setError('Gagal memuat token verifikasi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVerification = async () => {
    try {
      setIsSending(true)
      setError('')
      setSuccess('')
      
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send verification email')
      }

      setSuccess('Email verifikasi telah dikirim. Silakan periksa kotak masuk Anda.')
      await fetchVerificationTokens()
    } catch (error: any) {
      console.error('Error sending verification email:', error)
      setError(error.message || 'Gagal mengirim email verifikasi')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyEmail = async (token: string) => {
    try {
      setError('')
      setSuccess('')
      
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify email')
      }

      setSuccess('Email berhasil diverifikasi!')
      onVerificationChange?.(true)
      await fetchVerificationTokens()
    } catch (error: any) {
      console.error('Error verifying email:', error)
      setError(error.message || 'Gagal memverifikasi email')
    }
  }

  const formatTimeRemaining = (expires: string) => {
    const expiryDate = new Date(expires)
    const now = new Date()
    const diffInMinutes = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffInMinutes <= 0) return 'Kedaluwarsa'
    if (diffInMinutes < 60) return `${diffInMinutes} menit lagi`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} jam lagi`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} hari lagi`
  }

  const activeTokens = tokens.filter(token => new Date(token.expires) > new Date())
  const expiredTokens = tokens.filter(token => new Date(token.expires) <= new Date())

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Verifikasi Email</span>
        </CardTitle>
        <CardDescription>
          Kelola verifikasi email untuk keamanan akun Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Email Status */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{userEmail}</div>
                <div className="text-sm text-muted-foreground">
                  Email utama akun Anda
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isEmailVerified ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Terverifikasi
                </Badge>
              ) : (
                <>
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Belum Terverifikasi
                  </Badge>
                  <Button
                    size="sm"
                    onClick={handleSendVerification}
                    disabled={isSending || activeTokens.length > 0}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-1" />
                    )}
                    Kirim Verifikasi
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Active Verification Tokens */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            {activeTokens.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Token Verifikasi Aktif</h4>
                {activeTokens.map((token) => (
                  <div key={token.id} className="p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">
                            Token dikirim {new Date(token.createdAt).toLocaleString('id-ID')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Berlaku hingga: {formatTimeRemaining(token.expires)}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerifyEmail(token.token)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-100"
                      >
                        Verifikasi Sekarang
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Alert className="border-blue-200 bg-blue-50">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Silakan periksa kotak masuk email Anda dan klik link verifikasi yang telah dikirim.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Expired Tokens */}
            {expiredTokens.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Token Kedaluwarsa</h4>
                {expiredTokens.slice(0, 3).map((token) => (
                  <div key={token.id} className="p-3 border rounded-lg bg-gray-50 opacity-60">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-gray-500" />
                      <div className="text-sm">
                        Token dikirim {new Date(token.createdAt).toLocaleString('id-ID')} - Kedaluwarsa
                      </div>
                    </div>
                  </div>
                ))}
                {expiredTokens.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{expiredTokens.length - 3} token kedaluwarsa lainnya
                  </div>
                )}
              </div>
            )}

            {!isEmailVerified && activeTokens.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Email Anda belum diverifikasi. Klik tombol "Kirim Verifikasi" untuk menerima email verifikasi.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}