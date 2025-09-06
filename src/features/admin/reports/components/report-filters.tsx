'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd MMM', { locale: id })} -{' '}
                    {format(dateRange.to, 'dd MMM yyyy', { locale: id })}
                  </>
                ) : (
                  format(dateRange.from, 'dd MMM yyyy', { locale: id })
                )
              ) : (
                'Pilih tanggal'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="space-y-3 p-3">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickDateSelect('last7days')}
                  className="justify-start h-8"
                >
                  7 Hari Terakhir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickDateSelect('last30days')}
                  className="justify-start h-8"
                >
                  30 Hari Terakhir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickDateSelect('thisMonth')}
                  className="justify-start h-8"
                >
                  Bulan Ini
                </Button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
                Atau pilih tanggal custom di form tanggal
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
