'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, Phone, User, ExternalLink, Copy, Check } from 'lucide-react'
import { generateStoreOrderMessage, generateWhatsAppURL, formatPhoneNumber } from '@/lib/whatsapp'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  quantity: number
  bundle: {
    id: string
    name: string
    storeId: string
  }
  price: number
}

interface Order {
  id: string
  orderNumber: string
  user: {
    name: string | null
    phone: string | null
  }
  orderItems: OrderItem[]
  totalAmount: number
  pickupDate: Date | string | null
  createdAt: Date | string
}

interface Store {
  id: string
  name: string
  whatsappNumber: string | null
  contactPerson: string | null
}

interface WhatsAppOrderNotificationProps {
  order: Order
  stores: Store[]
}

export function WhatsAppOrderNotification({ order, stores }: WhatsAppOrderNotificationProps) {
  const [copiedStores, setCopiedStores] = useState<Set<string>>(new Set())

  // Filter stores that have items in this order and have WhatsApp
  const relevantStores = stores.filter(store => {
    const hasItems = order.orderItems.some(item => item.bundle.storeId === store.id)
    const hasWhatsApp = store.whatsappNumber && store.whatsappNumber.trim() !== ''
    return hasItems && hasWhatsApp
  })

  const handleSendWhatsApp = (store: Store) => {
    try {
      if (!store.whatsappNumber) {
        toast.error(`Nomor WhatsApp untuk ${store.name} belum diatur`)
        return
      }

      const message = generateStoreOrderMessage(order, store)
      const url = generateWhatsAppURL(store.whatsappNumber, message)
      
      window.open(url, '_blank')
      toast.success(`WhatsApp terbuka untuk ${store.name}`)
    } catch (error) {
      console.error('Error opening WhatsApp:', error)
      toast.error('Gagal membuka WhatsApp')
    }
  }

  const handleCopyMessage = async (store: Store) => {
    try {
      const message = generateStoreOrderMessage(order, store)
      await navigator.clipboard.writeText(message)
      
      setCopiedStores(prev => new Set(prev).add(store.id))
      toast.success('Pesan disalin ke clipboard')
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedStores(prev => {
          const next = new Set(prev)
          next.delete(store.id)
          return next
        })
      }, 2000)
    } catch (error) {
      toast.error('Gagal menyalin pesan')
    }
  }

  if (relevantStores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <MessageSquare className="h-5 w-5" />
            Notifikasi WhatsApp ke Toko
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Tidak ada kontak WhatsApp
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Toko dalam pesanan ini belum memiliki nomor WhatsApp yang terdaftar.
            </p>
            <p className="text-xs text-muted-foreground">
              Tambahkan nomor WhatsApp di pengaturan toko untuk mengaktifkan notifikasi otomatis.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <MessageSquare className="h-5 w-5" />
          Kirim Notifikasi WhatsApp ke Toko ({relevantStores.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pesanan #{order.orderNumber} - {order.orderItems.length} item
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {relevantStores.map((store, index) => {
          const storeItems = order.orderItems.filter(item => item.bundle.storeId === store.id)
          const storeSubtotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          const isCopied = copiedStores.has(store.id)

          return (
            <div key={store.id}>
              {index > 0 && <Separator className="my-4" />}
              
              <div className="space-y-3">
                {/* Store Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-base">{store.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {store.contactPerson && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{store.contactPerson}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{formatPhoneNumber(store.whatsappNumber!)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {storeItems.length} item
                  </Badge>
                </div>

                {/* Store Items Summary */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Pesanan untuk toko ini:</div>
                  <div className="space-y-1">
                    {storeItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>• {item.quantity}x {item.bundle.name}</span>
                        <span className="font-medium">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Subtotal:</span>
                    <span className="text-green-600">Rp {storeSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSendWhatsApp(store)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Kirim WhatsApp
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleCopyMessage(store)}
                    className="px-3"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-medium text-blue-800 mb-2">💡 Cara Penggunaan:</h5>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Klik "Kirim WhatsApp" untuk membuka aplikasi WhatsApp dengan pesan siap kirim</li>
            <li>• Klik tombol copy untuk menyalin pesan dan kirim manual</li>
            <li>• Pastikan toko mengkonfirmasi pesanan via WhatsApp</li>
            <li>• Update status pesanan ke "PROCESSING" setelah konfirmasi toko</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
