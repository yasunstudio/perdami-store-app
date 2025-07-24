// Store Management Types
export interface StoreWithRelations {
  id: string
  name: string
  description?: string | null
  image?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    bundles: number
  }
  bundleCount?: number
}

export interface StoreListResponse {
  stores: StoreWithRelations[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface StoreStats {
  totalStores: number
  activeStores: number
  inactiveStores: number
  recentStores: number
  storesWithoutBundles: number
  topStoresByBundles: Array<{
    id: string
    name: string
    _count: {
      bundles: number
    }
  }>
  topStoresByOrders: StoreWithRelations[]
  growthRate: number
}

export interface StoreFormData {
  name: string
  description?: string
  image?: string
  address?: string
  city?: string
  province?: string
  isActive: boolean
}

export interface StoreFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'bundleCount'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}
