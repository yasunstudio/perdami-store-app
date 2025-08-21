import { Prisma } from '@prisma/client'

// Database Types
export type User = Prisma.UserGetPayload<Record<string, never>>
export type Store = Prisma.StoreGetPayload<Record<string, never>>
export type ProductBundle = Prisma.ProductBundleGetPayload<Record<string, never>>
export type Payment = Prisma.PaymentGetPayload<Record<string, never>>

// Extended Store type with computed fields from API
export interface StoreWithCounts extends Store {
  bundleCount: number
}
// Order Status Enums
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'BANK_TRANSFER'
export type PickupStatus = 'NOT_PICKED_UP' | 'PICKED_UP'

export interface OrderItem {
  id: string
  bundle: {
    id: string
    name: string
    sellingPrice: number
    image: string | null
    store: {
      id: string
      name: string
    }
  }
  quantity: number
  price: number
  subtotal: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  hotel?: string
  roomNumber?: string
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  bankId: string | null
  subtotalAmount: number
  serviceFee: number
  totalAmount: number
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus // For backward compatibility in API responses
  paymentMethod: PaymentMethod | null // For backward compatibility in API responses
  paymentProof: string | null // For backward compatibility in API responses
  pickupMethod: string
  pickupDate: Date | null
  pickupStatus: PickupStatus
  paymentProofUrl: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  customer: Customer
  user?: Customer // API compatibility - alias for customer
  items: OrderItem[]
  bank?: {
    id: string
    name: string
    accountNumber: string
    accountName: string
  }
  payment?: Payment // The actual payment relation
}
export type Bank = Prisma.BankGetPayload<Record<string, never>>

// Extended Types with Relations
export type ProductBundleWithStore = Prisma.ProductBundleGetPayload<{
  include: {
    store: true
  }
}>

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    orderItems: {
      include: {
        bundle: {
          include: {
            store: true
          }
        }
      }
    }
    user: true
  }
}>

export type StoreWithBundles = Prisma.StoreGetPayload<{
  include: {
    bundles: true
  }
}>

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER'
}



export enum PickupMethod {
  VENUE = 'VENUE'
}

// Cart Types
export interface CartItem {
  id: string
  productId?: string
  bundleId?: string
  name: string
  sellingPrice: number // Price displayed to customer
  quantity: number
  image?: string
  storeId: string
  storeName: string
  stock: number
  type: 'product' | 'bundle'
  // Bundle contents (bundle-only approach)
  contents?: {
    name: string
    description?: string
    price: number
    quantity: number
    image?: string
  }[]
  // Backward compatibility
  bundleItems?: {
    productId: string
    quantity: number
    name: string
  }[]
}

export interface CartStore {
  storeId: string
  storeName: string
  items: CartItem[]
  subtotal: number
}

export interface Cart {
  stores: CartStore[]
  subtotal: number     // Total produk tanpa service fee
  serviceFee: number   // Fixed Rp 25.000
  total: number        // subtotal + serviceFee
  itemCount: number
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  name: string
  phone: string
  hotel: string
  roomNumber: string
}

export interface CheckoutForm {
  paymentMethod: PaymentMethod
  pickupMethod: PickupMethod
  notes?: string
  paymentProof?: File
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// Search & Filter Types
export interface ProductFilters {
  storeId?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  featured?: boolean
  inStock?: boolean
}

export interface OrderFilters {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod
  dateFrom?: Date
  dateTo?: Date
  userId?: string
}

// Dashboard Statistics
export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  totalCustomers: number
  totalProducts: number
}

// Notification Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}
