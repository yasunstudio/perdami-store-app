'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  ArrowUpDown,
  CreditCard,
  Building2
} from 'lucide-react'
import type { BankWithRelations } from '../types/bank.types'

interface BankListProps {
  banks: BankWithRelations[]
  onEdit: (bankId: string) => void
  onDelete: (bankId: string) => void
  onSort: (sortBy: string) => void
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function BankList({ 
  banks, 
  onEdit, 
  onDelete, 
  onSort, 
  sortBy, 
  sortOrder 
}: BankListProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />
    return (
      <ArrowUpDown 
        className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} 
      />
    )
  }

  if (banks.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Belum ada bank
        </h3>
        <p className="text-sm text-muted-foreground">
          Tambahkan bank pertama untuk mulai menerima pembayaran transfer
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Logo</TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => onSort('name')}
                className="h-auto p-0 font-medium"
              >
                Nama Bank
                {getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => onSort('code')}
                className="h-auto p-0 font-medium"
              >
                Kode
                {getSortIcon('code')}
              </Button>
            </TableHead>
            <TableHead>Rekening</TableHead>
            <TableHead>Nama Rekening</TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => onSort('orders')}
                className="h-auto p-0 font-medium"
              >
                Transaksi
                {getSortIcon('orders')}
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                onClick={() => onSort('createdAt')}
                className="h-auto p-0 font-medium"
              >
                Dibuat
                {getSortIcon('createdAt')}
              </Button>
            </TableHead>
            <TableHead className="w-[70px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banks.map((bank) => (
            <TableRow key={bank.id}>
              <TableCell>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {bank.logo ? (
                    <Image
                      src={bank.logo}
                      alt={bank.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{bank.name}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono">
                  {bank.code}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm">
                  {bank.accountNumber}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {bank.accountName}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-center">
                  <span className="font-medium">{bank._count.orders}</span>
                  <div className="text-xs text-muted-foreground">transaksi</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={bank.isActive ? 'default' : 'secondary'}
                  className={bank.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                >
                  {bank.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {formatDate(bank.createdAt)}
                </div>
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}