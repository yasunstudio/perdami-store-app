'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Building2,
  CreditCard,
  Calendar,
  TrendingUp
} from 'lucide-react'
import type { BankWithRelations } from '../types/bank.types'

interface BankMobileCardProps {
  bank: BankWithRelations
  onEdit: (bankId: string) => void
  onDelete: (bankId: string) => void
}

export function BankMobileCard({ bank, onEdit, onDelete }: BankMobileCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {bank.logo ? (
              <Image
                src={bank.logo}
                alt={bank.name}
                width={48}
                height={48}
                className="object-cover"
              />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{bank.name}</h3>
            <Badge variant="outline" className="font-mono text-xs mt-1">
              {bank.code}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(bank.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(bank.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Account Information */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4 mr-2" />
            <span>Rekening</span>
          </div>
          <div className="pl-6">
            <div className="font-mono text-sm font-medium">
              {bank.accountNumber}
            </div>
            <div className="text-sm text-muted-foreground">
              a.n. {bank.accountName}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span>{bank._count.orders} transaksi</span>
          </div>
          
          <Badge 
            variant={bank.isActive ? 'default' : 'secondary'}
            className={bank.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
          >
            {bank.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>

        {/* Created Date */}
        <div className="flex items-center text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3 mr-2" />
          <span>Dibuat {formatDate(bank.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}