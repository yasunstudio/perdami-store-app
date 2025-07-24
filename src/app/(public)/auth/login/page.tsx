import Link from 'next/link'
import { LoginForm } from '@/features/auth/components'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            {/* Main content */}
            <div className="space-y-6">
              <LoginForm className="border-0 shadow-xl bg-background/80 backdrop-blur" />

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Belum punya akun?{' '}
                  <Link href="/auth/register" className="font-medium text-primary hover:underline transition-colors">
                    Daftar disini
                  </Link>
                </p>
                
                {/* Additional info */}
                <div className="pt-4 border-t border-muted/20">
                  <p className="text-xs text-muted-foreground">
                    Dengan masuk, Anda dapat mengakses fitur lengkap Perdami Store
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
