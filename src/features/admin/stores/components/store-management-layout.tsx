'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3,
  List,
  RefreshCw,
  Store,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react'
import { AdminPageLayout, StatsCard } from '@/components/admin/admin-page-layout'
import { StoreList } from './store-list'
import { StoreMobileCard } from './store-mobile-card'
import { StoreListSkeleton } from './store-list-skeleton'
import type { 
  StoreListResponse, 
  StoreWithRelations, 
  StoreFilters,
  StoreStats
} from '../types/store.types'
import { toast } from 'sonner'

export function StoreManagementLayout() {
  const router = useRouter()
  const [stores, setStores] = useState<StoreListResponse | null>(null)
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')


  
  // Remove form state - no longer needed
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [storeToDelete, setStoreToDelete] = useState<StoreWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter state
  const [filters, setFilters] = useState<StoreFilters>({
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  })



  // Fetch initial data
  useEffect(() => {
    Promise.all([
      fetchStores(),
      fetchStats()
    ]).finally(() => {
      setLoading(false)
      setStatsLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch stores when filters change
  useEffect(() => {
    if (!loading) {
      fetchStores()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchStores = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/admin/stores?${params}`)
      const result = await response.json()
      if (response.ok) {
        setStores(result)
      } else {
        toast.error(result.error || 'Gagal mengambil data toko')
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
      toast.error('Terjadi kesalahan saat mengambil data toko')
    }
  }, [filters])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stores/stats')
      const result = await response.json()
      if (response.ok) {
        setStats(result)
      } else {
        console.error('Failed to fetch stats:', result.error)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Handlers
  const handleAddStore = () => {
    router.push('/admin/stores/new')
  }

  const handleEditStore = (store: StoreWithRelations) => {
    router.push(`/admin/stores/${store.id}/edit`)
  }

  const handleDeleteStore = (storeId: string) => {
    const store = stores?.stores.find(s => s.id === storeId)
    if (!store) return

    setStoreToDelete(store)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteStore = async () => {
    if (!storeToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/stores/${storeToDelete.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        // Refresh both stores and stats after deletion
        await Promise.all([
          fetchStores(),
          fetchStats()
        ])
        setDeleteDialogOpen(false)
        setStoreToDelete(null)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error deleting store:', error)
      toast.error('Terjadi kesalahan saat menghapus toko')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setStoreToDelete(null)
  }

  const handleToggleStatus = async (storeId: string, isActive: boolean) => {
    console.log('🔄 Toggle status:', { storeId, isActive })
    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive,
        }),
      })

      const result = await response.json()
      console.log('📡 Toggle response:', { status: response.status, result })

      if (response.ok) {
        toast.success(`Toko berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`)
        // Refresh both stores and stats after status change
        await Promise.all([
          fetchStores(),
          fetchStats()
        ])
      } else {
        toast.error(result.error || 'Gagal mengubah status toko')
        console.error('❌ Toggle failed:', result)
      }
    } catch (error) {
      console.error('❌ Error toggling store status:', error)
      toast.error('Terjadi kesalahan saat mengubah status toko')
    }
  }

  // Remove handleFormSuccess - no longer needed

  const handleFilterChange = (key: keyof StoreFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && { page: 1 }) // Reset page when other filters change
    }))
  }

  const handleRefresh = async () => {
    setStatsLoading(true)
    try {
      await Promise.all([
        fetchStores(),
        fetchStats()
      ])
      toast.success('Data berhasil dimuat ulang')
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast.error('Gagal memuat ulang data')
    } finally {
      setStatsLoading(false)
    }
  }

  const actions = null

  if (loading) {
    return (
      <AdminPageLayout 
        title="Manajemen Toko" 
        description="Kelola semua toko partner dan informasinya"
        actions={actions}
        loading={true}
      >
        <StoreListSkeleton />
      </AdminPageLayout>
    )
  }

  return (
      <AdminPageLayout 
        title="Manajemen Toko" 
        description="Kelola semua toko partner dan informasinya"
        actions={actions}
        loading={loading}
      >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsLoading ? (
          // Loading skeleton for stats cards
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </>
        ) : (
          <>
            <StatsCard
              title="Total Toko"
              value={stats?.totalStores?.toString() || "0"}
              description="Toko terdaftar"
              icon={<Store className="h-4 w-4" />}
              trend={{ 
                value: Math.abs(stats?.growthRate || 0), 
                isPositive: (stats?.growthRate || 0) >= 0
              }}
            />
            <StatsCard
              title="Toko Aktif"
              value={stats?.activeStores?.toString() || "0"}
              description="Sedang beroperasi"
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{ 
                value: stats?.totalStores ? Math.round((stats.activeStores / stats.totalStores) * 100) : 0, 
                isPositive: true
              }}
            />
            <StatsCard
              title="Tanpa Bundle"
              value={stats?.storesWithoutBundles?.toString() || "0"}
              description="Perlu perhatian"
              icon={<AlertTriangle className="h-4 w-4" />}
              trend={{ 
                value: stats?.totalStores ? Math.round((stats.storesWithoutBundles / stats.totalStores) * 100) : 0, 
                isPositive: false
              }}
            />
          </>
        )}
      </div>

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
                disabled={statsLoading}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${statsLoading ? 'animate-spin' : ''}`} />
                {statsLoading ? 'Memuat...' : 'Refresh'}
              </Button>
              <Button onClick={handleAddStore} size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Toko
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
                placeholder="Cari toko..."
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

          {/* Stores List/Grid */}
          <div className="min-h-[400px]">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stores?.stores?.map((store) => (
                  <StoreMobileCard
                    key={store.id}
                    store={store}
                    onEdit={handleEditStore}
                    onDelete={(store: StoreWithRelations) => handleDeleteStore(store.id)}
                    onToggleStatus={(storeId: string, isActive: boolean) => handleToggleStatus(storeId, isActive)}
                  />
                )) || []}
              </div>
            ) : (
              <StoreList
                initialData={stores || undefined}
                onEdit={handleEditStore}
                onDelete={(store: StoreWithRelations) => handleDeleteStore(store.id)}
                onToggleStatus={(storeId: string, isActive: boolean) => handleToggleStatus(storeId, isActive)}
                onFilterChange={handleFilterChange}
                filters={filters}
              />
            )}

            {/* Grid Mode with Pagination */}
            {viewMode === 'grid' && (
              <>
                {stores?.stores?.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Tidak ada toko ditemukan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Coba ubah filter pencarian atau tambah toko baru
                    </p>
                  </div>
                )}
                
                {/* Pagination Info for Grid */}
                {stores?.pagination && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground px-6 py-2 border-t mt-6">
                    <div>
                      Menampilkan {stores.stores.length} dari {stores.pagination.totalCount} toko
                    </div>
                    <div>
                      Halaman {stores.pagination.currentPage} dari {stores.pagination.totalPages}
                    </div>
                  </div>
                )}
                
                {/* Pagination Controls for Grid */}
                {stores?.pagination && stores.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 px-6 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                      disabled={!stores.pagination.hasPreviousPage}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Sebelumnya
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, stores.pagination.totalPages) }, (_, i) => {
                        const currentPage = filters.page || 1
                        const totalPages = stores.pagination.totalPages
                        
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
                      disabled={!stores.pagination.hasNextPage}
                      className="h-8 px-3"
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Store Form Dialog removed - now using separate pages */}

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
                  Konfirmasi Hapus Toko
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
                    Anda akan menghapus toko "{storeToDelete?.name}"
                  </p>
                  <p className="text-red-700 dark:text-red-300">
                    Semua data terkait termasuk kategori dan riwayat pesanan akan ikut terhapus. 
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
              onClick={confirmDeleteStore}
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
                  Hapus Toko
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  )
}
