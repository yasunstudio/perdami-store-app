'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { StoreListResponse, StoreWithRelations, StoreFilters } from '../types/store.types'

interface StoreListProps {
  initialData?: StoreListResponse
  onEdit?: (store: StoreWithRelations) => void
  onDelete?: (store: StoreWithRelations) => void
  onToggleStatus?: (storeId: string, isActive: boolean) => void
  onFilterChange?: (key: keyof StoreFilters, value: string | number) => void
  filters?: StoreFilters
}

export function StoreList({
  initialData,
  onEdit,
  onDelete,
  onToggleStatus,
  onFilterChange,
  filters
}: StoreListProps) {
  const [loadingStoreId, setLoadingStoreId] = useState<string | null>(null)

  const handleToggleStatus = async (store: StoreWithRelations, checked: boolean) => {
    if (onToggleStatus) {
      setLoadingStoreId(store.id)
      try {
        await onToggleStatus(store.id, checked)
      } finally {
        setLoadingStoreId(null)
      }
    }
  }

  const handleEdit = (store: StoreWithRelations) => {
    if (onEdit) {
      onEdit(store)
    }
  }

  const handleDelete = (store: StoreWithRelations) => {
    if (onDelete) {
      onDelete(store)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (!initialData?.stores.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏪</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Belum ada toko
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Belum ada toko yang terdaftar. Tambahkan toko pertama untuk memulai.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Toko</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Bundle</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-[70px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.stores.map((store) => (
              <TableRow key={store.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={store.image || undefined} alt={store.name} />
                      <AvatarFallback>
                        {store.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{store.name}</div>
                      {store.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {store.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={store.isActive ? 'default' : 'secondary'}
                    className={store.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                  >
                    {store.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {store.city && store.province && (
                      <span>{store.city}, {store.province}</span>
                    )}
                    {store.address && (
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {store.address}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {store.bundleCount || store._count?.bundles || 0}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(store.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        disabled={loadingStoreId === store.id}
                      >
                        <span className="sr-only">Buka menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(store)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(store, !store.isActive)}>
                        {store.isActive ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Nonaktifkan
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Aktifkan
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(store)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination info */}
      {initialData.pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-6 py-2 border-t">
          <div>
            Menampilkan {initialData.stores.length} dari {initialData.pagination.totalCount} toko
          </div>
          <div>
            Halaman {initialData.pagination.currentPage} dari {initialData.pagination.totalPages}
          </div>
        </div>
      )}
      
      {/* Pagination Controls */}
      {initialData.pagination && initialData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFilterChange?.('page', (filters?.page || 1) - 1)}
            disabled={!initialData.pagination.hasPreviousPage}
            className="h-8 px-3"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sebelumnya
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, initialData.pagination.totalPages) }, (_, i) => {
              const currentPage = filters?.page || 1
              const totalPages = initialData.pagination.totalPages
              
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
                  onClick={() => onFilterChange?.('page', pageNumber)}
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
            onClick={() => onFilterChange?.('page', (filters?.page || 1) + 1)}
            disabled={!initialData.pagination.hasNextPage}
            className="h-8 px-3"
          >
            Selanjutnya
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
