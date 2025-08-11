'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

interface UserListProps {
  users: User[]
  onEdit?: (userId: string) => void
  onDelete?: (user: User) => void
  loading?: boolean
}

export function UserList({
  users,
  onEdit,
  onDelete,
  loading = false
}: UserListProps) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)

  const handleEdit = (userId: string) => {
    if (onEdit) {
      onEdit(userId)
    }
  }

  const handleDelete = (user: User) => {
    if (onDelete) {
      onDelete(user)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (!users?.length && !loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👥</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Belum ada user
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Belum ada user yang terdaftar. Tambahkan user pertama untuk memulai.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Memuat data user...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead className="w-[70px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image || undefined} alt={user.name} />
                      <AvatarFallback>
                        {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.name || 'Nama tidak tersedia'}</span>
                        {user.role === 'ADMIN' && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                    className={user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}
                  >
                    {user.role === 'ADMIN' ? 'Admin' : 'Customer'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.emailVerified ? 'default' : 'destructive'}
                    className={user.emailVerified ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                  >
                    {user.emailVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        disabled={loadingUserId === user.id}
                      >
                        <span className="sr-only">Buka menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(user)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
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
    </div>
  )
}
