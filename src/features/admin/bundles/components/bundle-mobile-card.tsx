'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { ProductBundle } from '@prisma/client'

interface BundleMobileCardProps {
  bundle: ProductBundle
  onEdit: (bundle: ProductBundle) => void
  onDelete: (bundle: ProductBundle) => void
  onToggleVisibility: (bundle: ProductBundle) => void
}

export function BundleMobileCard({
  bundle,
  onEdit,
  onDelete,
  onToggleVisibility,
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
                className="w-8 h-8 object-contain rounded"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Harga:</span> Rp {bundle.price.toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Status:</span>{' '}
            <span className={bundle.isActive ? 'text-green-600' : 'text-red-600'}>
              {bundle.isActive ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
          {bundle.description && (
            <div>
              <span className="font-medium">Deskripsi:</span> {bundle.description}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(bundle)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleVisibility(bundle)}
          >
            {bundle.isActive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(bundle)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
