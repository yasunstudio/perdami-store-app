'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Package,
  FolderOpen,
  ShoppingCart,
  Store,
  Calendar
} from 'lucide-react'
import type { StoreWithRelations } from '../types/store.types'

interface StoreMobileCardProps {
  store: StoreWithRelations
  onEdit: (store: StoreWithRelations) => void
  onDelete: (store: StoreWithRelations) => void
  onToggleStatus: (storeId: string, isActive: boolean) => void
}

export function StoreMobileCard({
  store,
  onEdit,
  onDelete,
  onToggleStatus
}: StoreMobileCardProps) {
  return (
    <Card className="w-full hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white dark:bg-gray-800">
      {/* Store Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-50 dark:bg-gray-700">
        {store.image ? (
          <img 
            src={store.image} 
            alt={store.name}
            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700">
            <Store className="h-16 w-16 text-gray-400 dark:text-gray-300" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge 
            variant={store.isActive ? 'default' : 'secondary'}
            className={`border-0 shadow-sm ${
              store.isActive 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-500 text-white'
            }`}
          >
            {store.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>
        
        {/* Actions Dropdown - positioned at bottom right */}
        <div className="absolute bottom-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 shadow-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(store)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(store)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Store Title */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-1 mb-1">{store.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {store.description || 'Tidak ada deskripsi'}
          </p>
          {/* Location Info */}
          {(store.city || store.address) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              📍 {store.city && store.province ? `${store.city}, ${store.province}` : ''}
              {store.address && (
                <div className="line-clamp-1">{store.address}</div>
              )}
            </div>
          )}
        </div>
        
        {/* Store Statistics */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <Package className="h-3 w-3 mr-1" />
            {store.bundleCount || store._count?.bundles || 0} bundle
          </Badge>
        </div>
        
        {/* Metadata */}
        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Dibuat: {new Date(store.createdAt).toLocaleDateString('id-ID')}
          </div>
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Diperbarui: {new Date(store.updatedAt).toLocaleDateString('id-ID')}
          </div>
        </div>
        
        {/* Status Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </span>
          <Switch
            checked={store.isActive}
            onCheckedChange={(checked) => onToggleStatus(store.id, checked)}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </CardContent>
    </Card>
  )
}
