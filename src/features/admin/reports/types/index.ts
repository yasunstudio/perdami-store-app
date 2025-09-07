export interface DateRange {
  from: Date
  to: Date
}

export interface ReportFilters {
  dateRange: DateRange
  storeId?: string
  userId?: string
}

export interface SalesReportData {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProducts: Array<{
    id: string
    name: string
    quantity: number
    revenue: number
  }>
  salesByDay: Array<{
    date: string
    sales: number
    orders: number
  }>
  salesByStore: Array<{
    storeId: string
    storeName: string
    sales: number
    orders: number
  }>
}

export interface PurchaseReportData {
  totalPurchases: number
  totalTransactions: number
  averageTransactionValue: number
  topCustomers: Array<{
    id: string
    name: string
    email: string
    totalSpent: number
    orderCount: number
  }>
  purchasesByDay: Array<{
    date: string
    purchases: number
    transactions: number
  }>
  purchasesByStore: Array<{
    storeId: string
    storeName: string
    purchases: number
    transactions: number
  }>
}

export interface ProfitLossReportData {
  totalRevenue: number
  totalCosts: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  revenueByMonth: Array<{
    month: string
    revenue: number
    costs: number
    profit: number
  }>
  topProfitableProducts: Array<{
    id: string
    name: string
    revenue: number
    cost: number
    profit: number
    margin: number
  }>
  profitByStore: Array<{
    storeId: string
    storeName: string
    revenue: number
    costs: number
    profit: number
  }>
}

export interface ReportExportOptions {
  format: 'excel' | 'pdf' | 'csv'
  includeCharts: boolean
  dateRange: DateRange
}
