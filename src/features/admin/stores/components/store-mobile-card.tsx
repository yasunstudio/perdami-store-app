'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Store } from '@prisma/client'

interface StoreMobileCardProps {
  store: Store
  onEdit: (store: Store) => void
  onDelete: (store: Store) => void
  onToggleVisibility: (store: Store) => void
}

export function StoreMobileCard({
  store,
  onEdit,
  onDelete,
  onToggleVisibility,
}: StoreMobileCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{store.name}</CardTitle>
          <div className="flex items-center space-x-2">
            {store.image && (
              <img
                src={store.image}
                alt={store.name}
                className="w-8 h-8 object-contain rounded"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Status:</span>{' '}
            <span className={store.isActive ? 'text-green-600' : 'text-red-600'}>
              {store.isActive ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
          {store.description && (
            <div>
              <span className="font-medium">Deskripsi:</span> {store.description}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(store)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleVisibility(store)}
          >
            {store.isActive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(store)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
