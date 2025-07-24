'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AdminPageLayout, StatsCard } from '@/components/admin/admin-page-layout'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Bell, 
  Search,
  Mail,
  Settings,
  Loader2,
  CheckSquare,
  Square,
  Eye
} from 'lucide-react'
import { UserNotificationDetailModal } from '@/features/user-notifications/components/admin-user-detail-modal'
import { AdminBulkActions } from '@/features/user-notifications/components/admin-bulk-actions'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  notificationSettings?: {
    orderUpdates: boolean
    paymentConfirmations: boolean
    productAnnouncements: boolean
    promotionalEmails: boolean
    securityAlerts: boolean
    accountUpdates: boolean
  }
}

interface NotificationStats {
  totalUsers: number
  activeNotifications: number
  optedInPromo: number
  recentActivity: number
}

export default function AdminNotificationManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    totalUsers: 0,
    activeNotifications: 0,
    optedInPromo: 0,
    recentActivity: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [notificationFilter, setNotificationFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=/admin/notifications')
      return
    }

    // Check if user is admin - this would typically be done with user data
    // For now, we'll assume the session contains the role
    if (session.user.email !== 'admin@perdami.com') { // Temporary check
      router.push('/profile')
      return
    }

    fetchUsersAndStats()
  }, [session, status, router])

  const fetchUsersAndStats = async () => {
    try {
      setIsLoading(true)
      
      const usersResponse = await fetch('/api/admin/users/notifications')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
        setStats(usersData.stats || stats)
      }
    } catch (error) {
      console.error('Error fetching users and stats:', error)
      toast.error('Gagal memuat data pengguna')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(user => user.id)
    )
  }

  const handleUserDetailOpen = (user: User) => {
    setSelectedUser(user)
    setIsDetailModalOpen(true)
  }

  const handleUserDetailClose = () => {
    setSelectedUser(null)
    setIsDetailModalOpen(false)
  }

  const handleUserUpdate = () => {
    // Refresh user data after update
    fetchUsersAndStats()
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    const matchesNotification = notificationFilter === 'all' || 
      (notificationFilter === 'promo' && user.notificationSettings?.promotionalEmails) ||
      (notificationFilter === 'orders' && user.notificationSettings?.orderUpdates) ||
      (notificationFilter === 'disabled' && !Object.values(user.notificationSettings || {}).some(Boolean))
    
    return matchesSearch && matchesRole && matchesNotification
  })

  const getNotificationStatus = (settings: User['notificationSettings']) => {
    if (!settings) return { count: 0, label: 'Tidak ada', variant: 'secondary' as const }
    
    const enabledCount = Object.values(settings).filter(Boolean).length
    const totalCount = Object.keys(settings).length
    
    if (enabledCount === 0) return { count: 0, label: 'Nonaktif', variant: 'destructive' as const }
    if (enabledCount === totalCount) return { count: enabledCount, label: 'Semua', variant: 'default' as const }
    return { count: enabledCount, label: `${enabledCount}/${totalCount}`, variant: 'secondary' as const }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Memuat...</span>
      </div>
    )
  }

  return (
    <AdminPageLayout
      title="Manajemen Notifikasi"
      description="Kelola pengaturan notifikasi dan komunikasi dengan pengguna"
      loading={isLoading}
      onRefresh={fetchUsersAndStats}
      headerContent={
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Pengguna"
            value={stats.totalUsers.toString()}
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Notifikasi Aktif"
            value={stats.activeNotifications.toString()}
            icon={<Bell className="h-4 w-4" />}
          />
          <StatsCard
            title="Opt-in Promosi"
            value={stats.optedInPromo.toString()}
            icon={<Mail className="h-4 w-4" />}
          />
          <StatsCard
            title="Aktivitas Terbaru"
            value={stats.recentActivity.toString()}
            icon={<Settings className="h-4 w-4" />}
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Bulk Actions */}
        <AdminBulkActions
          users={filteredUsers}
          selectedUsers={selectedUsers}
          onSelectionChange={setSelectedUsers}
          onUsersUpdate={handleUserUpdate}
        />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cari Pengguna</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Email atau nama..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Notifikasi</label>
                <Select value={notificationFilter} onValueChange={setNotificationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="promo">Promosi Aktif</SelectItem>
                    <SelectItem value="orders">Order Update Aktif</SelectItem>
                    <SelectItem value="disabled">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Daftar Pengguna ({filteredUsers.length})</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2"
                >
                  {selectedUsers.length === filteredUsers.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {selectedUsers.length === filteredUsers.length ? 'Batalkan' : 'Pilih Semua'}
                </Button>
                {selectedUsers.length > 0 && (
                  <Badge variant="secondary">
                    {selectedUsers.length} dipilih
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status Notifikasi</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const notificationStatus = getNotificationStatus(user.notificationSettings)
                  const isSelected = selectedUsers.includes(user.id)
                  
                  return (
                    <TableRow key={user.id} className={isSelected ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleUserSelect(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || 'Tidak ada nama'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={notificationStatus.variant}>
                          {notificationStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUserDetailOpen(user)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        {selectedUser && (
          <UserNotificationDetailModal
            user={selectedUser}
            isOpen={isDetailModalOpen}
            onClose={handleUserDetailClose}
            onUserUpdate={handleUserUpdate}
          />
        )}
      </div>
    </AdminPageLayout>
  )
}
