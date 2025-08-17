'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Eye, Power, PowerOff, Star, StarOff, Users, UserX, EyeOff, Check, X, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { ProductBundleWithRelations } from '../types/bundle.types'
import Image from 'next/image'

interface BundleMobileCardProps {
  bundle: ProductBundleWithRelations
  onView: (bundleId: string) => void
  onEdit: (bundleId: string) => void
  onDelete: (bundleId: string) => void
  onToggleStatus: (bundleId: string, isActive: boolean) => void
  onToggleFeatured: (bundleId: string, isFeatured: boolean) => void
  onToggleShowToCustomer: (bundleId: string, showToCustomer: boolean) => void
}

const getStatusIcon = (bundle: ProductBundleWithRelations) => {
  if (!bundle.isActive) return <PowerOff className="h-3 w-3" />
  if (!bundle.showToCustomer) return <EyeOff className="h-3 w-3" />
  if (!bundle.isFeatured) return <StarOff className="h-3 w-3" />
  return <Check className="h-3 w-3" />
}

const getStatusColor = (bundle: ProductBundleWithRelations) => {
  if (!bundle.isActive) return 'bg-gray-500/80'
  if (!bundle.showToCustomer) return 'bg-orange-500/80'
  if (!bundle.isFeatured) return 'bg-blue-500/80'
  return 'bg-green-500/80'
}

const getStatusText = (bundle: ProductBundleWithRelations) => {
  if (!bundle.isActive) return 'Inactive'
  if (!bundle.showToCustomer) return 'Private'
  if (!bundle.isFeatured) return 'Not Featured'
  return 'Active'
}

export function BundleMobileCard({ 
  bundle, 
  onEdit, 
  onDelete, 
  onView, 
  onToggleStatus, 
  onToggleFeatured,
  onToggleShowToCustomer 
}: BundleMobileCardProps) {
  const profit = bundle.sellingPrice - bundle.costPrice
  const profitMargin = bundle.costPrice > 0 ? ((profit / bundle.costPrice) * 100) : 0

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border">
      <div className="relative">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          {bundle.image ? (
            <Image
              src={bundle.image}
              alt={bundle.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(bundle)} text-white border-0 text-xs font-medium`}
            >
              {getStatusIcon(bundle)}
              <span className="ml-1">{getStatusText(bundle)}</span>
            </Badge>
          </div>

          {/* Dropdown Menu */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView(bundle.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(bundle.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Bundle
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleStatus(bundle.id, !bundle.isActive)}>
                  {bundle.isActive ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleShowToCustomer(bundle.id, !bundle.showToCustomer)}>
                  {bundle.showToCustomer ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Make Public
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFeatured(bundle.id, !bundle.isFeatured)}>
                  {bundle.isFeatured ? (
                    <>
                      <StarOff className="mr-2 h-4 w-4" />
                      Remove Featured
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Make Featured
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(bundle.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Bundle
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Bundle Name */}
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 min-h-[2.5rem]">
              {bundle.name}
            </h3>
            
            {/* Bundle Description */}
            {bundle.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                {bundle.description}
              </p>
            )}

            {/* Bundle Items Count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{bundle.contents?.length || 0} produk dalam bundle</span>
            </div>

            {/* Pricing Information */}
            <div className="space-y-2">
              {/* Selling Price */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Harga Jual:</span>
                <span className="font-semibold text-lg">
                  {formatPrice(bundle.sellingPrice)}
                </span>
              </div>
              
              {/* Cost Price */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Modal:</span>
                <span className="text-muted-foreground">
                  {formatPrice(bundle.costPrice)}
                </span>
              </div>
              
              {/* Profit */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Profit:</span>
                <span className={`font-medium ${profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatPrice(profit)} ({profitMargin.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer Actions */}
        <CardFooter className="p-4 pt-0">
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onView(bundle.id)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onEdit(bundle.id)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  )
}
