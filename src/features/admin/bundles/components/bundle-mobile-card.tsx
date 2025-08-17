'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Eye, Power, PowerOff, Star, StarOff, Users, UserX, EyeOff, Check, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { ProductBundleWithRelations } from '../types/bundle.types'

// Helper function to format date
const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface BundleMobileCardProps {
  bundle: ProductBundleWithRelations
  onView: (bundle: ProductBundleWithRelations) => void
  onEdit: (bundle: ProductBundleWithRelations) => void
  onDelete: (bundleId: string) => void
  onToggleStatus: (bundleId: string, isActive: boolean) => void
  onToggleFeatured: (bundleId: string, isFeatured: boolean) => void
  onToggleShowToCustomer: (bundleId: string, showToCustomer: boolean) => void
}

export function BundleMobileCard({
  bundle,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  onToggleShowToCustomer,
}: BundleMobileCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{bundle.name}</CardTitle>
          <div className="flex items-center space-x-2">
            {bundle.image && (
              <img
                src={bundle.image}
                alt={bundle.name}
                className="h-10 w-10 rounded object-cover"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Bundle Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Harga Jual</p>
              <p className="font-medium text-green-600">{formatPrice(bundle.sellingPrice)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Harga Modal</p>
              <p className="font-medium text-orange-600">{formatPrice(bundle.costPrice)}</p>
            </div>
          </div>

          {/* Profit Info */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Profit</p>
              <p className="font-medium text-blue-600">
                {formatPrice(bundle.sellingPrice - bundle.costPrice)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Margin</p>
              <p className="font-medium text-purple-600">
                {bundle.costPrice > 0 ? 
                  `${(((bundle.sellingPrice - bundle.costPrice) / bundle.costPrice) * 100).toFixed(1)}%` 
                  : '0%'
                }
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Items</p>
              <p className="font-medium">{bundle.contents?.length || 0}</p>
            </div>
          </div>

          {/* Store and Date */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Toko</p>
              <p className="font-medium">{bundle.store?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Terakhir Update</p>
              <p className="font-medium text-xs">{formatDate(bundle.updatedAt)}</p>
            </div>
          </div>

          {/* Description */}
          {bundle.description && (
            <div>
              <p className="text-sm text-muted-foreground">Deskripsi</p>
              <p className="text-sm">{bundle.description}</p>
            </div>
          )}

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {/* Active/Inactive Status */}
            <Badge 
              variant={bundle.isActive ? 'default' : 'secondary'}
              className={`gap-1 ${bundle.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
            >
              {bundle.isActive ? (
                <>
                  <Check className="h-3 w-3" />
                  Aktif
                </>
              ) : (
                <>
                  <X className="h-3 w-3" />
                  Tidak Aktif
                </>
              )}
            </Badge>
            
            {/* Customer Visibility Status */}
            <Badge 
              variant="outline" 
              className={`gap-1 ${bundle.showToCustomer ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
            >
              {bundle.showToCustomer ? (
                <>
                  <Eye className="h-3 w-3" />
                  Publik
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3" />
                  Tersembunyi
                </>
              )}
            </Badge>
            
            {/* Featured Status */}
            {bundle.isFeatured && (
              <Badge variant="outline" className="gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                <Star className="h-3 w-3" />
                Unggulan
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                  onClick={() => onDelete(bundle.id)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
