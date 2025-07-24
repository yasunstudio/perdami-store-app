'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BundleItemCard } from './bundle-item-card'
import { ShoppingCart, Plus, Package, Settings } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import type { BundleContentItem, BundleContentItemWithId } from '../types/bundle.types'

interface BundleItemsManagerProps {
  items: BundleContentItemWithId[]
  onItemsChange: (items: BundleContentItemWithId[]) => void
  errors?: Record<string, string>
  className?: string
}

export function BundleItemsManager({
  items,
  onItemsChange,
  errors = {},
  className
}: BundleItemsManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragOverlayItem, setDragOverlayItem] = useState<BundleContentItemWithId | null>(null)

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  )

  const addItem = () => {
    console.log('FAB clicked - Adding new item') // Debug log
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      quantity: 1
    }
    onItemsChange([...items, newItem])
  }

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    onItemsChange(updatedItems)
  }

  const updateItem = (index: number, field: keyof BundleContentItem, value: any) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onItemsChange(updatedItems)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    // Find the item being dragged for overlay
    const draggedItem = items.find(item => item.id === active.id)
    setDragOverlayItem(draggedItem || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      
      const reorderedItems = arrayMove(items, oldIndex, newIndex)
      onItemsChange(reorderedItems)
    }

    setActiveId(null)
    setDragOverlayItem(null)
  }

  const getItemErrors = (index: number) => {
    return {
      name: errors[`contents.${index}.name`],
      quantity: errors[`contents.${index}.quantity`]
    }
  }

  const hasGeneralError = errors.contents

  return (
    <div className={cn('relative w-full', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle>Isi Paket</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
          </div>
          
          {/* Instructions */}
          <p className="text-sm text-muted-foreground">
            {items.length === 0 
              ? 'Tambahkan item pertama untuk memulai membuat paket produk'
              : 'Drag item untuk mengubah urutan, atau gunakan tombol + untuk menambah item baru'
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {items.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Belum ada item dalam paket
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                Mulai tambahkan item pertama untuk membuat paket produk yang menarik
              </p>
              <Button 
                onClick={addItem} 
                variant="outline"
                className="mx-auto border-dashed border-2 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 group"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Tambah Item Pertama
              </Button>
            </div>
          ) : (
            // Items List with Drag & Drop
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <BundleItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      onUpdate={(field, value) => updateItem(index, field, value)}
                      onRemove={() => removeItem(index)}
                      errors={getItemErrors(index)}
                      isDragging={activeId === item.id}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Drag Overlay */}
              <DragOverlay>
                {dragOverlayItem && (
                  <div className="opacity-90 transform rotate-3 scale-105">
                    <BundleItemCard
                      item={dragOverlayItem}
                      index={items.findIndex(item => item.id === dragOverlayItem.id)}
                      onUpdate={() => {}}
                      onRemove={() => {}}
                      isDragging={true}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}

          {/* Add Item Button - Always at bottom of card */}
          {items.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button 
                type="button" 
                onClick={addItem}
                variant="outline"
                className="w-full py-3 border-dashed border-2 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 group"
              >
                <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Tambah Item Baru
              </Button>
            </div>
          )}

          {/* General Error */}
          {hasGeneralError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{hasGeneralError}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
