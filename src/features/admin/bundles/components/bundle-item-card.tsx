'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Trash2, Package } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { BundleContentItem, BundleContentItemWithId } from '../types/bundle.types'

interface BundleItemCardProps {
  item: BundleContentItemWithId
  index: number
  onUpdate: (field: keyof BundleContentItem, value: any) => void
  onRemove: () => void
  errors?: {
    name?: string
    quantity?: string
  }
  isDragging?: boolean
}

export function BundleItemCard({
  item,
  index,
  onUpdate,
  onRemove,
  errors,
  isDragging = false
}: BundleItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md',
        isSortableDragging && 'shadow-lg ring-2 ring-primary ring-opacity-50',
        'border-l-4 border-l-blue-500'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div 
              {...attributes}
              {...listeners}
              className="flex-shrink-0 mt-1 p-1 rounded cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <Badge variant="outline" className="text-xs">
                    Item {index + 1}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Nama Item <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={item.name || ''}
                    onChange={(e) => onUpdate('name', e.target.value)}
                    placeholder="Nama produk"
                    className={cn(
                      'transition-colors',
                      errors?.name && 'border-red-500 focus:border-red-500'
                    )}
                  />
                  {errors?.name && (
                    <p className="text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Kuantitas <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity || 1}
                    onChange={(e) => onUpdate('quantity', parseInt(e.target.value) || 1)}
                    placeholder="1"
                    className={cn(
                      'transition-colors',
                      errors?.quantity && 'border-red-500 focus:border-red-500'
                    )}
                  />
                  {errors?.quantity && (
                    <p className="text-xs text-red-600">{errors.quantity}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
