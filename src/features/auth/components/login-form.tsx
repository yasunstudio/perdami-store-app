'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

interface LoginFormProps {
  onSuccess?: () => void
  className?: string
}

export function LoginForm({ onSuccess, className }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle URL parameters for messages
  useEffect(() => {
    const urlMessage = searchParams?.get('message')
    const urlError = searchParams?.get('error')

    if (urlMessage) {
      switch (urlMessage) {
        case 'registered':
          setMessage('Registrasi berhasil! Silakan login dengan akun Anda.')
          break
        case 'verified':
          setMessage('Email berhasil diverifikasi! Silakan login.')
          break
        case 'logout':
          setMessage('Anda telah berhasil logout.')
          break
        default:
          setMessage(decodeURIComponent(urlMessage))
      }
    }

    if (urlError) {
      switch (urlError) {
        case 'CredentialsSignin':
          setError('Email atau password yang Anda masukkan tidak valid.')
          break
        case 'AccessDenied':
          setError('Akses ditolak. Anda tidak memiliki izin untuk masuk.')
          break
        default:
          setError('Terjadi kesalahan saat login. Silakan coba lagi.')
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate input
    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) {
      setError(validation.error.errors[0].message)
      setIsLoading(false)
      return
    }

    try {
      // Debug log
      console.log('Attempting login with:', { email, password: '***' })
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: searchParams?.get('callbackUrl') || '/admin'
      })

      console.log('Login result:', result)

      if (result?.error) {
        console.error('Login error:', result.error)
        
        // Professional error messages based on error type
        switch (result.error) {
          case 'CredentialsSignin':
            setError('Email atau password yang Anda masukkan tidak valid. Silakan periksa kembali kredensial Anda.')
            break
          case 'EmailNotVerified':
            setError('Email Anda belum terverifikasi. Silakan periksa email untuk link verifikasi.')
            break
          case 'AccountNotLinked':
            setError('Akun dengan email ini sudah terdaftar dengan metode login yang berbeda.')
            break
          case 'AccessDenied':
            setError('Akses ditolak. Anda tidak memiliki izin untuk masuk ke sistem ini.')
            break
          case 'Default':
            setError('Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.')
            break
          default:
            setError('Terjadi kesalahan saat login. Silakan coba lagi.')
        }
      } else if (result?.ok) {
        console.log('Login successful!')
        // Success callback
        if (onSuccess) {
          onSuccess()
        } else {
          // Small delay to ensure session is updated
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Get updated session to check user role
          const session = await getSession()
          console.log('Session after login:', session)
          
          const callbackUrl = searchParams?.get('callbackUrl')
          
          // Determine redirect URL based on user role and callback
          let redirectUrl = '/'
          
          if (callbackUrl) {
            redirectUrl = callbackUrl
          } else if (session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF') {
            redirectUrl = '/admin'
          }
          
          console.log('Redirecting to:', redirectUrl)
          window.location.href = redirectUrl
        }
      } else {
        setError('Login gagal, silakan coba lagi')
      }
    } catch (error) {
      console.error('Login catch error:', error)
      setError('Terjadi kesalahan saat login. Silakan refresh halaman dan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-3 pb-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/5">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">Masuk ke Akun</CardTitle>
          <CardDescription>
            Masukkan email dan password Anda untuk masuk
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-9 h-10 text-sm rounded-md focus:border-primary"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  className="pl-9 pr-9 h-10 text-sm rounded-md focus:border-primary"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full h-10 text-sm font-medium rounded-md bg-primary hover:bg-primary/90 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Masuk ke Akun'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
