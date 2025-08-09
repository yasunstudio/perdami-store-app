'use client'

import { useState } from 'react'
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
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

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
        
        // More specific error messages
        if (result.error === 'CredentialsSignin') {
          setError('Email atau password salah. Pastikan menggunakan: admin@perdami.com / perdami123')
        } else {
          setError(`Login gagal: ${result.error}`)
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
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Atau lanjutkan dengan
            </span>
          </div>
        </div>
        
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => {
            const callbackUrl = searchParams?.get('callbackUrl') || '/'
            signIn('google', { callbackUrl })
          }}
          className="w-full h-10 text-sm font-medium rounded-md hover:bg-muted/50 transition-colors"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Lanjutkan dengan Google
        </Button>
      </CardContent>
    </Card>
  )
}
