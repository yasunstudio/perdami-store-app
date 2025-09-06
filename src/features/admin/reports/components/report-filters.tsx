'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Filter, Store, Tag, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { DateRange, ReportFilters } from '../types/index'
import { getDefaultDateRange } from '../utils/index'

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

  const handleResetFilters = () => {
    const defaultFilters: ReportFilters = {
      dateRange: getDefaultDateRange()
    }
    setDateRange(defaultFilters.dateRange)
    onFiltersChange(defaultFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.storeId) count++
    if (filters.categoryId) count++
    if (filters.userId) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className="border-2 bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-900/50 dark:to-blue-900/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Filter Laporan
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} filter aktif
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
          Pilih rentang tanggal dan filter lainnya untuk menganalisis data secara spesifik
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Filters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Date Range Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Periode Pickup
              </Label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Dari Tanggal Pickup
                </Label>
                <input
                  type="date"
                  value={format(dateRange.from, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newFrom = new Date(e.target.value)
                    if (newFrom <= dateRange.to) {
                      handleDateRangeChange({ from: newFrom, to: dateRange.to })
                    }
                  }}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Sampai Tanggal Pickup
                </Label>
                <input
                  type="date"
                  value={format(dateRange.to, 'yyyy-MM-dd')}
                  max="2025-09-07"
                  onChange={(e) => {
                    const newTo = new Date(e.target.value)
                    if (newTo >= dateRange.from) {
                      handleDateRangeChange({ from: dateRange.from, to: newTo })
                    }
                  }}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Store Filter */}
          {showStoreFilter && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Store className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Filter Toko
                </Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Pilih Toko
                </Label>
                <Select
                  value={filters.storeId || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      storeId: value === 'all' ? undefined : value
                    })
                  }
                >
                  <SelectTrigger className="h-10 border-2 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <SelectValue placeholder="Pilih toko..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>Semua Toko</span>
                      </div>
                    </SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>{store.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

                {/* Category Filter - If needed */}
        {showCategoryFilter && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Filter Kategori
                </Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Pilih Kategori
                </Label>
                <Select
                  value={filters.categoryId || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      categoryId: value === 'all' ? undefined : value
                    })
                  }
                >
                  <SelectTrigger className="h-10 border-2 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <SelectValue placeholder="Pilih kategori..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>Semua Kategori</span>
                      </div>
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
