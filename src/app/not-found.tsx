import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Halaman Tidak Ditemukan | Perdami Store',
  description: 'Halaman yang Anda cari tidak ditemukan.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card rounded-lg shadow-md p-8 text-center border">
        <div className="mb-6">
          <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-muted-foreground">404</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Halaman Tidak Ditemukan
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman telah dipindahkan atau tidak tersedia.
        </p>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">
              Kembali ke Beranda
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/stores">
              Lihat Semua Toko
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
