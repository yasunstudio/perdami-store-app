// Admin Bulk Notification Actions Component
'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Send,
  Users,
  Mail,
  Settings,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  notificationSettings?: {
    orderUpdates: boolean
    paymentConfirmations: boolean
    productAnnouncements: boolean
    promotionalEmails: boolean
    securityAlerts: boolean
    accountUpdates: boolean
  }
}

interface BulkActionStats {
  totalSelected: number
  byRole: { [key: string]: number }
  byNotificationType: { [key: string]: number }
}

interface AdminBulkActionsProps {
  users: User[]
  selectedUsers: string[]
  onSelectionChange: (userIds: string[]) => void
  onUsersUpdate?: () => void
}

export function AdminBulkActions({
  users,
  selectedUsers,
  onSelectionChange,
  onUsersUpdate
}: AdminBulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [bulkUpdateType, setBulkUpdateType] = useState<string>('')
  const [bulkNotificationData, setBulkNotificationData] = useState({
    subject: '',
    message: '',
    type: 'general',
    sendToAll: false
  })

  const getStats = (): BulkActionStats => {
    const selectedUserData = users.filter(user => selectedUsers.includes(user.id))
    
    const byRole = selectedUserData.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    const byNotificationType = selectedUserData.reduce((acc, user) => {
      if (user.notificationSettings) {
        Object.entries(user.notificationSettings).forEach(([key, enabled]) => {
          if (enabled) {
            acc[key] = (acc[key] || 0) + 1
          }
        })
      }
      return acc
    }, {} as { [key: string]: number })

    return {
      totalSelected: selectedUsers.length,
      byRole,
      byNotificationType
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(users.map(user => user.id))
    }
  }

  const handleBulkNotificationUpdate = async (action: string, enabled: boolean) => {
    if (selectedUsers.length === 0) {
      toast.error('Pilih minimal satu pengguna')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users/bulk-notification-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          action,
          enabled
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Berhasil memperbarui ${result.updated} pengguna`)
        onUsersUpdate?.()
        onSelectionChange([])
      } else {
        throw new Error('Gagal memperbarui pengaturan')
      }
    } catch (error) {
      console.error('Error bulk updating:', error)
      toast.error('Gagal memperbarui pengaturan notifikasi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendBulkNotification = async () => {
    const { subject, message, type, sendToAll } = bulkNotificationData
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject dan pesan harus diisi')
      return
    }

    if (!sendToAll && selectedUsers.length === 0) {
      toast.error('Pilih minimal satu pengguna atau aktifkan "Kirim ke Semua"')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users/send-bulk-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: sendToAll ? users.map(u => u.id) : selectedUsers,
          subject,
          message,
          type
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Notifikasi berhasil dikirim ke ${result.sent} pengguna`)
        setBulkNotificationData({
          subject: '',
          message: '',
          type: 'general',
          sendToAll: false
        })
        onSelectionChange([])
      } else {
        throw new Error('Gagal mengirim notifikasi')
      }
    } catch (error) {
      console.error('Error sending bulk notification:', error)
      toast.error('Gagal mengirim notifikasi bulk')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users/export-notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers.length > 0 ? selectedUsers : users.map(u => u.id)
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `notification-settings-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Data berhasil diekspor')
      } else {
        throw new Error('Gagal mengekspor data')
      }
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Gagal mengekspor data')
    } finally {
      setIsLoading(false)
    }
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* Selection Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Aksi Massal
          </CardTitle>
          <CardDescription>
            Kelola pengaturan notifikasi untuk beberapa pengguna sekaligus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selection Summary */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedUsers.length === users.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedUsers.length} dari {users.length} pengguna dipilih
              </span>
            </div>
            {selectedUsers.length > 0 && (
              <Badge variant="secondary">
                {stats.totalSelected} dipilih
              </Badge>
            )}
          </div>

          {/* Stats breakdown */}
          {selectedUsers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Berdasarkan Role</h4>
                <div className="space-y-1">
                  {Object.entries(stats.byRole).map(([role, count]) => (
                    <div key={role} className="flex justify-between text-sm">
                      <span>{role}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notifikasi Aktif</h4>
                <div className="space-y-1">
                  {Object.entries(stats.byNotificationType).slice(0, 3).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Bulk Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Enable All Notifications */}
            <Button
              variant="outline"
              onClick={() => handleBulkNotificationUpdate('enableAll', true)}
              disabled={isLoading || selectedUsers.length === 0}
              className="justify-start"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aktifkan Semua
            </Button>

            {/* Disable Optional Notifications */}
            <Button
              variant="outline"
              onClick={() => handleBulkNotificationUpdate('disableOptional', false)}
              disabled={isLoading || selectedUsers.length === 0}
              className="justify-start"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Hanya Wajib
            </Button>

            {/* Enable Promotions */}
            <Button
              variant="outline"
              onClick={() => handleBulkNotificationUpdate('promotionalEmails', true)}
              disabled={isLoading || selectedUsers.length === 0}
              className="justify-start"
            >
              <Mail className="h-4 w-4 mr-2" />
              Aktifkan Promo
            </Button>

            {/* Export Settings */}
            <Button
              variant="outline"
              onClick={handleExportSettings}
              disabled={isLoading}
              className="justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Notification Sender */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Kirim Notifikasi Massal
          </CardTitle>
          <CardDescription>
            Kirim notifikasi khusus ke pengguna yang dipilih
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Masukkan subject notifikasi"
                value={bulkNotificationData.subject}
                onChange={(e) => setBulkNotificationData(prev => ({ 
                  ...prev, 
                  subject: e.target.value 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipe Notifikasi</Label>
              <Select
                value={bulkNotificationData.type}
                onValueChange={(value) => setBulkNotificationData(prev => ({ 
                  ...prev, 
                  type: value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Umum</SelectItem>
                  <SelectItem value="promotion">Promosi</SelectItem>
                  <SelectItem value="announcement">Pengumuman</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Pesan</Label>
            <Textarea
              id="message"
              placeholder="Masukkan pesan notifikasi"
              rows={4}
              value={bulkNotificationData.message}
              onChange={(e) => setBulkNotificationData(prev => ({ 
                ...prev, 
                message: e.target.value 
              }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendToAll"
              checked={bulkNotificationData.sendToAll}
              onCheckedChange={(checked) => setBulkNotificationData(prev => ({ 
                ...prev, 
                sendToAll: checked as boolean 
              }))}
            />
            <Label htmlFor="sendToAll" className="text-sm">
              Kirim ke semua pengguna (abaikan seleksi)
            </Label>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {bulkNotificationData.sendToAll 
                ? `Akan dikirim ke ${users.length} pengguna`
                : `Akan dikirim ke ${selectedUsers.length} pengguna`
              }
            </div>
            <Button
              onClick={handleSendBulkNotification}
              disabled={isLoading || (!bulkNotificationData.sendToAll && selectedUsers.length === 0)}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Notifikasi
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
