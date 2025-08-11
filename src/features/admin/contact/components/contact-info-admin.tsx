'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { 
  ContactInfo, 
  ContactInfoFilters, 
  ContactInfoListResponse, 
  CONTACT_TYPE_OPTIONS 
} from '../types/contact-info.types'
import { ContactInfoCard } from './contact-info-card'

export function ContactInfoAdmin() {
  const router = useRouter()
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [filters, setFilters] = useState<ContactInfoFilters>({
    type: 'all',
    search: ''
  })

  const fetchContactInfo = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(newFilters.type && newFilters.type !== 'all' && { type: newFilters.type }),
        ...(newFilters.search && { search: newFilters.search })
      })

      const response = await fetch(`/api/admin/contact?${params}`)
      if (!response.ok) throw new Error('Failed to fetch contact info')

      const data: ContactInfoListResponse = await response.json()
      setContactInfo(data.contactInfo)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching contact info:', error)
      toast.error('Gagal mengambil data informasi kontak')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteDialogOpen(id)
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/contact/${id}/edit`)
  }

  const handleFilterChange = (field: keyof ContactInfoFilters, value: string) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    fetchContactInfo(1, newFilters)
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(id)
      const response = await fetch(`/api/admin/contact/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete contact info')

      toast.success('Informasi kontak berhasil dihapus')
      setDeleteDialogOpen(null)
      fetchContactInfo(pagination.currentPage)
    } catch (error) {
      console.error('Error deleting contact info:', error)
      toast.error('Gagal menghapus informasi kontak')
    } finally {
      setDeleteLoading(null)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchContactInfo(page)
    }
  }

  const getPageNumbers = () => {
    const maxVisible = 5
    const pages: number[] = []
    
    if (pagination.totalPages <= maxVisible) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        pages.push(i)
      }
    } else {
      const half = Math.floor(maxVisible / 2)
      let start = Math.max(1, pagination.currentPage - half)
      let end = Math.min(pagination.totalPages, start + maxVisible - 1)
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  useEffect(() => {
    fetchContactInfo()
  }, [])

  if (loading) {
    return (
      <AdminPageLayout
        title="Informasi Kontak"
        description="Mengelola informasi kontak untuk ditampilkan di website"
        loading={loading}
        actions={
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kontak
          </Button>
        }
      >
        <></>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title="Informasi Kontak"
      description="Mengelola informasi kontak untuk ditampilkan di website"
      actions={
        <Button 
          onClick={() => router.push('/admin/contact/new')}
          size="sm"
          className="sm:size-default"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Tambah Kontak</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base sm:text-lg">Filter & Pencarian</CardTitle>
            <CardDescription className="text-sm">
              Filter berdasarkan tipe kontak atau cari berdasarkan nama/nilai
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau nilai kontak..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {CONTACT_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base sm:text-lg">Daftar Kontak</CardTitle>
            <CardDescription className="text-sm">
              {contactInfo.length === 0 ? (
                'Belum ada informasi kontak yang tersedia'
              ) : (
                `${pagination.totalCount} kontak ditemukan`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {contactInfo.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Belum ada informasi kontak</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                  Mulai dengan menambahkan informasi kontak pertama Anda
                </p>
                <Button 
                  onClick={() => router.push('/admin/contact/new')}
                  size="sm"
                  className="sm:size-default"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kontak Pertama
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr">
                {contactInfo.map((item) => (
                  <ContactInfoCard
                    key={item.id}
                    contactInfo={item}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    isDeleting={deleteLoading === item.id}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <>
                <Separator className="my-4" />
                <div className="flex flex-col space-y-4">
                  {/* Pagination Info */}
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan <span className="font-medium">{((pagination.currentPage - 1) * 12) + 1}</span> hingga{' '}
                      <span className="font-medium">
                        {Math.min(pagination.currentPage * 12, pagination.totalCount)}
                      </span>{' '}
                      dari <span className="font-medium">{pagination.totalCount}</span> kontak
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Halaman <span className="font-medium">{pagination.currentPage}</span> dari <span className="font-medium">{pagination.totalPages}</span>
                    </div>
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => goToPage(1)}
                      disabled={pagination.currentPage <= 1 || loading}
                      className="w-full sm:w-auto"
                    >
                      <span className="sm:hidden">Pertama</span>
                      <span className="hidden sm:inline">Pertama</span>
                    </Button>
                    
                    {/* Previous Page */}
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => goToPage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1 || loading}
                      className="w-full sm:w-auto"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span>Sebelumnya</span>
                    </Button>
                    
                    {/* Page Numbers (Desktop only) */}
                    <div className="hidden sm:flex items-center space-x-1">
                      {getPageNumbers().map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.currentPage ? "default" : "outline"}
                          size="default"
                          onClick={() => goToPage(pageNum)}
                          disabled={loading}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Mobile Page Info */}
                    <div className="sm:hidden text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
                      {pagination.currentPage} / {pagination.totalPages}
                    </div>
                    
                    {/* Next Page */}
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => goToPage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages || loading}
                      className="w-full sm:w-auto"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    
                    {/* Last Page */}
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => goToPage(pagination.totalPages)}
                      disabled={pagination.currentPage >= pagination.totalPages || loading}
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

        {/* Delete Dialog */}
        {deleteDialogOpen && (
          <AlertDialog open={!!deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Informasi Kontak</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus informasi kontak ini? 
                  Aksi ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteDialogOpen(null)}>
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteLoading === deleteDialogOpen}
                >
                  {deleteLoading === deleteDialogOpen ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    'Hapus'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </AdminPageLayout>
  )
}
