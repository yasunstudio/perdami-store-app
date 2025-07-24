'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Activity, User, Calendar, Globe, Monitor, RefreshCw, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ActivityLogEntry } from '../services/user-activity-log.service'
// UserActivityAction type removed as it doesn't exist in schema

interface UserActivityLogProps {
  userId?: string
  limit?: number
  showFilters?: boolean
}

interface ActivityLogResponse {
  logs: ActivityLogEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const getActionColor = (action: string) => {
  const colors = {
    LOGIN: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    LOGOUT: 'bg-muted text-muted-foreground border-border',
    CREATE_USER: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    UPDATE_USER: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    DELETE_USER: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    UPDATE_ROLE: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    VIEW_PROFILE: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
    CREATE_ORDER: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    UPDATE_ORDER: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    DELETE_ORDER: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    CREATE_PRODUCT: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800',
    UPDATE_PRODUCT: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800',
    DELETE_PRODUCT: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    VIEW_ADMIN_DASHBOARD: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800',
    EXPORT_DATA: 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/20 dark:text-lime-400 dark:border-lime-800',
    IMPORT_DATA: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  }
  return colors[action as keyof typeof colors] || 'bg-muted text-muted-foreground border-border'
}

const getActionText = (action: string) => {
  const texts = {
    LOGIN: 'Login',
    LOGOUT: 'Logout',
    CREATE_USER: 'Buat User',
    UPDATE_USER: 'Update User',
    DELETE_USER: 'Hapus User',
    UPDATE_ROLE: 'Ubah Role',
    VIEW_PROFILE: 'Lihat Profil',
    CREATE_ORDER: 'Buat Pesanan',
    UPDATE_ORDER: 'Update Pesanan',
    DELETE_ORDER: 'Hapus Pesanan',
    CREATE_PRODUCT: 'Buat Produk',
    UPDATE_PRODUCT: 'Update Produk',
    DELETE_PRODUCT: 'Hapus Produk',
    VIEW_ADMIN_DASHBOARD: 'Lihat Dashboard',
    EXPORT_DATA: 'Export Data',
    IMPORT_DATA: 'Import Data',
  }
  return texts[action as keyof typeof texts] || action
}

export function UserActivityLog({ userId, limit = 20, showFilters = true }: UserActivityLogProps) {
  const [data, setData] = useState<ActivityLogResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(limit)
  
  // Set default date filters to current month
  const getCurrentMonthDates = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    return {
      dateFrom: format(firstDay, 'yyyy-MM-dd'),
      dateTo: format(lastDay, 'yyyy-MM-dd')
    }
  }
  
  const [filters, setFilters] = useState({
    action: 'ALL',
    resource: 'ALL',
    ...getCurrentMonthDates()
  })

  const fetchLogs = useCallback(async (page = 1, newFilters = filters) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString()
      })

      if (userId) {
        params.append('userId', userId)
      }
      if (newFilters.action && newFilters.action !== 'ALL') {
        params.append('action', newFilters.action)
      }
      if (newFilters.resource && newFilters.resource !== 'ALL') {
        params.append('resource', newFilters.resource)
      }
      if (newFilters.dateFrom) {
        params.append('dateFrom', newFilters.dateFrom)
      }
      if (newFilters.dateTo) {
        params.append('dateTo', newFilters.dateTo)
      }

      const response = await fetch(`/api/users/activity-logs?${params}`)
      const result = await response.json()
      setData(result)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, pageSize, filters])

  useEffect(() => {
    fetchLogs()
  }, [userId, fetchLogs])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filtering
    fetchLogs(1, newFilters)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1) // Reset to first page when changing page size
    fetchLogs(1, filters)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && data && page <= data.pagination.totalPages) {
      fetchLogs(page)
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!data) return []
    
    const { page, totalPages } = data.pagination
    const pageNumbers = []
    const maxPagesToShow = 5
    
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    
    return pageNumbers
  }

  const formatLogDetails = (details: string | null) => {
    if (!details) return null
    try {
      return JSON.parse(details)
    } catch {
      return details
    }
  }

  if (isLoading && !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div>
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-5 w-5" />
            Log Aktivitas
          </CardTitle>
          {data && (
            <p className="text-sm text-muted-foreground mt-2">
              {data.pagination.total} aktivitas tercatat
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="default" 
          onClick={() => fetchLogs(currentPage)}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters */}
        {showFilters && (            <div className="space-y-4 p-4 bg-muted rounded-lg border">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            
            {/* First row: Action and Resource filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Jenis Aktivitas</label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => handleFilterChange('action', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Aktivitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Aktivitas</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                    <SelectItem value="CREATE_USER">Buat User</SelectItem>
                    <SelectItem value="UPDATE_USER">Update User</SelectItem>
                    <SelectItem value="DELETE_USER">Hapus User</SelectItem>
                    <SelectItem value="UPDATE_ROLE">Ubah Role</SelectItem>
                    <SelectItem value="VIEW_ADMIN_DASHBOARD">Lihat Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Resource</label>
                <Select
                  value={filters.resource}
                  onValueChange={(value) => handleFilterChange('resource', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Resource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Resource</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Second row: Date filters and Page size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Dari tanggal</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sampai tanggal</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Per halaman</label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Per halaman" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per halaman</SelectItem>
                    <SelectItem value="20">20 per halaman</SelectItem>
                    <SelectItem value="50">50 per halaman</SelectItem>
                    <SelectItem value="100">100 per halaman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Activity Logs */}
        {!data || data.logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {isLoading ? 'Memuat aktivitas...' : 'Tidak ada aktivitas ditemukan'}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {isLoading ? 'Mohon tunggu sebentar' : 'Log aktivitas akan muncul di sini'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Memuat...</span>
                </div>
              </div>
            )}
            
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {data.logs.map((log) => {
                  const details = formatLogDetails(log.details || null)
                  
                  return (
                    <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <Badge className={`${getActionColor(log.action)} text-xs font-medium`}>
                            {getActionText(log.action)}
                          </Badge>
                          
                          <span className="text-sm font-medium">
                            {log.user?.name || log.user?.email || 'Unknown User'}
                          </span>
                          
                          <Badge variant="outline" className="text-xs">
                            User
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {log.resource} {log.resourceId && `(ID: ${log.resourceId})`}
                        </p>
                        
                        {details && typeof details === 'object' && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <pre className="whitespace-pre-wrap font-mono">
                              {JSON.stringify(details, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </div>
                          
                          {log.ipAddress && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {log.ipAddress}
                            </div>
                          )}
                          
                          {log.userAgent && (
                            <div className="flex items-center gap-1">
                              <Monitor className="h-3 w-3" />
                              <span className="truncate max-w-32">
                                {log.userAgent.split(' ')[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Enhanced Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-col space-y-4">
              {/* Pagination Info */}
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                <div className="text-sm text-muted-foreground">
                  Menampilkan <span className="font-medium">{((data.pagination.page - 1) * data.pagination.limit) + 1}</span> hingga{' '}
                  <span className="font-medium">
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                  </span>{' '}
                  dari <span className="font-medium">{data.pagination.total}</span> aktivitas
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Halaman <span className="font-medium">{data.pagination.page}</span> dari <span className="font-medium">{data.pagination.totalPages}</span>
                </div>
              </div>
              
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => goToPage(1)}
                  disabled={currentPage <= 1 || isLoading}
                  className="w-full sm:w-auto"
                >
                  <span className="sm:hidden">Pertama</span>
                  <span className="hidden sm:inline">Pertama</span>
                </Button>
                
                {/* Previous Page */}
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  className="w-full sm:w-auto"
                >
                  <span className="sm:hidden">Sebelumnya</span>
                  <span className="hidden sm:inline">‹ Sebelumnya</span>
                </Button>
                
                {/* Page Numbers (Desktop only) */}
                <div className="hidden sm:flex items-center space-x-1">
                  {getPageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="default"
                      onClick={() => goToPage(pageNum)}
                      disabled={isLoading}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>
                
                {/* Mobile Page Info */}
                <div className="sm:hidden text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
                  Halaman {currentPage} dari {data.pagination.totalPages}
                </div>
                
                {/* Next Page */}
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= data.pagination.totalPages || isLoading}
                  className="w-full sm:w-auto"
                >
                  <span className="sm:hidden">Selanjutnya</span>
                  <span className="hidden sm:inline">Selanjutnya ›</span>
                </Button>
                
                {/* Last Page */}
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => goToPage(data.pagination.totalPages)}
                  disabled={currentPage >= data.pagination.totalPages || isLoading}
                  className="w-full sm:w-auto"
                >
                  <span className="sm:hidden">Terakhir</span>
                  <span className="hidden sm:inline">Terakhir</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}