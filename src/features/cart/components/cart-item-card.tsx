import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '@/lib/utils'
import type { CartItem } from '@/types'
import Image from 'next/image'

interface CartItemCardProps {
  item: CartItem
  className?: string
}

export function CartItemCard({ item, className }: CartItemCardProps) {
  const { updateQuantity, removeItem } = useCartStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (!item.id || !item.storeId) return
    
    setIsLoading(true)
    try {
      updateQuantity(item.id, item.storeId, newQuantity)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveItem = async () => {
    if (!item.id || !item.storeId) return
    
    setIsLoading(true)
    try {
      removeItem(item.id, item.storeId)
    } finally {
      setIsLoading(false)
    }
  }

  const itemSubtotal = item.price * item.quantity

  return (
    <Card className={`group hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Product Image */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-muted to-muted/60 rounded-lg flex items-center justify-center flex-shrink-0 border overflow-hidden">
            {item.image ? (
              <Image 
                src={item.image} 
                alt={item.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground text-xl">
                {item.type === 'bundle' ? '📦' : '🛍️'}
              </span>
            )}
          </div>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg line-clamp-2 leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <span className="text-xs">🏪</span>
                      {item.storeName}
                    </p>
                  </div>
                  
                  {/* Remove Button - Top Right on Mobile */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveItem}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 sm:hidden flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Bundle Contents */}
                {item.type === 'bundle' && item.contents && item.contents.length > 0 && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <span>📋</span>
                      Isi bundle:
                    </p>
                    <div className="space-y-1.5">
                      {item.contents.map((content, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="flex-1 text-foreground font-medium">{content.name}</span>
                          <span className="text-muted-foreground bg-background/60 px-2 py-1 rounded-md text-xs">
                            {content.quantity}x
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(item.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      per item
                    </p>
                  </div>
                  
                  {/* Remove Button - Desktop */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveItem}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 hidden sm:flex"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quantity Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 bg-muted/50 rounded-lg p-1 border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateQuantity(item.quantity - 1)}
                      disabled={isLoading || item.quantity <= 1}
                      className="h-8 w-8 p-0 hover:bg-background transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold min-w-[2.5rem] text-center bg-background px-2 py-1 rounded">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateQuantity(item.quantity + 1)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0 hover:bg-background transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(itemSubtotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}