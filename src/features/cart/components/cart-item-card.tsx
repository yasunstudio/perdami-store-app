import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/stores/cart-store'
import { Minus, Plus, Trash2, Package } from 'lucide-react'
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
    <Card className={`group hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}>
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
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg line-clamp-2 leading-tight mb-1">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>🏪</span>
                        <span>{item.storeName}</span>
                      </div>
                      {item.type === 'bundle' && (
                        <Badge variant="secondary" className="text-xs h-5">
                          Bundle
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Remove Button - Top Right */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveItem}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 sm:hidden flex-shrink-0"
                    title="Hapus item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Bundle Contents */}
                {item.type === 'bundle' && item.contents && item.contents.length > 0 && (
                  <div className="mt-2 bg-muted/30 rounded-lg p-2.5 border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
                        <Package className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Isi Bundle
                      </h4>
                    </div>
                    <div className="grid gap-1">
                      {item.contents.map((content, index) => (
                        <div key={index} className="flex justify-between items-center py-1 px-2 bg-background/60 rounded border border-muted/50">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 bg-primary rounded-full"></div>
                            <span className="text-xs font-medium text-foreground">
                              {content.name}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs h-4 px-1.5 font-medium">
                            {content.quantity}x
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Price and Controls Section */}
              <div className="flex flex-col gap-2">
                {/* Price Section */}
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
                    title="Hapus item"
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
                  
                  {/* Subtotal */}
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