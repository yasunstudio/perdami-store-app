'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store'
import { ShoppingBag, ArrowLeft, Package2 } from 'lucide-react'
import { CartStoreGroup, CartSummary } from './components'

export default function CartPage() {
  const { cart } = useCartStore()
  const { stores, itemCount } = cart

  if (stores.length === 0 || itemCount === 0) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Keranjang Belanja Kosong
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Belum ada produk di keranjang Anda. Mari mulai berbelanja oleh-oleh khas Bandung!
          </p>
          <div className="space-y-3">
            <Button asChild size="lg">
              <Link href="/bundles">
                <Package2 className="h-5 w-5 mr-2" />
                Mulai Berbelanja
              </Link>
            </Button>
            <div>
              <Button variant="outline" asChild>
                <Link href="/stores">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Lihat Semua Toko
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Keranjang Belanja</h1>
            <p className="text-muted-foreground mt-1">
              {itemCount} item dari {stores.length} toko
            </p>
          </div>
          <Button variant="outline" asChild className="self-start sm:self-center">
            <Link href="/bundles">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Lanjut Belanja
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-6 pb-24 lg:pb-0">
              {stores.map((store, index) => (
                <CartStoreGroup
                  key={`${store.storeId}-${index}`}
                  store={store}
                />
              ))}
            </div>
          </div>

          {/* Order Summary - Fixed on mobile, sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:border-t-0 z-40">
              <CartSummary cart={cart} className="lg:sticky lg:top-4" />
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-8 border-t">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Package2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Pickup di Venue</h3>
              <p className="text-sm text-muted-foreground">
                Ambil pesanan Anda di venue PIT PERDAMI 2025 pada hari ke-3
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-primary font-bold">📱</span>
              </div>
              <h3 className="font-semibold">Payment Digital</h3>
              <p className="text-sm text-muted-foreground">
                Bayar dengan transfer bank yang aman
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-primary font-bold">🛡️</span>
              </div>
              <h3 className="font-semibold">Terjamin Kualitas</h3>
              <p className="text-sm text-muted-foreground">
                Produk oleh-oleh asli dari toko terpercaya di Bandung
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
