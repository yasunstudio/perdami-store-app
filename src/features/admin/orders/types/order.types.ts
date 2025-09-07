import { Order, OrderItem, User, ProductBundle, Payment, Bank, OrderStatus, PaymentStatus } from '@prisma/client'

export interface OrderWithRelations extends Order {
  user: Pick<User, 'id' | 'name' | 'email' | 'phone'>
  customer?: Pick<User, 'id' | 'name' | 'email' | 'phone'>
  orderItems: (OrderItem & {
    bundle: Pick<ProductBundle, 'id' | 'name' | 'sellingPrice' | 'image'>
  })[]
  items?: (OrderItem & {
    bundle: Pick<ProductBundle, 'id' | 'name' | 'sellingPrice' | 'image'>
  })[]
  payment?: Payment | null
  bank?: Pick<Bank, 'id' | 'name' | 'accountNumber' | 'accountName'> | null
}

export interface OrderFilters {
  search: string
  orderStatus: string
  paymentStatus: string
  page: number
  limit: number
}

export interface OrderStats {
  total: number
  pending: number
  confirmed: number
  ready: number
  completed: number
  cancelled: number
  totalRevenue: number
}

export interface PaymentStats {
  pending: number
  paid: number
  failed: number
  refunded: number
}

export interface OrderListResponse {
  orders: OrderWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  stats: OrderStats
  paymentStats: PaymentStats
}
