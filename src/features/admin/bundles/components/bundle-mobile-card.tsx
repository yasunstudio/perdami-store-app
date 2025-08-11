'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Eye, Edit, MoreVertical, Power, PowerOff, Star, StarOff, Trash2, Users, UserX } from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { formatPrice } from '@/lib/utils'
import type { ProductBundle } from '../types/bundle.types'

interface BundleMobileCardProps {
  bundle: ProductBundle
  onView?: (bundle: ProductBundle) => void
  onEdit?: (bundle: ProductBundle) => void
  onDelete?: (bundleId: string) => void
  onToggleStatus?: (bundleId: string, isActive: boolean) => void
  onToggleFeatured?: (bundleId: string, isFeatured: boolean) => void
  onToggleShowToCustomer?: (bundleId: string, showToCustomer: boolean) => void
}

export function BundleMobileCard({ 
  bundle,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  onToggleShowToCustomer
}: BundleMobileCardProps) {
  const formatContents = (contents: any): { name: string; quantity: number }[] => {
    if (!contents) return []
    
    // If contents is already an array of objects with name and quantity
    if (Array.isArray(contents)) {
      return contents.map(item => ({
        name: typeof item === 'string' ? item : (item.name || item.title || 'Unknown item'),
        quantity: typeof item === 'object' && item.quantity ? item.quantity : 1
      }))
    }
    
    // If contents is a string, try to parse it
    if (typeof contents === 'string') {
      try {
        const parsed = JSON.parse(contents)
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            name: typeof item === 'string' ? item : (item.name || item.title || 'Unknown item'),
            quantity: typeof item === 'object' && item.quantity ? item.quantity : 1
          }))
        }
      } catch {
        // If parsing fails, treat as single item
        return [{ name: contents, quantity: 1 }]
      }
    }
    
    return []
  }

  const contentItems = formatContents(bundle.contents)

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Image Container with Professional Aspect Ratio */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {bundle.image ? (
          <img 
            src={bundle.image} 
            alt={bundle.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <ShoppingBag className="h-16 w-16 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        
        {/* Status Badge - Positioned on top-left */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant={bundle.isActive ? "default" : "secondary"}
            className={`text-xs font-medium ${
              bundle.isActive 
                ? "bg-green-500 hover:bg-green-600 text-white" 
                : "bg-gray-500 hover:bg-gray-600 text-white"
            }`}
          >
            {bundle.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>

        {/* Featured Badge - Positioned on top-right if no action menu */}
        {bundle.isFeatured && (
          <div className="absolute top-3 right-14">
            <Badge 
              variant="secondary"
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium"
            >
              Featured
            </Badge>
          </div>
        )}
        
        {/* Action Menu - Professional floating button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView?.(bundle)}>
                <Eye className="h-4 w-4 mr-2" />
                Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(bundle)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus?.(bundle.id, !bundle.isActive)}>
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
              <DropdownMenuItem onClick={() => onToggleFeatured?.(bundle.id, !bundle.isFeatured)}>
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
              <DropdownMenuItem onClick={() => onToggleShowToCustomer?.(bundle.id, !bundle.showToCustomer)}>
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
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => onDelete?.(bundle.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Bundle Title & Description */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-1 mb-1">
            {bundle.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {bundle.description || 'Tidak ada deskripsi'}
          </p>
        </div>
        
        {/* Price - Highlighted */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(bundle.price)}
          </div>
        </div>
        
        {/* Bundle Statistics */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800">
            <ShoppingBag className="h-3 w-3 mr-1" />
            {contentItems.length} item
          </Badge>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800">
            {bundle._count?.orderItems || 0} terjual
          </Badge>
        </div>
        
        {/* Store Information */}
        {bundle.store && (
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {bundle.store.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              📍 Venue PIT PERDAMI 2025
            </p>
          </div>
        )}
        
        {/* Bundle Contents */}
        {contentItems.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Isi Paket:
            </div>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {contentItems.slice(0, 3).map((item, index) => (
                <div 
                  key={index}
                  className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-between"
                >
                  <span className="truncate flex-1 mr-2" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs flex-shrink-0">
                    {item.quantity}x
                  </span>
                </div>
              ))}
              {contentItems.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                  +{contentItems.length - 3} item lainnya
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
