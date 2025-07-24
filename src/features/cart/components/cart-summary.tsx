import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import type { Cart } from '@/types'

interface CartSummaryProps {
  cart: Cart
  className?: string
}

export function CartSummary({ cart, className }: CartSummaryProps) {
  const { stores, total, itemCount } = cart
  const finalTotal = total

  return (
    <Card className={`w-full shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-lg font-bold">Ringkasan Pesanan</span>
          <Badge variant="secondary" className="self-start sm:self-center px-3 py-1">
            {itemCount} item
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Store breakdown - Hidden on mobile for cleaner look */}
        <div className="space-y-3 hidden sm:block">
          <h4 className="font-medium text-sm text-muted-foreground">Detail per Toko</h4>
          {stores.map((store) => (
            <div key={store.storeId} className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium">{store.storeName}</p>
                <p className="text-xs text-muted-foreground">
                  {store.items.length} item • {store.items.reduce((sum: number, item) => sum + item.quantity, 0)} qty
                </p>
              </div>
              <span className="text-sm font-medium">{formatPrice(store.subtotal)}</span>
            </div>
          ))}
          <Separator />
        </div>

        {/* Cost breakdown - Simplified for mobile */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal Produk</span>
            <span className="font-medium">{formatPrice(total)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-xl">
            <span>Total</span>
            <span className="text-primary">{formatPrice(finalTotal)}</span>
          </div>
        </div>

        {/* Pickup Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📦</span>
            <div>
              <p className="text-sm font-medium">Pickup di Venue</p>
              <p className="text-xs text-muted-foreground">PIT PERDAMI 2025 • Hari ke-3</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button size="lg" className="w-full h-12 text-base font-semibold" asChild>
            <Link href="/checkout">
              Lanjut ke Checkout
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Dengan melanjutkan, Anda menyetujui syarat dan ketentuan kami
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
