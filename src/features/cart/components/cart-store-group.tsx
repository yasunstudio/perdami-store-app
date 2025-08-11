import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CartItemCard } from './cart-item-card'
import type { CartStore } from '@/types'

interface CartStoreGroupProps {
  store: CartStore
  className?: string
}

export function CartStoreGroup({ store, className }: CartStoreGroupProps) {
  const { clearStore } = useCartStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleClearStore = async () => {
    setIsLoading(true)
    try {
      clearStore(store.storeId)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3 bg-muted/30 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-sm">🏪</span>
              </div>
              {store.storeName}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {store.items.length} produk • {store.items.reduce((sum, item) => sum + item.quantity, 0)} item
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearStore}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 self-start sm:self-center h-10 px-4 font-medium"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Hapus Semua</span>
            <span className="sm:hidden">Hapus</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-4">
          {store.items.map((item, index) => (
            <div key={`${store.storeId}-${item.id}-${index}`}>
              <CartItemCard item={item} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
