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
import { formatPrice } from '@/lib/utils'
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
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[500px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Bundle</TableHead>
                <TableHead className="w-[70px] text-center">Items</TableHead>
                <TableHead className="w-[100px]">Harga</TableHead>
                <TableHead className="w-[110px]">Toko</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[60px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
        <TableBody>
          {bundles.map((bundle) => (
            <TableRow key={bundle.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 h-6 w-6">
                    <img
                      className="h-6 w-6 rounded object-cover"
                      src={bundle.image || '/images/products/placeholder.jpg'}
                      alt={bundle.name}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs truncate" title={bundle.name}>
                      {bundle.name}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium text-xs" title={`Bundle ini berisi ${bundle.contents?.length || 0} produk`}>
                  {bundle.contents?.length || 0}
                </span>
              </TableCell>
              <TableCell>
                <div className="font-medium text-xs">
                  {formatPrice(bundle.price)}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-xs truncate" title={bundle.store.name}>
                  {bundle.store.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge 
                    variant={bundle.isActive ? 'default' : 'secondary'}
                    className={`text-xs px-1 py-0.5 w-fit ${bundle.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {bundle.isActive ? 'Aktif' : 'Tidak'}
                  </Badge>
                  {(bundle.isFeatured || !bundle.showToCustomer) && (
                    <div className="flex gap-1 text-xs">
                      {bundle.isFeatured && <span title="Featured">⭐</span>}
                      {!bundle.showToCustomer && <span title="Hidden">�</span>}
                    </div>
                  )}
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
      </div>
    </div>
  )
}
