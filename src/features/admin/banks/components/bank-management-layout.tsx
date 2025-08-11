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
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { BankList } from './bank-list'
import { BankMobileCard } from './bank-mobile-card'
import { BankListSkeleton } from './bank-list-skeleton'
import type { 
  BankListResponse, 
  BankWithRelations, 
  BankFilters
} from '../types/bank.types'
import { toast } from 'sonner'

export function BankManagementLayout() {
  const router = useRouter()
  const [banks, setBanks] = useState<BankListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')


  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bankToDelete, setBankToDelete] = useState<BankWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter state
  const [filters, setFilters] = useState<BankFilters>({
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  })



  const fetchBanks = useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })

      const response = await fetch(`/api/admin/banks?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch banks')
      }

      const data = await response.json()
      setBanks(data)
    } catch (error) {
      console.error('Error fetching banks:', error)
      toast.error('Gagal memuat data bank')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchBanks()
  }, [fetchBanks])

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status: status as any, page: 1 }))
  }

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortBy as any,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleAddBank = () => {
    router.push('/admin/banks/new')
  }

  const handleEditBank = (bankId: string) => {
    router.push(`/admin/banks/${bankId}/edit`)
  }

  const handleDeleteBank = (bankId: string) => {
    const bank = banks?.banks.find(b => b.id === bankId)
    if (!bank) return

    setBankToDelete(bank)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!bankToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/banks/${bankToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete bank')
      }

      toast.success('Bank berhasil dihapus')
      fetchBanks()
    } catch (error) {
      console.error('Error deleting bank:', error)
      toast.error('Gagal menghapus bank')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setBankToDelete(null)
    }
  }

  const handleRefresh = () => {
    fetchBanks()
  }

  return (
    <AdminPageLayout
      title="Manajemen Bank"
      description="Kelola data bank untuk metode pembayaran"
    >
      {/* Main Content */}
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
                {loading ? 'Memuat...' : 'Refresh'}
              </Button>
              <Button onClick={handleAddBank} size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Bank
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
                placeholder="Cari bank..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={filters.status} onValueChange={handleStatusFilter}>
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

          {/* Banks List/Grid */}
          <div className="min-h-[400px]">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {banks?.banks?.map((bank) => (
                  <BankMobileCard
                    key={bank.id}
                    bank={bank}
                    onEdit={handleEditBank}
                    onDelete={handleDeleteBank}
                  />
                ))}
              </div>
            ) : loading ? (
              <BankListSkeleton />
            ) : (
              <BankList
                banks={banks?.banks || []}
                onEdit={handleEditBank}
                onDelete={handleDeleteBank}
                onSort={handleSortChange}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
              />
            )}
          </div>

          {/* Pagination */}
          {banks && banks.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Menampilkan {((filters.page - 1) * filters.limit) + 1} - {Math.min(filters.page * filters.limit, banks.pagination.totalCount)} dari {banks.pagination.totalCount} bank
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={!banks.pagination.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                
                <span className="text-sm font-medium">
                  Halaman {filters.page} dari {banks.pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={!banks.pagination.hasNextPage}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus bank &quot;{bankToDelete?.name}&quot;? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  )
}