// Bank Types for Admin Management

export interface BankWithRelations {
  id: string
  name: string
  code: string
  accountNumber: string
  accountName: string
  logo?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    orders: number
  }
}

export interface BankListResponse {
  banks: BankWithRelations[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface BankStats {
  totalBanks: number
  activeBanks: number
  inactiveBanks: number
  recentBanks: number
  topBanksByOrders: Array<{
    id: string
    name: string
    code: string
    _count: {
      orders: number
    }
  }>
  growthRate: number
}

export interface BankFormData {
  name: string
  code: string
  accountNumber: string
  accountName: string
  logo?: string
  isActive: boolean
}

export interface BankFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  sortBy: 'name' | 'code' | 'createdAt' | 'orders'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

export interface BankFormPageProps {
  mode: 'create' | 'edit'
  bankId?: string
}

export interface BankOption {
  id: string
  name: string
  code: string
}