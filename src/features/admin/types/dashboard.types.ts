// Types for admin dashboard
export interface DashboardStats {
  totalUsers: number
  totalProducts: number  // Mapped from totalBundles in API
  totalOrders: number
  totalStores: number
  userGrowthRate?: number
  productGrowthRate?: number
  orderGrowthRate?: number
  storeGrowthRate?: number
}

export interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  itemCount: number
  totalAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED'
  createdAt: string // From API as ISO string
}

export interface PopularProduct {
  id: string
  name: string
  price: number
  image: string | null
  storeName: string
  totalSold: number
  revenue: number
  isFeatured?: boolean
}

export interface DashboardData {
  stats: DashboardStats
  recentOrders: RecentOrder[]
  popularProducts: PopularProduct[]
}

// Order status utilities
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED', 
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const

export type OrderStatus = keyof typeof ORDER_STATUS

export const getOrderStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'PENDING':
      return 'secondary'
    case 'CONFIRMED':
      return 'outline'
    case 'READY':
      return 'outline'
    case 'COMPLETED':
      return 'default'
    case 'CANCELLED':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export const getOrderStatusText = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Menunggu'
    case 'CONFIRMED':
      return 'Dikonfirmasi'
    case 'READY':
      return 'Siap Diambil'
    case 'COMPLETED':
      return 'Selesai'
    case 'CANCELLED':
      return 'Dibatalkan'
    default:
      return status
  }
}

// Stock level utilities
export const getStockLevelColor = (stock: number): string => {
  if (stock > 10) return 'bg-green-100 text-green-800 border-green-200'
  if (stock > 0) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

export const getStockLevelText = (stock: number): string => {
  if (stock > 10) return `Stok: ${stock}`
  if (stock > 0) return `Stok Rendah: ${stock}`
  return 'Habis'
}
