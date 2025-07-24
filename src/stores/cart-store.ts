import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, CartStore, Cart } from '@/types'

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
  total: 0,
  itemCount: 0,
}

// Helper function to validate cart state
const validateCartState = (state: unknown): Cart => {
  if (!state || typeof state !== 'object') {
    return initialCart
  }

  const stateObj = state as Record<string, unknown>
  
  return {
    stores: Array.isArray(stateObj.stores) ? stateObj.stores : [],
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
                  updatedStores[existingStoreIndex].items[existingItemIndex].quantity += quantity
                  
                  // Recalculate store subtotal
                  updatedStores[existingStoreIndex].subtotal = updatedStores[existingStoreIndex].items.reduce(
                    (total, cartItem) => total + (cartItem.price * cartItem.quantity), 0
                  )

                  // Calculate new totals
                  const newCart: Cart = {
                    stores: updatedStores,
                    total: updatedStores.reduce((total, store) => total + store.subtotal, 0),
                    itemCount: updatedStores.reduce(
                      (total, store) => total + store.items.reduce((storeTotal, cartItem) => storeTotal + cartItem.quantity, 0), 0
                    ),
                  }

                  set({ cart: newCart })
                } else {
                  // Item doesn't exist, add new item
                  const newItem: CartItem = {
                    id: `product-${item.productId || 'unknown'}-${item.storeId || 'default'}-${Date.now()}`, // Generate unique ID
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
                  updatedStores[existingStoreIndex].items.push(newItem)
                  
                  // Recalculate store subtotal
                  updatedStores[existingStoreIndex].subtotal = updatedStores[existingStoreIndex].items.reduce(
                    (total, cartItem) => total + (cartItem.price * cartItem.quantity), 0
                  )

                  // Calculate new totals
                  const newCart: Cart = {
                    stores: updatedStores,
                    total: updatedStores.reduce((total, store) => total + store.subtotal, 0),
                    itemCount: updatedStores.reduce(
                      (total, store) => total + store.items.reduce((storeTotal, cartItem) => storeTotal + cartItem.quantity, 0), 0
                    ),
                  }

                  set({ cart: newCart })
                }
              } else {
                // Store doesn't exist, create new store with item
                const newItem: CartItem = {
                  id: `product-${item.productId || 'unknown'}-${item.storeId || 'default'}-${Date.now()}`, // Generate unique ID
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
                  storeId: item.storeId || `fallback-store-${Date.now()}`,
                  storeName: item.storeName || 'Unknown Store',
                  items: [newItem],
                  subtotal: item.price * quantity,
                }

                const newCart: Cart = {
                  stores: [...cart.stores, newStore],
                  total: cart.total + (item.price * quantity),
                  itemCount: cart.itemCount + quantity,
                }

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

              // Find existing store
              const existingStoreIndex = cart.stores.findIndex(
                (store) => store.storeId === bundle.storeId
              )

              if (existingStoreIndex >= 0) {
                // Store exists, check if bundle exists
                const existingItemIndex = cart.stores[existingStoreIndex].items.findIndex(
                  (cartItem) => cartItem.bundleId === bundle.bundleId && cartItem.type === 'bundle'
                )

                if (existingItemIndex >= 0) {
                  // Bundle exists, update quantity
                  const updatedStores = [...cart.stores]
                  updatedStores[existingStoreIndex].items[existingItemIndex].quantity += quantity
                  
                  // Recalculate store subtotal
                  updatedStores[existingStoreIndex].subtotal = updatedStores[existingStoreIndex].items.reduce(
                    (total, cartItem) => total + (cartItem.price * cartItem.quantity), 0
                  )

                  // Calculate new totals
                  const newCart: Cart = {
                    stores: updatedStores,
                    total: updatedStores.reduce((total, store) => total + store.subtotal, 0),
                    itemCount: updatedStores.reduce(
                      (total, store) => total + store.items.reduce((storeTotal, cartItem) => storeTotal + cartItem.quantity, 0), 0
                    ),
                  }

                  set({ cart: newCart })
                } else {
                  // Bundle doesn't exist, add new bundle
                  const newItem: CartItem = {
                    id: `bundle-${bundle.bundleId || 'unknown'}-${bundle.storeId || 'default'}-${Date.now()}`,
                    bundleId: bundle.bundleId,
                    name: bundle.name,
                    price: bundle.price,
                    image: bundle.image,
                    storeId: bundle.storeId,
                    storeName: bundle.storeName,
                    stock: bundle.stock || 999,
                    type: 'bundle',
                    contents: bundle.contents, // Store contents directly
                    // Convert bundle contents to bundleItems for backward compatibility
                    bundleItems: bundle.contents ? 
                      bundle.contents.map((item, index) => ({
                        productId: `bundle-content-${index}`,
                        quantity: item.quantity,
                        name: item.name
                      })) : 
                      bundle.bundleItems || [],
                    quantity,
                  }

                  const updatedStores = [...cart.stores]
                  updatedStores[existingStoreIndex].items.push(newItem)
                  
                  // Recalculate store subtotal
                  updatedStores[existingStoreIndex].subtotal = updatedStores[existingStoreIndex].items.reduce(
                    (total, cartItem) => total + (cartItem.price * cartItem.quantity), 0
                  )

                  // Calculate new totals
                  const newCart: Cart = {
                    stores: updatedStores,
                    total: updatedStores.reduce((total, store) => total + store.subtotal, 0),
                    itemCount: updatedStores.reduce(
                      (total, store) => total + store.items.reduce((storeTotal, cartItem) => storeTotal + cartItem.quantity, 0), 0
                    ),
                  }

                  set({ cart: newCart })
                }
              } else {
                // Store doesn't exist, create new store with bundle
                const newItem: CartItem = {
                  id: `bundle-${bundle.bundleId || 'unknown'}-${bundle.storeId || 'default'}-${Date.now()}`, // Generate unique ID
                  bundleId: bundle.bundleId,
                  name: bundle.name,
                  price: bundle.price,
                  image: bundle.image,
                  storeId: bundle.storeId,
                  storeName: bundle.storeName,
                  stock: bundle.stock || 999,
                  type: 'bundle',
                  // Convert bundle contents to bundleItems for backward compatibility
                  bundleItems: bundle.contents ? 
                    bundle.contents.map((item, index) => ({
                      productId: `bundle-content-${index}`,
                      quantity: item.quantity,
                      name: item.name
                    })) : 
                    bundle.bundleItems || [],
                  quantity,
                }

                const newStore: CartStore = {
                  storeId: bundle.storeId || `fallback-bundle-store-${Date.now()}`,
                  storeName: bundle.storeName || 'Bundle Store',
                  items: [newItem],
                  subtotal: bundle.price * quantity,
                }

                const newCart: Cart = {
                  stores: [...cart.stores, newStore],
                  total: cart.total + (bundle.price * quantity),
                  itemCount: cart.itemCount + quantity,
                }

                set({ cart: newCart })
              }
            } catch (error) {
              console.error('Error adding bundle to cart:', error)
            }
          },

          removeItem: (itemId, storeId) => {
            try {
              const { cart } = get()
              const updatedStores = cart.stores.map(store => {
                if (store.storeId === storeId) {
                  const filteredItems = store.items.filter(item => item.id !== itemId)
                  return {
                    ...store,
                    items: filteredItems,
                    subtotal: filteredItems.reduce((total, item) => total + (item.price * item.quantity), 0)
                  }
                }
                return store
              }).filter(store => store.items.length > 0) // Remove empty stores

              const newCart: Cart = {
                stores: updatedStores,
                total: updatedStores.reduce((total, store) => total + store.subtotal, 0),
                itemCount: updatedStores.reduce(
                  (total, store) => total + store.items.reduce((storeTotal, item) => storeTotal + item.quantity, 0), 0
                ),
              }

              set({ cart: newCart })
            } catch (error) {
              console.error('Error removing item from cart:', error)
            }
          },

          updateQuantity: (itemId, storeId, quantity) => {
            try {
              if (quantity <= 0) {
                get().removeItem(itemId, storeId)
                return
              }

              const { cart } = get()
              const updatedStores = cart.stores.map(store => {
                if (store.storeId === storeId) {
                  const updatedItems = store.items.map(item => 
                    item.id === itemId ? { ...item, quantity } : item
                  )
                  return {
                    ...store,
                    items: updatedItems,
                    subtotal: updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0)
                  }
                }
                return store
              })

              const newCart: Cart = {
                stores: updatedStores,
                total: updatedStores.reduce((total, store) => total + store.subtotal, 0),
                itemCount: updatedStores.reduce(
                  (total, store) => total + store.items.reduce((storeTotal, item) => storeTotal + item.quantity, 0), 0
                ),
              }

              set({ cart: newCart })
            } catch (error) {
              console.error('Error updating quantity:', error)
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
              const updatedStores = cart.stores.filter(store => store.storeId !== storeId)

              const newCart: Cart = {
                stores: updatedStores,
                total: updatedStores.reduce((total, store) => total + store.subtotal, 0),
                itemCount: updatedStores.reduce(
                  (total, store) => total + store.items.reduce((storeTotal, item) => storeTotal + item.quantity, 0), 0
                ),
              }

              set({ cart: newCart })
            } catch (error) {
              console.error('Error clearing store:', error)
            }
          },

          getStoreItems: (storeId) => {
            try {
              const { cart } = get()
              const store = cart.stores.find(store => store.storeId === storeId)
              return store?.items || []
            } catch (error) {
              console.error('Error getting store items:', error)
              return []
            }
          },

          getStoreSubtotal: (storeId) => {
            try {
              const { cart } = get()
              const store = cart.stores.find(store => store.storeId === storeId)
              return store?.subtotal || 0
            } catch (error) {
              console.error('Error getting store subtotal:', error)
              return 0
            }
          },
        }),
        {
          name: 'perdami-cart-storage',
          version: 2, // Increment version to force migration
          migrate: (persistedState: unknown, version: number) => {
            console.log('Migrating cart store from version:', version)
            
            // Always start fresh for versions below 2
            if (version < 2) {
              console.log('Old version detected, starting with fresh cart')
              return { cart: initialCart }
            }
            
            // Validate and sanitize persisted state
            if (!persistedState || typeof persistedState !== 'object') {
              console.log('Invalid persisted state, using initial cart')
              return { cart: initialCart }
            }

            try {
              const stateObj = persistedState as Record<string, unknown>
              const validatedCart = validateCartState(stateObj.cart)
              console.log('Cart state validated successfully')
              return { cart: validatedCart }
            } catch (error) {
              console.error('Error validating cart state:', error)
              return { cart: initialCart }
            }
          },
          onRehydrateStorage: () => {
            return (state, error) => {
              if (error) {
                console.error('Error rehydrating cart store:', error)
                // Clear corrupted data and force reload
                try {
                  localStorage.removeItem('perdami-cart-storage')
                  console.log('Cleared corrupted cart storage')
                } catch (e) {
                  console.error('Error clearing storage:', e)
                }
              } else {
                console.log('Cart store rehydrated successfully')
              }
            }
          },
          partialize: (state) => ({ cart: state.cart }), // Only persist cart data
        }
      )
    )
  } catch (error) {
    console.error('Error creating cart store:', error)
    // Fallback store without persistence
    return create<CartState>()(() => ({
      cart: initialCart,
      addItem: () => console.error('Cart store not available'),
      addBundle: () => console.error('Cart store not available'),
      removeItem: () => console.error('Cart store not available'),
      updateQuantity: () => console.error('Cart store not available'),
      clearCart: () => console.error('Cart store not available'),
      clearStore: () => console.error('Cart store not available'),
      getStoreItems: () => [],
      getStoreSubtotal: () => 0,
    }))
  }
}

export const useCartStore = createCartStore()
