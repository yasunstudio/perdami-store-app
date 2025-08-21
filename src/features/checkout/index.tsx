'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart-store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { CheckoutForm, OrderSummary } from './components'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { toast } from 'sonner'

interface CheckoutFormData {
  customerName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: 'BANK_TRANSFER'
  notes?: string
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const { cart, clearCart, removeItem } = useCartStore()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login?callbackUrl=/checkout')
  }

  // Validate cart items on page load
  useEffect(() => {
    const validateCartItems = async () => {
      if (cart.itemCount === 0 || status !== 'authenticated') return

      const bundles = cart.stores.flatMap(store => 
        store.items.map(item => item.bundleId).filter(Boolean)
      )

      try {
        const response = await fetch('/api/bundles/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bundleIds: bundles
          })
        })

        if (response.ok) {
          const { invalidBundles } = await response.json()
          
          if (invalidBundles && invalidBundles.length > 0) {
            // Remove invalid bundles from cart
            invalidBundles.forEach((bundleId: string) => {
              const storeItem = cart.stores.find(store => 
                store.items.some(item => item.bundleId === bundleId)
              )
              if (storeItem) {
                const item = storeItem.items.find(item => item.bundleId === bundleId)
                if (item) {
                  removeItem(item.id, item.storeId)
                }
              }
            })
            
            toast.warning(
              `${invalidBundles.length} bundle di keranjang Anda sudah tidak tersedia dan telah dihapus.`,
              { duration: 5000 }
            )
          }
        }
      } catch (error) {
        console.error('Error validating cart items:', error)
      }
    }

    validateCartItems()
  }, [cart.itemCount, status, removeItem])

  // Redirect if cart is empty
  if (cart.stores.length === 0 || cart.itemCount === 0) {
    return (
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Keranjang Kosong
            </h1>
            <p className="text-muted-foreground mb-8">
              Tidak ada produk di keranjang Anda untuk checkout.
            </p>
            <Button asChild size="lg">
              <Link href="/bundles">
                Mulai Berbelanja
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmitOrder = async (formData: CheckoutFormData) => {
    setIsProcessing(true)
    toast.loading('Memvalidasi bundle...', { id: 'checkout-process' })
    
    try {
      // Validate cart items before submitting - now using bundle references
      const cartItems = cart.stores.flatMap(store => 
        store.items.map(item => ({
          bundleId: item.bundleId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          storeId: item.storeId // Keep storeId for removeItem function
        }))
      )

      // Create items for API (without storeId)
      const items = cartItems.map(item => ({
        bundleId: item.bundleId,
        quantity: item.quantity,
        unitPrice: item.sellingPrice,
        totalPrice: item.sellingPrice * item.quantity
      }))

      // Pre-validate bundles availability
      const validateResponse = await fetch('/api/bundles/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bundleIds: cartItems.map(item => item.bundleId).filter(Boolean)
        })
      })

      if (!validateResponse.ok) {
         const validateResult = await validateResponse.json()
         toast.error(validateResult.error || 'Gagal memvalidasi bundle', { id: 'checkout-process' })
         return // Exit early
       }

      const { invalidBundles } = await validateResponse.json()
      
      if (invalidBundles && invalidBundles.length > 0) {
        // Remove invalid bundles from cart
        invalidBundles.forEach((bundleId: string) => {
          const item = cartItems.find(i => i.bundleId === bundleId)
          if (item) {
            // Find the cart item by ID instead of bundleId
            const cartItem = cart.stores.flatMap(store => store.items)
              .find(cartItem => cartItem.bundleId === bundleId)
            if (cartItem) {
              removeItem(cartItem.id, item.storeId)
            }
          }
        })
        
        toast.warning(
           'Beberapa bundle di keranjang Anda sudah tidak tersedia dan telah dihapus. Silakan periksa kembali keranjang Anda.',
           { id: 'checkout-process', duration: 5000 }
         )
         return // Exit early, don't proceed with order
      }

      // Update loading message
      toast.loading('Membuat pesanan...', { id: 'checkout-process' })

      // Submit order to API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat pesanan')
      }

      // Clear cart and redirect to success page
      clearCart()
      toast.success('Pesanan berhasil dibuat!', { id: 'checkout-process' })
      router.push(`/orders/${result.order.id}?status=success`)
    } catch (error) {
      console.error('Error submitting order:', error)
      toast.error(
        error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat pesanan',
        { id: 'checkout-process', duration: 5000 }
      )
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-96 bg-muted rounded"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
              <div className="lg:col-span-1">
                <div className="h-80 bg-muted rounded"></div>
              </div>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
            <p className="text-muted-foreground mt-1">
              Lengkapi informasi untuk menyelesaikan pesanan Anda
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/cart">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Keranjang
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm 
              onSubmit={handleSubmitOrder} 
              isProcessing={isProcessing}
              userEmail={session?.user?.email}
              userName={session?.user?.name}
              userPhone={session?.user?.phone}
            />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary cart={cart} />
          </div>
        </div>
      </div>
    </div>
  )
}
