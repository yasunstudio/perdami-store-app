'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Bank } from '@prisma/client'

interface BankMobileCardProps {
  bank: Bank
  onEdit: (bank: Bank) => void
  onDelete: (bank: Bank) => void
  onToggleVisibility: (bank: Bank) => void
}

export function BankMobileCard({
  bank,
  onEdit,
  onDelete,
  onToggleVisibility,
}: BankMobileCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{bank.name}</CardTitle>
          <div className="flex items-center space-x-2">
            {bank.logo && (
              <img
                src={bank.logo}
                alt={bank.name}
                className="w-8 h-8 object-contain"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Kode:</span> {bank.code}
          </div>
          <div>
            <span className="font-medium">Status:</span>{' '}
            <span className={bank.isActive ? 'text-green-600' : 'text-red-600'}>
              {bank.isActive ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
          {bank.accountNumber && (
            <div>
              <span className="font-medium">No. Rekening:</span> {bank.accountNumber}
            </div>
          )}
          {bank.accountName && (
            <div>
              <span className="font-medium">Nama Rekening:</span> {bank.accountName}
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(bank)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleVisibility(bank)}
          >
            {bank.isActive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(bank)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
