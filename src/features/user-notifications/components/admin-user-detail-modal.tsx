// Admin User Notification Detail Modal Component
'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  Mail, 
  Shield, 
  ShoppingCart, 
  Package, 
  User,
  Calendar,
  Activity,
  Settings,
  Save,
  RefreshCw,
  History
} from 'lucide-react'
import { toast } from 'sonner'
import { NOTIFICATION_CATEGORIES } from '@/features/user-notifications/config'

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

interface NotificationLog {
  id: string
  type: string
  message: string
  sentAt: string
  status: 'sent' | 'failed' | 'pending'
}

interface UserNotificationDetailModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onUserUpdate?: (updatedUser: User) => void
}

export function UserNotificationDetailModal({
  user,
  isOpen,
  onClose,
  onUserUpdate
}: UserNotificationDetailModalProps) {
  const [settings, setSettings] = useState(user?.notificationSettings || {})
  const [originalSettings, setOriginalSettings] = useState(user?.notificationSettings || {})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (user?.notificationSettings) {
      setSettings(user.notificationSettings)
      setOriginalSettings(user.notificationSettings)
      setHasChanges(false)
    }
  }, [user])

  useEffect(() => {
    if (user && isOpen) {
      fetchNotificationLogs()
    }
  }, [user, isOpen])

  const fetchNotificationLogs = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/users/${user.id}/notification-logs`)
      if (response.ok) {
        const logs = await response.json()
        setNotificationLogs(logs.data || [])
      }
    } catch (error) {
      console.error('Error fetching notification logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(originalSettings))
  }

  const handleSave = async () => {
    if (!user || !hasChanges) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/admin/users/${user.id}/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const updatedUser: User = { 
          ...user, 
          notificationSettings: settings as User['notificationSettings']
        }
        setOriginalSettings(settings)
        setHasChanges(false)
        onUserUpdate?.(updatedUser)
        toast.success('Pengaturan notifikasi berhasil diperbarui')
      } else {
        throw new Error('Gagal memperbarui pengaturan')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal memperbarui pengaturan notifikasi')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(originalSettings)
    setHasChanges(false)
  }

  const handleTestNotification = async (type: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/admin/users/${user.id}/test-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      if (response.ok) {
        toast.success(`Notifikasi test ${type} berhasil dikirim`)
        fetchNotificationLogs() // Refresh logs
      } else {
        throw new Error('Gagal mengirim notifikasi test')
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Gagal mengirim notifikasi test')
    }
  }

  const getNotificationIcon = (key: string) => {
    switch (key) {
      case 'orderUpdates':
      case 'paymentConfirmations':
        return <ShoppingCart className="h-4 w-4" />
      case 'productAnnouncements':
        return <Package className="h-4 w-4" />
      case 'promotionalEmails':
        return <Mail className="h-4 w-4" />
      case 'securityAlerts':
        return <Shield className="h-4 w-4" />
      case 'accountUpdates':
        return <User className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationLabel = (key: string) => {
    const labels: Record<string, string> = {
      orderUpdates: 'Update Pesanan',
      paymentConfirmations: 'Konfirmasi Pembayaran',
      productAnnouncements: 'Pengumuman Produk',
      promotionalEmails: 'Email Promosi',
      securityAlerts: 'Peringatan Keamanan',
      accountUpdates: 'Update Akun'
    }
    return labels[key] || key
  }

  const getNotificationDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      orderUpdates: 'Notifikasi status pesanan dan pengiriman',
      paymentConfirmations: 'Konfirmasi pembayaran dan invoice',
      productAnnouncements: 'Produk baru dan update catalog',
      promotionalEmails: 'Penawaran khusus dan diskon',
      securityAlerts: 'Aktivitas mencurigakan dan keamanan akun',
      accountUpdates: 'Perubahan profil dan pengaturan akun'
    }
    return descriptions[key] || ''
  }

  const isRequired = (key: string) => {
    return ['orderUpdates', 'paymentConfirmations', 'securityAlerts'].includes(key)
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pengaturan Notifikasi - {user.name || user.email}
          </DialogTitle>
          <DialogDescription>
            Kelola pengaturan notifikasi untuk {user.email}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
            <TabsTrigger value="test">Test Notifikasi</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* User Info Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Informasi Pengguna</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{user.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nama:</span>
                      <span>{user.name || 'Tidak ada'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bergabung:</span>
                      <span>{new Date(user.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pengaturan Notifikasi</h3>
                  
                  {Object.entries(settings).map(([key, value]) => (
                    <Card key={key}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="mt-1">
                              {getNotificationIcon(key)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={key} className="text-sm font-medium">
                                  {getNotificationLabel(key)}
                                </Label>
                                {isRequired(key) && (
                                  <Badge variant="outline" className="text-xs">
                                    Wajib
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {getNotificationDescription(key)}
                              </p>
                            </div>
                          </div>
                          <Switch
                            id={key}
                            checked={Boolean(value)}
                            onCheckedChange={(checked) => handleSettingChange(key, checked)}
                            disabled={isRequired(key)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Riwayat Notifikasi</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNotificationLogs}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <ScrollArea className="h-[400px]">
              {notificationLogs.length > 0 ? (
                <div className="space-y-3">
                  {notificationLogs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <History className="h-4 w-4" />
                              <span className="text-sm font-medium">{log.type}</span>
                              <Badge 
                                variant={
                                  log.status === 'sent' ? 'default' : 
                                  log.status === 'failed' ? 'destructive' : 'secondary'
                                }
                                className="text-xs"
                              >
                                {log.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{log.message}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.sentAt).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Belum ada riwayat notifikasi</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <h3 className="text-lg font-semibold">Test Notifikasi</h3>
            <p className="text-sm text-muted-foreground">
              Kirim notifikasi test untuk menguji pengaturan notifikasi pengguna
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings)
                .filter(([_, value]) => value) // Only show enabled notifications
                .map(([key]) => (
                <Card key={key}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getNotificationIcon(key)}
                        <div>
                          <p className="text-sm font-medium">
                            {getNotificationLabel(key)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Test notifikasi
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestNotification(key)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Kirim
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-xs">
                Ada perubahan yang belum disimpan
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
