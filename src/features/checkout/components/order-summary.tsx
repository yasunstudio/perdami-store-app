import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice, cn } from '@/lib/utils'
import { SERVICE_FEE, calculateServiceFeePerStore } from '@/lib/service-fee'
import { toast } from 'sonner'
import { Package2, Store, CreditCard, Copy } from 'lucide-react'
import type { Cart } from '@/types'

interface OrderSummaryProps {
  cart: Cart
}

export function OrderSummary({ cart }: OrderSummaryProps) {
  const { stores, subtotal, serviceFee, total, itemCount } = cart
  
  // Calculate store count for display
  const storeCount = stores.filter(store => store.items.length > 0).length
  const serviceFeePerStore = SERVICE_FEE.VENUE_PICKUP_PER_STORE

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Berhasil disalin ke clipboard!')
  }

  return (
    <Card className="sticky top-6 border-border/50 dark:border-border/30 bg-card dark:bg-card">
      <CardHeader className="bg-muted/30 dark:bg-muted/10">
        <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
          <Package2 className="h-5 w-5 text-primary dark:text-primary" />
          Ringkasan Pesanan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Store Summary */}
        <div className="space-y-3">
          {stores.map((store) => (
            <div key={store.storeId} className="border border-border/50 dark:border-border/30 rounded-lg p-3 bg-muted/20 dark:bg-muted/10">
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-4 w-4 text-muted-foreground dark:text-muted-foreground/80" />
                <span className="font-medium text-sm text-foreground dark:text-foreground">{store.storeName}</span>
              </div>
              <div className="space-y-1">
                {store.items.map((item, index) => (
                  <div key={`${store.storeId}-${item.productId || item.name}-${index}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground dark:text-muted-foreground/80">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-foreground dark:text-foreground">{formatPrice(item.sellingPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-2 bg-border/50 dark:bg-border/30" />
              <div className="flex justify-between text-sm font-medium">
                <span className="text-foreground dark:text-foreground">Subtotal {store.storeName}</span>
                <span className="text-foreground dark:text-foreground">{formatPrice(store.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0))}</span>
              </div>
            </div>
          ))}
        </div>

        <Separator className="bg-border/50 dark:bg-border/30" />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground dark:text-foreground">Subtotal Produk ({itemCount} item)</span>
            <span className="text-foreground dark:text-foreground">{formatPrice(subtotal)}</span>
          </div>
          
          {/* Service Fee Row */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1">
              <span className="text-foreground dark:text-foreground">Ongkos Kirim ({storeCount} toko)</span>
              <span className="text-xs">📦</span>
            </div>
            <span className="text-foreground dark:text-foreground">{serviceFee > 0 ? formatPrice(serviceFee) : 'Gratis'}</span>
          </div>
          
          {/* Service fee breakdown per store */}
          {storeCount > 1 && (
            <div className="pl-4 text-xs text-muted-foreground dark:text-muted-foreground/80">
              {formatPrice(serviceFeePerStore)} × {storeCount} toko
            </div>
          )}
          
          <Separator className="bg-border/50 dark:bg-border/30" />
          <div className="flex justify-between items-center font-bold text-lg">
            <span className="text-foreground dark:text-foreground">Total Pembayaran</span>
            <div className="flex items-center gap-2">
              <span className="text-primary dark:text-primary">{formatPrice(total)}</span>
              <Button 
                type="button"
                size="sm" 
                variant="ghost" 
                onClick={() => copyToClipboard(total.toString())}
                className="h-6 w-6 p-0 hover:bg-muted/50 dark:hover:bg-muted/30"
              >
                <Copy className="h-3 w-3 text-muted-foreground dark:text-muted-foreground/80" />
              </Button>
            </div>
          </div>
        </div>

        {/* Pickup Info */}
        <Badge variant="secondary" className="w-full justify-center py-3 text-center bg-secondary dark:bg-secondary text-secondary-foreground dark:text-secondary-foreground">
          📦 Pickup di venue PIT PERDAMI 2025
        </Badge>

        {/* Payment Info */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-sm text-blue-900 dark:text-blue-100">Informasi Pembayaran</span>
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Setelah pesanan dikonfirmasi, Anda akan menerima detail pembayaran di halaman pesanan.
          </p>
        </div>

        {/* Important Notes */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3">
          <h4 className="font-medium text-sm text-amber-900 dark:text-amber-100 mb-1">Penting!</h4>
          <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
            <li>• Pesanan hanya bisa diambil di venue</li>
            <li>• Batas waktu pickup: Hari ke-3 event (sesuai tanggal yang dipilih)</li>
            <li>• Bawa bukti pembayaran saat pickup (QR Code)</li>
            <li>• Pastikan pembayaran sudah dikonfirmasi sebelum tanggal pickup</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
