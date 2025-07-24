'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  User as UserType, 
  UserListResponse, 
  UserFilters,
  getUserRoleColor, 
  getUserRoleText,
  getVerificationStatus,
  getVerificationColor,
  formatUserDate
} from '../types/user.types'
import { CreateUserForm } from './create-user-form'
import { EditUserForm } from './edit-user-form'
import { UserDetailView } from './user-detail-view'
import { Search, Users, Shield, Eye, Edit, Trash2, User } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import Image from 'next/image'

interface UserListProps {
  onUserSelect?: (user: UserType) => void
  onBulkSelect?: (userIds: string[]) => void
  selectedUsers?: string[]
  refreshTrigger?: number
}

export function UserList({ onUserSelect, onBulkSelect, selectedUsers = [], refreshTrigger }: UserListProps) {
  const [data, setData] = useState<UserListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<UserFilters>({
    role: 'ALL',
    search: '',
    verified: undefined
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [editUser, setEditUser] = useState<UserType | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDetailView, setShowDetailView] = useState(false)

  const fetchUsers = useCallback(async (page = 1, newFilters = filters) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })

      if (newFilters.role && newFilters.role !== 'ALL') {
        params.append('role', newFilters.role)
      }
      if (newFilters.search) {
        params.append('search', newFilters.search)
      }
      if (newFilters.verified !== undefined) {
        params.append('verified', newFilters.verified.toString())
      }

      const response = await fetch(`/api/users?${params}`)
      const result = await response.json()
      setData(result)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Gagal memuat data user')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchUsers()
  }, [refreshTrigger, fetchUsers])

  const handleFilterChange = (key: keyof UserFilters, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchUsers(1, newFilters)
  }

  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm)
  }

  const handleRoleUpdate = async (userId: string, newRole: 'ADMIN' | 'CUSTOMER') => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      })

      if (response.ok) {
        toast.success('Role user berhasil diupdate!')
        fetchUsers(currentPage)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal mengupdate role user')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Terjadi kesalahan saat mengupdate role')
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmMessage = `Apakah Anda yakin ingin menghapus user "${userName}"? Aksi ini tidak dapat dibatalkan.`
    
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('User berhasil dihapus!')
        fetchUsers(currentPage)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Gagal menghapus user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Terjadi kesalahan saat menghapus user')
    }
  }

  const handleViewUser = (user: UserType) => {
    setSelectedUser(user)
    setShowDetailView(true)
    onUserSelect?.(user)
  }

  const handleEditUser = (user: UserType) => {
    setEditUser(user)
    setShowEditForm(true)
  }

  const handleUserCreated = () => {
    fetchUsers(currentPage)
  }

  const handleUserUpdated = () => {
    fetchUsers(currentPage)
  }

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      const allUserIds = data.users.map(user => user.id)
      onBulkSelect?.(allUserIds)
    } else {
      onBulkSelect?.([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      onBulkSelect?.([...selectedUsers, userId])
    } else {
      onBulkSelect?.(selectedUsers.filter(id => id !== userId))
    }
  }

  const isUserSelected = (userId: string) => selectedUsers.includes(userId)
  const isAllSelected = data ? data.users.length > 0 && data.users.every(user => isUserSelected(user.id)) : false
  const isIndeterminate = data ? selectedUsers.length > 0 && selectedUsers.length < data.users.length : false

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 sm:p-6">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Daftar Pengguna</span>
              {selectedUsers.length > 0 && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                  {selectedUsers.length} dipilih
                </Badge>
              )}
            </CardTitle>
            {data && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Menampilkan {data.users.length} dari {data.pagination.total} pengguna
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <CreateUserForm onUserCreated={handleUserCreated} />
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Checkbox dan Search di baris pertama */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 flex-shrink-0">
                <Checkbox
                  checked={isAllSelected || isIndeterminate}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all users"
                  className="data-[state=indeterminate]:bg-primary/50"
                />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Pilih semua
                </span>
              </div>
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau email..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            
            {/* Filter dropdowns di baris kedua */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                value={filters.role || 'ALL'}
                onValueChange={(value) => handleFilterChange('role', value)}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Filter Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Role</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.verified === undefined ? 'ALL' : filters.verified.toString()}
                onValueChange={(value) => 
                  handleFilterChange('verified', value === 'ALL' ? undefined : value === 'true')
                }
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Status Verifikasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="true">Terverifikasi</SelectItem>
                  <SelectItem value="false">Belum Verifikasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User List */}
          {!data || data.users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Tidak ada pengguna ditemukan</p>
              <p className="text-sm text-muted-foreground">
                {filters.search || filters.role !== 'ALL' || filters.verified !== undefined
                  ? 'Coba ubah filter pencarian Anda'
                  : 'Pengguna akan muncul di sini setelah registrasi'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.users.map((user) => (
                <div 
                  key={user.id} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-all space-y-3 sm:space-y-0 ${
                    isUserSelected(user.id) ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <Checkbox
                      checked={isUserSelected(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      aria-label={`Select ${user.name}`}
                    />
                    
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {user.image ? (
                        <Image 
                          src={user.image} 
                          alt={user.name || 'User'} 
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 mb-1">
                        <h4 className="font-semibold truncate text-sm sm:text-base">
                          {user.name || 'No Name'}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getUserRoleColor(user.role)} text-xs`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {getUserRoleText(user.role)}
                          </Badge>
                          <Badge className={`${getVerificationColor(user.emailVerified)} text-xs`}>
                            {getVerificationStatus(user.emailVerified)}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        Bergabung: {formatUserDate(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Mobile: Vertical layout, Desktop: Horizontal */}
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 flex-shrink-0">
                    {/* Action buttons untuk mobile dan desktop */}
                    <div className="flex items-center space-x-2 justify-center sm:justify-start">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewUser(user)}
                        title="Lihat detail"
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="sr-only">Lihat detail</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        title="Edit user"
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="sr-only">Edit user</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Hapus user"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="sr-only">Hapus user</span>
                      </Button>
                    </div>
                    
                    {/* Role selector */}
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleUpdate(user.id, value as 'ADMIN' | 'CUSTOMER')}
                    >
                      <SelectTrigger className="w-full sm:w-24 h-8 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        <span className="sm:hidden">{user.role}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex flex-col items-center justify-center space-y-3 mt-6 sm:flex-row sm:justify-between sm:space-y-0">
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Halaman {data.pagination.page} dari {data.pagination.totalPages}
              </p>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="text-xs px-3 py-1 h-8"
                >
                  <span className="hidden sm:inline">Sebelumnya</span>
                  <span className="sm:hidden">←</span>
                </Button>
                
                <span className="text-xs text-muted-foreground px-2">
                  {currentPage}/{data.pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(currentPage + 1)}
                  disabled={currentPage >= data.pagination.totalPages}
                  className="text-xs px-3 py-1 h-8"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <span className="sm:hidden">→</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Form */}
      <EditUserForm
        user={editUser}
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onUserUpdated={handleUserUpdated}
      />

      {/* User Detail View */}
      <UserDetailView
        user={selectedUser}
        open={showDetailView}
        onOpenChange={setShowDetailView}
      />
    </>
  )
}
