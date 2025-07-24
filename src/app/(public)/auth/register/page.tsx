import Link from 'next/link'
import { RegisterForm } from '@/features/auth/components'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            {/* Main content */}
            <div className="space-y-6">
              <RegisterForm className="border-0 shadow-xl bg-background/80 backdrop-blur" />

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sudah punya akun?{' '}
                  <Link href="/auth/login" className="font-medium text-primary hover:underline transition-colors">
                    Masuk disini
                  </Link>
                </p>
                
                {/* Additional info */}
                <div className="pt-4 border-t border-muted/20">
                  <p className="text-xs text-muted-foreground">
                    Bergabunglah dengan Perdami Store untuk pengalaman belanja yang lebih baik
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
