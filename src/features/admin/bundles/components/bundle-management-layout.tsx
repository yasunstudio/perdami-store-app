'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3,
  List,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Download
} from 'lucide-react'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { BundleList } from './bundle-list-table'
import { BundleMobileCard } from './bundle-mobile-card'
import { ProductBundleWithRelations } from '../types/bundle.types'
import { toast } from 'sonner'

interface BundleFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  sortBy: 'name' | 'price' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

interface BundleListResponse {
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

export function BundleManagementLayout() {
  const router = useRouter()
  const [bundles, setBundles] = useState<BundleListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bundleToDelete, setBundleToDelete] = useState<ProductBundleWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Export state
  const [isExporting, setIsExporting] = useState(false)

  // Filter state
  const [filters, setFilters] = useState<BundleFilters>({
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10 // Will be dynamic based on view mode
  })

  // Dynamic pagination limit based on view mode
  const getPaginationLimit = useCallback(() => {
    return viewMode === 'grid' ? 12 : 10
  }, [viewMode])

  // Update limit when view mode changes
  useEffect(() => {
    const newLimit = getPaginationLimit()
    if (filters.limit !== newLimit) {
      setFilters(prev => ({
        ...prev,
        limit: newLimit,
        page: 1 // Reset to first page when changing view mode
      }))
    }
  }, [viewMode, filters.limit, getPaginationLimit])

  // Fetch initial data
  useEffect(() => {
    fetchBundles().finally(() => {
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch bundles when filters change
  useEffect(() => {
    if (!loading) {
      fetchBundles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchBundles = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/admin/bundles?${params}`)
      const result = await response.json()
      if (response.ok) {
        setBundles(result)
      } else {
        toast.error(result.error || 'Gagal mengambil data bundle')
      }
    } catch (error) {
      console.error('Error fetching bundles:', error)
      toast.error('Terjadi kesalahan saat mengambil data bundle')
    }
  }, [filters])

  // Handlers
  const handleAddBundle = () => {
    router.push('/admin/bundles/new')
  }

  const handleEditBundle = (bundle: ProductBundleWithRelations) => {
    router.push(`/admin/bundles/${bundle.id}/edit`)
  }

  const handleViewBundle = (bundle: ProductBundleWithRelations) => {
    router.push(`/admin/bundles/${bundle.id}`)
  }

  const handleDeleteBundle = (bundleId: string) => {
    const bundle = bundles?.bundles.find(b => b.id === bundleId)
    if (!bundle) return

    setBundleToDelete(bundle)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteBundle = async () => {
    if (!bundleToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/bundles/${bundleToDelete.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Bundle berhasil dihapus')
        // Refresh bundles after deletion
        await fetchBundles()
        setDeleteDialogOpen(false)
        setBundleToDelete(null)
      } else {
        toast.error(result.error || 'Gagal menghapus bundle')
      }
    } catch (error) {
      console.error('Error deleting bundle:', error)
      toast.error('Terjadi kesalahan saat menghapus bundle')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setBundleToDelete(null)
  }

  const handleToggleStatus = async (bundleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/bundles/${bundleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        toast.success(`Bundle berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
        await fetchBundles()
      } else {
        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json()
          toast.error(result.error || 'Gagal mengubah status bundle')
        } else {
          toast.error(`Gagal mengubah status bundle (${response.status})`)
        }
      }
    } catch (error) {
      console.error('Error toggling bundle status:', error)
      toast.error('Terjadi kesalahan saat mengubah status bundle')
    }
  }

  const handleToggleFeatured = async (bundleId: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/bundles/${bundleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFeatured }),
      })

      if (response.ok) {
        toast.success(`Bundle berhasil ${isFeatured ? 'dijadikan featured' : 'dihapus dari featured'}`)
        await fetchBundles()
      } else {
        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json()
          toast.error(result.error || 'Gagal mengubah status featured bundle')
        } else {
          toast.error(`Gagal mengubah status featured bundle (${response.status})`)
        }
      }
    } catch (error) {
      console.error('Error toggling bundle featured status:', error)
      toast.error('Terjadi kesalahan saat mengubah status featured bundle')
    }
  }

  const handleToggleShowToCustomer = async (bundleId: string, showToCustomer: boolean) => {
    try {
      const response = await fetch(`/api/admin/bundles/${bundleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ showToCustomer }),
      })

      if (response.ok) {
        toast.success(`Bundle berhasil ${showToCustomer ? 'ditampilkan ke customer' : 'disembunyikan dari customer'}`)
        await fetchBundles()
      } else {
        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json()
          toast.error(result.error || 'Gagal mengubah visibilitas bundle ke customer')
        } else {
          toast.error(`Gagal mengubah visibilitas bundle ke customer (${response.status})`)
        }
      }
    } catch (error) {
      console.error('Error toggling bundle visibility to customer:', error)
      toast.error('Terjadi kesalahan saat mengubah visibilitas bundle ke customer')
    }
  }

  const handleFilterChange = (key: keyof BundleFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && { page: 1 }) // Reset page when other filters change
    }))
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await fetchBundles()
      toast.success('Data berhasil dimuat ulang')
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast.error('Gagal memuat ulang data')
    } finally {
      setLoading(false)
    }
  }

  const handleExportToExcel = async () => {
    setIsExporting(true)
    try {
      // Create params for export (all data, not paginated)
      const exportParams = new URLSearchParams()
      exportParams.append('export', 'true')
      if (filters.search) exportParams.append('search', filters.search)
      if (filters.status !== 'all') exportParams.append('status', filters.status)
      if (filters.sortBy) exportParams.append('sortBy', filters.sortBy)
      if (filters.sortOrder) exportParams.append('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/admin/bundles/export?${exportParams}`)
      
      if (!response.ok) {
        throw new Error('Gagal mengekspor data')
      }

      // Get the blob and create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      link.download = `bundles-export-${timestamp}.xlsx`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Data berhasil diekspor ke Excel')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Gagal mengekspor data')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AdminPageLayout 
      title="Manajemen Paket Produk" 
      description="Kelola semua bundle produk dan informasinya"
      loading={loading}
    >
      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Filter & Tampilan</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{loading ? 'Memuat...' : 'Refresh'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToExcel}
                disabled={isExporting || loading}
                className="h-8"
              >
                <Download className={`h-4 w-4 mr-1 ${isExporting ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{isExporting ? 'Export...' : 'Export'}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleAddBundle}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Tambah</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari bundle..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value as 'all' | 'active' | 'inactive')}
            >
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select
              value={filters.sortBy || 'createdAt'}
              onValueChange={(value) => handleFilterChange('sortBy', value as 'name' | 'price' | 'createdAt')}
            >
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Tanggal Dibuat</SelectItem>
                <SelectItem value="name">Nama</SelectItem>
                <SelectItem value="price">Harga</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bundles List/Grid */}
          <div className="min-h-[400px]">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                {bundles?.bundles?.map((bundle) => (
                  <BundleMobileCard
                    key={bundle.id}
                    bundle={bundle}
                    onView={() => handleViewBundle(bundle)}
                    onEdit={() => handleEditBundle(bundle)}
                    onDelete={() => handleDeleteBundle(bundle.id)}
                    onToggleStatus={(bundleId: string, isActive: boolean) => handleToggleStatus(bundleId, isActive)}
                    onToggleFeatured={(bundleId: string, isFeatured: boolean) => handleToggleFeatured(bundleId, isFeatured)}
                    onToggleShowToCustomer={(bundleId: string, showToCustomer: boolean) => handleToggleShowToCustomer(bundleId, showToCustomer)}
                  />
                )) || []}
              </div>
            ) : (
              <BundleList
                bundles={bundles?.bundles || []}
                onEdit={handleEditBundle}
                onDelete={(bundle: ProductBundleWithRelations) => handleDeleteBundle(bundle.id)}
                onView={handleViewBundle}
                onToggleStatus={(bundleId: string, isActive: boolean) => handleToggleStatus(bundleId, isActive)}
                onToggleFeatured={(bundleId: string, isFeatured: boolean) => handleToggleFeatured(bundleId, isFeatured)}
                onToggleShowToCustomer={(bundleId: string, showToCustomer: boolean) => handleToggleShowToCustomer(bundleId, showToCustomer)}
              />
            )}

            {/* Grid Mode Empty State */}
            {viewMode === 'grid' && bundles?.bundles?.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Tidak ada bundle ditemukan
                </h3>
                <p className="text-sm text-muted-foreground">
                  Coba ubah filter pencarian atau tambah bundle baru
                </p>
              </div>
            )}
            
            {/* Pagination Info for Both Views */}
            {bundles?.pagination && (
              <div className="flex items-center justify-between text-sm text-muted-foreground px-6 py-2 border-t mt-6">
                <div className="flex items-center gap-4">
                  <span>Menampilkan {bundles.bundles.length} dari {bundles.pagination.total} bundle</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    {viewMode === 'grid' ? '12/halaman' : '10/halaman'}
                  </span>
                </div>
                <div>
                  Halaman {bundles.pagination.currentPage} dari {bundles.pagination.totalPages}
                </div>
              </div>
            )}
            
            {/* Pagination Controls for Both Views */}
            {bundles?.pagination && bundles.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-6 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                  disabled={!bundles.pagination.hasPrevPage}
                  className="h-8 px-3"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, bundles.pagination.totalPages) }, (_, i) => {
                    const currentPage = filters.page || 1
                    const totalPages = bundles.pagination.totalPages
                    
                    let startPage = Math.max(1, currentPage - 2)
                    const endPage = Math.min(totalPages, startPage + 4)
                    
                    if (endPage - startPage < 4) {
                      startPage = Math.max(1, endPage - 4)
                    }
                    
                    const pageNumber = startPage + i
                    
                    if (pageNumber > endPage) return null
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('page', pageNumber)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                  disabled={!bundles.pagination.hasNextPage}
                  className="h-8 px-3"
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Konfirmasi Hapus Bundle
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Tindakan ini tidak dapat dibatalkan
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                    Anda akan menghapus bundle "{bundleToDelete?.name}"
                  </p>
                  <p className="text-red-700 dark:text-red-300">
                    Semua data terkait termasuk riwayat pesanan yang menggunakan bundle ini akan terpengaruh. 
                    Pastikan Anda telah membackup data penting sebelum melanjutkan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteBundle}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Bundle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  )
}
