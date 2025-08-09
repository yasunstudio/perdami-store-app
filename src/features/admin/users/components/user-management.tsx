'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPageLayout, StatsCard, FilterBar, EmptyState } from '@/components/admin/admin-page-layout'
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
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Crown,
  RefreshCw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface UserStats {
  totalUsers: number
  totalAdmins: number
  totalCustomers: number
  newUsersThisMonth: number
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
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalCustomers: 0,
    newUsersThisMonth: 0
  })
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
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats')
      if (!response.ok) {
        // Fallback to regular users stats if admin stats not available
        const fallbackResponse = await fetch('/api/users/stats')
        if (!fallbackResponse.ok) throw new Error('Failed to fetch stats')
        const data = await fallbackResponse.json()
        setStats(data)
        return
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Gagal memuat statistik user')
    }
  }

  // Fetch users with filters
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
    fetchStats()
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
    fetchStats()
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

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={loading}
        className="h-8"
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      <Button size="sm" onClick={handleCreateUser} className="h-8">
        <UserPlus className="h-4 w-4 mr-1" />
        Tambah User
      </Button>
    </div>
  )

  return (
    <AdminPageLayout 
      title="Manajemen User" 
      description="Kelola akun admin dan customer Perdami Store"
      actions={actions}
      loading={loading}
      onRefresh={handleRefresh}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total User"
          value={stats.totalUsers.toLocaleString()}
          description="Pengguna terdaftar"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Admin"
          value={stats.totalAdmins.toString()}
          description="Administrator"
          icon={<Shield className="h-4 w-4" />}
        />
        <StatsCard
          title="Customer"
          value={stats.totalCustomers.toLocaleString()}
          description="Pelanggan"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="User Baru Bulan Ini"
          value={stats.newUsersThisMonth.toString()}
          description="Pendaftar baru"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Filters */}
      <FilterBar>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari user..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={filters.role} onValueChange={(value) => updateFilters({ role: value })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Terverifikasi</SelectItem>
            <SelectItem value="inactive">Belum Verifikasi</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-1" />
          Filter
        </Button>
      </FilterBar>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* User List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Daftar User ({pagination.total} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 && !loading ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Belum ada user"
              description="Mulai dengan menambahkan user pertama"
              action={
                <Button onClick={handleCreateUser}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Tambah User
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <div key={user.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>
                        {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name || 'Nama tidak tersedia'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bergabung {new Date(user.createdAt).toLocaleDateString('id-ID')} • 
                        Diupdate {new Date(user.updatedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-end space-y-1">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.emailVerified)}
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
                        <DropdownMenuItem onClick={() => handleDeleteUser(user)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} user
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ page: pagination.page - 1 })}
                    disabled={pagination.page <= 1 || loading}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Halaman {pagination.page} dari {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages || loading}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  )
}