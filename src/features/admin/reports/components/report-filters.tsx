'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { DateRange, ReportFilters } from '../types/index'
import { getDefaultDateRange, getMonthDateRange } from '../utils/index'

interface ReportFiltersProps {
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
  showStoreFilter?: boolean
  showCategoryFilter?: boolean
  showUserFilter?: boolean
  stores?: Array<{ id: string; name: string }>
  categories?: Array<{ id: string; name: string }>
}

export function ReportFilters({
  filters,
  onFiltersChange,
  showStoreFilter = false,
  showCategoryFilter = false,
  showUserFilter = false,
  stores = [],
  categories = []
}: ReportFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange>(filters.dateRange)

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
    onFiltersChange({ ...filters, dateRange: range })
  }

  const handleQuickDateSelect = (type: 'last7days' | 'last30days' | 'thisMonth') => {
    let newRange: DateRange
    
    switch (type) {
      case 'last7days':
        newRange = {
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          to: new Date()
        }
        break
      case 'last30days':
        newRange = getDefaultDateRange()
        break
      case 'thisMonth':
        newRange = getMonthDateRange()
        break
      default:
        return
    }
    
    handleDateRangeChange(newRange)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Date Range Picker */}
      <div className="space-y-2">
        <Label>Periode Tanggal</Label>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400">Dari Tanggal</Label>
              <input
                type="date"
                value={format(dateRange.from, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const newFrom = new Date(e.target.value)
                  if (newFrom <= dateRange.to) {
                    handleDateRangeChange({ from: newFrom, to: dateRange.to })
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400">Sampai Tanggal</Label>
              <input
                type="date"
                value={format(dateRange.to, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const newTo = new Date(e.target.value)
                  if (newTo >= dateRange.from) {
                    handleDateRangeChange({ from: dateRange.from, to: newTo })
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickDateSelect('last7days')}
              className="text-xs h-7"
            >
              7 Hari
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickDateSelect('last30days')}
              className="text-xs h-7"
            >
              30 Hari
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickDateSelect('thisMonth')}
              className="text-xs h-7"
            >
              Bulan Ini
            </Button>
          </div>
        </div>
      </div>

      {/* Store Filter */}
      {showStoreFilter && (
        <div className="space-y-2">
          <Label>Toko</Label>
          <Select
            value={filters.storeId || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                storeId: value === 'all' ? undefined : value
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Toko" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Toko</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Category Filter */}
      {showCategoryFilter && (
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select
            value={filters.categoryId || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                categoryId: value === 'all' ? undefined : value
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
