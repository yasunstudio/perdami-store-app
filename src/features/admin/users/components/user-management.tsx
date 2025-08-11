'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Crown,
  RefreshCw,
  List,
  Grid3X3
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserList } from './user-list-table'

import { toast } from 'sonner'

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

interface UserFilters {
  search: string
  role: string
  status: string
  page: number
  limit: number
}

export function UserManagement() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [error, setError] = useState<string | null>(null)





  // Fetch user statistics
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString()
      })
      
      if (filters.search) params.append('search', filters.search)
      if (filters.role !== 'all') {
        params.append('role', filters.role === 'USER' ? 'CUSTOMER' : filters.role)
      }
      if (filters.status !== 'all') {
        params.append('verified', filters.status === 'active' ? 'true' : 'false')
      }
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      console.log('Admin Users API response:', data) // Debug log
      
      // Handle the response format from our admin API
      if (data.success) {
        setUsers(data.data || [])
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 })
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Gagal memuat data user')
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Refetch users when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers()
    }, 300) // Debounce search
    
    return () => clearTimeout(timeoutId)
  }, [filters.search, filters.role, filters.status, filters.page])

  const handleRefresh = () => {
    fetchUsers()
  }

  const handleCreateUser = () => {
    router.push('/admin/users/new')
  }

  const handleEditUser = (userId: string) => {
    router.push(`/admin/users/${userId}/edit`)
  }

  const handleDeleteUser = (user: User) => {
    // TODO: Implement delete functionality
    console.log('Delete user:', user.id)
  }

  const updateFilters = (newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      ADMIN: 'destructive',
      CUSTOMER: 'secondary',
      USER: 'secondary'
    }
    const variant = (variants[role] || 'secondary') as 'default' | 'destructive' | 'secondary' | 'outline'
    return (
      <Badge variant={variant}>
        {role === 'ADMIN' && <Crown className="h-3 w-3 mr-1" />}
        {role === 'CUSTOMER' ? 'Customer' : role}
      </Badge>
    )
  }

  const getStatusBadge = (emailVerified: Date | null) => {
    const isVerified = emailVerified !== null
    return (
      <Badge variant={isVerified ? 'default' : 'outline'}>
        {isVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
      </Badge>
    )
  }

  const actions = null

  return (
    <AdminPageLayout 
      title="Manajemen User" 
      description="Kelola akun admin dan customer Perdami Store"
      actions={actions}
      loading={loading}
    >
      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Filter & Tampilan</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Memuat...' : 'Refresh'}
              </Button>
              <Button onClick={handleCreateUser} size="sm" className="h-8">
                <UserPlus className="h-4 w-4 mr-1" />
                Tambah User
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari user..."
                value={filters.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <Select
              value={filters.role || 'all'}
              onValueChange={(value) => updateFilters({ role: value })}
            >
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => updateFilters({ status: value })}
            >
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Terverifikasi</SelectItem>
                <SelectItem value="inactive">Belum Verifikasi</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-md p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Users List/Grid */}
          <div className="min-h-[400px]">
            {viewMode === 'grid' ? (
              users.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Belum ada user</h3>
                  <p className="text-muted-foreground mb-4">Mulai dengan menambahkan user pertama</p>
                  <Button onClick={handleCreateUser}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Tambah User
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>
                            {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-sm truncate">{user.name}</p>
                              {user.role === 'ADMIN' && (
                                <Crown className="h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                            {user.role}
                          </Badge>
                          <Badge variant={user.emailVerified ? 'default' : 'destructive'} className="text-xs">
                            {user.emailVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <UserList
                users={users}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                loading={loading}
              />
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} user
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ page: pagination.page - 1 })}
                  disabled={pagination.page <= 1}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  )
}