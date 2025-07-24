'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Eye, Power, PowerOff, Star, StarOff, Users, UserX, Package, ShoppingBag } from 'lucide-react'
import { ProductBundleWithRelations } from '../types/bundle.types'

interface BundleListTableProps {
  bundles: ProductBundleWithRelations[]
  onEdit: (bundle: ProductBundleWithRelations) => void
  onDelete: (bundle: ProductBundleWithRelations) => void
  onView: (bundle: ProductBundleWithRelations) => void
  onToggleStatus: (bundleId: string, isActive: boolean) => void
  onToggleFeatured: (bundleId: string, isFeatured: boolean) => void
  onToggleShowToCustomer: (bundleId: string, showToCustomer: boolean) => void
}

export function BundleList({ 
  bundles,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  onToggleFeatured,
  onToggleShowToCustomer
}: BundleListTableProps) {
  if (bundles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Tidak ada bundle yang ditemukan
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bundle</TableHead>
            <TableHead className="text-center">Items</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead>Toko</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bundles.map((bundle) => (
            <TableRow key={bundle.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img
                      className="h-10 w-10 rounded-lg object-cover"
                      src={bundle.image || '/images/products/placeholder.jpg'}
                      alt={bundle.name}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{bundle.name}</div>
                    {bundle.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {bundle.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div 
                  className="flex items-center justify-center gap-2 cursor-help" 
                  title={`Bundle ini berisi ${bundle.contents?.length || 0} produk`}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-sm">
                    {bundle.contents?.length || 0}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  Rp {bundle.price.toLocaleString('id-ID')}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {bundle.store.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {bundle.store.city || 'Lokasi tidak tersedia'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {/* Primary Status */}
                  <Badge 
                    variant={bundle.isActive ? 'default' : 'secondary'}
                    className={`text-xs w-fit ${bundle.isActive ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}
                  >
                    {bundle.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  
                  {/* Secondary Status Badges */}
                  <div className="flex gap-1 flex-wrap">
                    {bundle.isFeatured && (
                      <Badge 
                        variant="outline"
                        className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
                        title="Bundle ini ditampilkan sebagai featured"
                      >
                        ⭐ Featured
                      </Badge>
                    )}
                    {bundle.showToCustomer ? (
                      <Badge 
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                        title="Bundle ini terlihat oleh customer"
                      >
                        👁️ Visible
                      </Badge>
                    ) : (
                      <Badge 
                        variant="outline"
                        className="text-xs bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                        title="Bundle ini disembunyikan dari customer"
                      >
                        🙈 Hidden
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(bundle)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Lihat Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(bundle)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(bundle.id, !bundle.isActive)}
                    >
                      {bundle.isActive ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Nonaktifkan
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Aktifkan
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleFeatured(bundle.id, !bundle.isFeatured)}
                    >
                      {bundle.isFeatured ? (
                        <>
                          <StarOff className="h-4 w-4 mr-2" />
                          Hapus dari Featured
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          Jadikan Featured
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleShowToCustomer(bundle.id, !bundle.showToCustomer)}
                    >
                      {bundle.showToCustomer ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Sembunyikan dari Customer
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          Tampilkan ke Customer
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(bundle)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
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
  )
}
