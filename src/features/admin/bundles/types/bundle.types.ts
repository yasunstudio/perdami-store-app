// Bundle content item structure - simplified
export interface BundleContentItem {
  name: string
  quantity: number
}

// Bundle content item with ID for drag & drop functionality
export interface BundleContentItemWithId extends BundleContentItem {
  id: string
}

export interface ProductBundle {
  id: string
  name: string
  description?: string | null
  image?: string | null
  price: number
  contents?: BundleContentItem[] | null
  isActive: boolean
  isFeatured: boolean
  showToCustomer: boolean
  storeId: string
  createdAt: string
  updatedAt: string
  store: {
    id: string
    name: string
    description?: string | null
    address?: string | null
    city?: string | null
  }
  _count?: {
    orderItems: number
  }
}

export interface ProductBundleWithRelations extends ProductBundle {}

// Bundle form data - simplified without stock, now using storeId
export interface BundleFormData {
  name: string
  description?: string
  price: number
  storeId: string
  image?: string
  contents?: BundleContentItemWithId[]
  isActive: boolean
  isFeatured: boolean
  showToCustomer: boolean
}

// Bundle filters
export interface BundleFilters {
  search?: string
  storeId?: string
  status?: 'active' | 'inactive' | 'all'
  sortBy?: 'name' | 'price' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Bundle list response
export interface BundleListResponse {
  bundles: ProductBundleWithRelations[]
  pagination: {
    total: number
    totalPages: number
    currentPage: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// Bundle stats
export interface BundleStats {
  total: number
  active: number
  inactive: number
  featured: number
  totalSales: number
  revenue: number
  averagePrice: number
}
