'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams?.get('token')

  useEffect(() => {
    if (!token) {
      setError('Token verifikasi tidak ditemukan')
      setIsLoading(false)
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memverifikasi email')
      }

      setIsVerified(true)
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?verified=true')
      }, 3000)
    } catch (error: any) {
      console.error('Error verifying email:', error)
      setError(error.message || 'Terjadi kesalahan saat memverifikasi email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold">
                Verifikasi Email
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {isLoading 
                  ? 'Memverifikasi email Anda...' 
                  : isVerified 
                  ? 'Email berhasil diverifikasi!' 
                  : 'Verifikasi email gagal'
                }
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-8">
            {isLoading && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  Sedang memverifikasi email Anda, mohon tunggu...
                </p>
              </div>
            )}

            {!isLoading && isVerified && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Email Anda telah berhasil diverifikasi! Anda akan diarahkan ke halaman login dalam beberapa detik.
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col space-y-3">
                  <Button asChild className="w-full">
                    <Link href="/auth/login">
                      Lanjut ke Login
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Kembali ke Beranda
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {!isLoading && !isVerified && error && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Jika Anda mengalami masalah, silakan hubungi dukungan pelanggan atau coba minta email verifikasi baru.
                  </p>
                  
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/auth/login">
                        Kembali ke Login
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Beranda
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!token && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Link verifikasi tidak valid atau telah kedaluwarsa.
                  </AlertDescription>
                </Alert>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Login
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}