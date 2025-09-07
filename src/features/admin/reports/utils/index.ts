import { DateRange, ReportFilters } from '../types/index'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num)
}

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`
}

export const formatDate = (date: Date): string => {
  return format(date, 'dd MMMM yyyy', { locale: id })
}

export const formatShortDate = (date: Date): string => {
  return format(date, 'dd MMM', { locale: id })
}

export const getDefaultDateRange = (): DateRange => {
  // Set default range untuk last 30 days 
  const to = new Date()
  const from = subDays(to, 30)
  return { from, to }
}

export const getMonthDateRange = (): DateRange => {
  const now = new Date()
  return {
    from: startOfMonth(now),
    to: endOfMonth(now)
  }
}

export const formatDateForAPI = (date: Date): string => {
  return format(date, 'yyyy-MM-dd')
}

export const generateDateRangeQuery = (dateRange: DateRange) => {
  return {
    from: formatDateForAPI(dateRange.from),
    to: formatDateForAPI(dateRange.to)
  }
}

export const buildReportFilters = (filters: Partial<ReportFilters>): URLSearchParams => {
  const params = new URLSearchParams()
  
  if (filters.dateRange) {
    params.append('from', formatDateForAPI(filters.dateRange.from))
    params.append('to', formatDateForAPI(filters.dateRange.to))
  }
  
  if (filters.storeId) {
    params.append('storeId', filters.storeId)
  }
  
  if (filters.userId) {
    params.append('userId', filters.userId)
  }
  
  return params
}

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const getGrowthIndicator = (growthRate: number) => {
  if (growthRate > 0) return { direction: 'up', color: 'text-green-600' }
  if (growthRate < 0) return { direction: 'down', color: 'text-red-600' }
  return { direction: 'same', color: 'text-gray-600' }
}
