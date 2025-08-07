import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, CartStore, Cart } from '@/types'
import { SERVICE_FEE, calculateServiceFeePerStore } from '@/lib/service-fee'

// Bundle content item for bundle-only approach
interface BundleContentItem {
  name: string
  description?: string
  price: number
  quantity: number
  image?: string
}

interface CartState {
  cart: Cart
  addItem: (item: Omit<CartItem, 'quantity' | 'id'> & { quantity?: number; storeId?: string; stock?: number }) => void
  addBundle: (bundle: Omit<CartItem, 'quantity' | 'id' | 'type'> & { 
    quantity?: number; 
    storeId?: string; 
    contents?: BundleContentItem[];
    bundleItems?: { productId: string; quantity: number; name: string }[] // Backward compatibility
  }) => void
  removeItem: (itemId: string, storeId: string) => void
  updateQuantity: (itemId: string, storeId: string, quantity: number) => void
  clearCart: () => void
  clearStore: (storeId: string) => void
  getStoreItems: (storeId: string) => CartItem[]
  getStoreSubtotal: (storeId: string) => number
}

const initialCart: Cart = {
  stores: [],
  subtotal: 0,     // Total produk
  serviceFee: 0,   // Fixed fee (akan di-set saat ada item)
  total: 0,        // subtotal + serviceFee
  itemCount: 0,
}

// Helper function to calculate cart totals with service fee per store
const calculateCartTotals = (stores: CartStore[]): Pick<Cart, 'subtotal' | 'serviceFee' | 'total' | 'itemCount'> => {
  const subtotal = stores.reduce((sum, store) => sum + store.subtotal, 0)
  const itemCount = stores.reduce((sum, store) => 
    sum + store.items.reduce((storeSum, item) => storeSum + item.quantity, 0), 0
  )
  
  // Service fee per store - only for stores with items
  const storeCount = stores.filter(store => store.items.length > 0).length
  const serviceFee = calculateServiceFeePerStore(storeCount)
  const total = subtotal + serviceFee
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🛒 Cart calculation:', {
      stores: stores.length,
      storeWithItems: storeCount,
      subtotal,
      serviceFee,
      total,
      itemCount
    })
  }
  
  return { subtotal, serviceFee, total, itemCount }
}

// Helper function to create updated cart
const createUpdatedCart = (stores: CartStore[]): Cart => {
  const totals = calculateCartTotals(stores)
  return {
    stores,
    ...totals
  }
}

// Helper function to validate cart state
const validateCartState = (state: unknown): Cart => {
  if (!state || typeof state !== 'object') {
    return initialCart
  }

  const stateObj = state as Record<string, unknown>
  
  return {
    stores: Array.isArray(stateObj.stores) ? stateObj.stores : [],
    subtotal: typeof stateObj.subtotal === 'number' ? stateObj.subtotal : 0,
    serviceFee: typeof stateObj.serviceFee === 'number' ? stateObj.serviceFee : 0,
    total: typeof stateObj.total === 'number' ? stateObj.total : 0,
    itemCount: typeof stateObj.itemCount === 'number' ? stateObj.itemCount : 0,
  }
}

// Safe cart store creation with proper error handling
const createCartStore = () => {
  try {
    return create<CartState>()(
      persist(
        (set, get) => ({
          cart: initialCart,

          addItem: (item) => {
            try {
              const { cart } = get()
              const quantity = item.quantity || 1

              if (process.env.NODE_ENV === 'development') {
                console.log('🛒 Adding item:', { ...item, quantity })
              }

              // Find existing store
              const existingStoreIndex = cart.stores.findIndex(
                (store) => store.storeId === item.storeId
              )

              if (existingStoreIndex >= 0) {
                // Store exists, check if item exists
                const existingItemIndex = cart.stores[existingStoreIndex].items.findIndex(
                  (cartItem) => cartItem.productId === item.productId && cartItem.type === 'product'
                )

                if (existingItemIndex >= 0) {
                  // Item exists, update quantity
                  const updatedStores = [...cart.stores]
                  updatedStores[existingStoreIndex] = {
                    ...updatedStores[existingStoreIndex],
                    items: [...updatedStores[existingStoreIndex].items]
                  }
                  updatedStores[existingStoreIndex].items[existingItemIndex] = {
                    ...updatedStores[existingStoreIndex].items[existingItemIndex],
                    quantity: updatedStores[existingStoreIndex].items[existingItemIndex].quantity + quantity
                  }
                  
                  // Recalculate store subtotal
                  updatedStores[existingStoreIndex].subtotal = updatedStores[existingStoreIndex].items.reduce(
                    (total, cartItem) => total + (cartItem.price * cartItem.quantity), 0
                  )

                  const newCart = createUpdatedCart(updatedStores)
                  set({ cart: newCart })
                } else {
                  // Item doesn't exist, add new item
                  const newItem: CartItem = {
                    id: `product-${item.productId || 'unknown'}-${item.storeId || 'default'}-${Date.now()}`,
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    storeId: item.storeId,
                    storeName: item.storeName,
                    stock: item.stock || 0,
                    type: 'product',
                    quantity,
                  }

                  const updatedStores = [...cart.stores]
                  updatedStores[existingStoreIndex] = {
                    ...updatedStores[existingStoreIndex],
                    items: [...updatedStores[existingStoreIndex].items, newItem]
                  }
                  
                  // Recalculate store subtotal
                  updatedStores[existingStoreIndex].subtotal = updatedStores[existingStoreIndex].items.reduce(
                    (total, cartItem) => total + (cartItem.price * cartItem.quantity), 0
                  )

                  const newCart = createUpdatedCart(updatedStores)
                  set({ cart: newCart })
                }
              } else {
                // Store doesn't exist, create new store with item
                const newItem: CartItem = {
                  id: `product-${item.productId || 'unknown'}-${item.storeId || 'default'}-${Date.now()}`,
                  productId: item.productId,
                  name: item.name,
                  price: item.price,
                  image: item.image,
                  storeId: item.storeId,
                  storeName: item.storeName,
                  stock: item.stock || 0,
                  type: 'product',
                  quantity,
                }

                const newStore: CartStore = {
                  storeId: item.storeId || '',
                  storeName: item.storeName || '',
                  items: [newItem],
                  subtotal: newItem.price * quantity,
                }

                const updatedStores = [...cart.stores, newStore]
                const newCart = createUpdatedCart(updatedStores)
                set({ cart: newCart })
              }
            } catch (error) {
              console.error('Error adding item to cart:', error)
            }
          },

          addBundle: (bundle) => {
            try {
              const { cart } = get()
              const quantity = bundle.quantity || 1

              if (process.env.NODE_ENV === 'development') {
                console.log('🛒 Adding bundle:', { ...bundle, quantity })
              }

              // Find existing store
              const existingStoreIndex = cart.stores.findIndex(
                (store) => store.storeId === bundle.storeId
              )

              if (existingStoreIndex >= 0) {
                // Store exists, check if bundle exists
                const existingBundleIndex = cart.stores[existingStoreIndex].items.findIndex(
                  (cartItem) => (cartItem.bundleId === bundle.bundleId || cartItem.productId === bundle.productId) && cartItem.type === 'bundle'
                )

                if (existingBundleIndex >= 0) {
                  // Bundle exists, update quantity
                  const updatedStores = [...cart.stores]
                  updatedStores[existingStoreIndex] = {
                    ...updatedStores[existingStoreIndex],
                    items: [...updatedStores[existingStoreIndex].items]
                  }
                  updatedStores[existingStoreIndex].items[existingBundleIndex] = {
                    ...updatedStores[existingStoreIndex].items[existingBundleIndex],
                    quantity: updatedStores[existingStoreIndex].items[existingBundleIndex].quantity + quantity
                  }

                  // Recalculate store subtotal
                  updatedStores[existingStoreIndex].subtotal = updatedStores[existingStoreIndex].items.reduce(
                    (total, cartItem) => total + (cartItem.price * cartItem.quantity), 0
                  )

                  const newCart = createUpdatedCart(updatedStores)
                  set({ cart: newCart })
                } else {
                  // Bundle doesn't exist, add new bundle
                  const newBundle: CartItem = {
                    id: `bundle-${bundle.bundleId || bundle.productId || 'unknown'}-${bundle.storeId || 'default'}-${Date.now()}`,
                    productId: bundle.productId,
                    bundleId: bundle.bundleId,
                    name: bundle.name,
                    price: bundle.price,
                    image: bundle.image,
                    storeId: bundle.storeId,
                    storeName: bundle.storeName,
                    stock: 0, // Bundles don't have stock
                    type: 'bundle',
                    quantity,
                    contents: bundle.contents || [],
                    bundleItems: bundle.bundleItems || [],
                  }

                  const updatedStores = [...cart.stores]
                  updatedStores[existingStoreIndex] = {
                    ...updatedStores[existingStoreIndex],
                    items: [...updatedStores[existingStoreIndex].items, newBundle]
                  }

                  // Recalculate store subtotal
                  updatedStores[existingStoreIndex].subtotal = updatedStores[existingStoreIndex].items.reduce(
                    (total, cartItem) => total + (cartItem.price * cartItem.quantity), 0
                  )

                  const newCart = createUpdatedCart(updatedStores)
                  set({ cart: newCart })
                }
              } else {
                // Store doesn't exist, create new store with bundle
                const newBundle: CartItem = {
                  id: `bundle-${bundle.bundleId || bundle.productId || 'unknown'}-${bundle.storeId || 'default'}-${Date.now()}`,
                  productId: bundle.productId,
                  bundleId: bundle.bundleId,
                  name: bundle.name,
                  price: bundle.price,
                  image: bundle.image,
                  storeId: bundle.storeId,
                  storeName: bundle.storeName,
                  stock: 0, // Bundles don't have stock
                  type: 'bundle',
                  quantity,
                  contents: bundle.contents || [],
                  bundleItems: bundle.bundleItems || [],
                }

                const newStore: CartStore = {
                  storeId: bundle.storeId || '',
                  storeName: bundle.storeName || '',
                  items: [newBundle],
                  subtotal: newBundle.price * quantity,
                }

                const updatedStores = [...cart.stores, newStore]
                const newCart = createUpdatedCart(updatedStores)
                set({ cart: newCart })
              }
            } catch (error) {
              console.error('Error adding bundle to cart:', error)
            }
          },

          removeItem: (itemId, storeId) => {
            try {
              const { cart } = get()
              const updatedStores = cart.stores.map((store) => {
                if (store.storeId === storeId) {
                  const filteredItems = store.items.filter((item) => item.id !== itemId)
                  return {
                    ...store,
                    items: filteredItems,
                    subtotal: filteredItems.reduce((total, item) => total + (item.price * item.quantity), 0),
                  }
                }
                return store
              }).filter((store) => store.items.length > 0) // Remove empty stores

              const newCart = createUpdatedCart(updatedStores)
              set({ cart: newCart })
            } catch (error) {
              console.error('Error removing item from cart:', error)
            }
          },

          updateQuantity: (itemId, storeId, quantity) => {
            try {
              if (quantity <= 0) {
                // If quantity is 0 or negative, remove the item
                get().removeItem(itemId, storeId)
                return
              }

              const { cart } = get()
              const updatedStores = cart.stores.map((store) => {
                if (store.storeId === storeId) {
                  const updatedItems = store.items.map((item) =>
                    item.id === itemId ? { ...item, quantity } : item
                  )
                  return {
                    ...store,
                    items: updatedItems,
                    subtotal: updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0),
                  }
                }
                return store
              })

              const newCart = createUpdatedCart(updatedStores)
              set({ cart: newCart })
            } catch (error) {
              console.error('Error updating item quantity:', error)
            }
          },

          clearCart: () => {
            try {
              set({ cart: initialCart })
            } catch (error) {
              console.error('Error clearing cart:', error)
            }
          },

          clearStore: (storeId) => {
            try {
              const { cart } = get()
              const updatedStores = cart.stores.filter((store) => store.storeId !== storeId)
              const newCart = createUpdatedCart(updatedStores)
              set({ cart: newCart })
            } catch (error) {
              console.error('Error clearing store from cart:', error)
            }
          },

          getStoreItems: (storeId) => {
            try {
              const { cart } = get()
              const store = cart.stores.find((store) => store.storeId === storeId)
              return store ? store.items : []
            } catch (error) {
              console.error('Error getting store items:', error)
              return []
            }
          },

          getStoreSubtotal: (storeId) => {
            try {
              const { cart } = get()
              const store = cart.stores.find((store) => store.storeId === storeId)
              return store ? store.subtotal : 0
            } catch (error) {
              console.error('Error getting store subtotal:', error)
              return 0
            }
          },
        }),
        {
          name: 'cart-store',
        }
      )
    )
  } catch (error) {
    console.error('Error creating cart store:', error)
    // Return a fallback store
    return create<CartState>()(() => ({
      cart: initialCart,
      addItem: () => {},
      addBundle: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      clearStore: () => {},
      getStoreItems: () => [],
      getStoreSubtotal: () => 0,
    }))
  }
}

export const useCartStore = createCartStore()
