'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminAuthWrapperProps {
  children: ReactNode
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to admin login if not authenticated
      router.push('/admin/login')
    }
  }, [status, router])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Memuat session...</h3>
            <p className="text-sm text-muted-foreground text-center">
              Memeriksa autentikasi admin
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Shield className="h-8 w-8 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Akses Ditolak</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Anda perlu login sebagai admin untuk mengakses halaman ini
            </p>
            <Button onClick={() => router.push('/admin/login')} className="w-full">
              Login Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not admin role
  if (session && session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-8 w-8 text-yellow-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Akses Terbatas</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Anda tidak memiliki hak akses admin. Role Anda: {session.user.role}
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                Beranda
              </Button>
              <Button onClick={() => router.push('/admin/login')} className="flex-1">
                Login Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated and is admin
  return <>{children}</>
}
