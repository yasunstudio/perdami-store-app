'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Mail, Save, X, Bell, ShoppingCart, Package, CreditCard } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface EmailNotificationModalProps {
  trigger?: React.ReactNode
}

interface NotificationSettings {
  orderConfirmation: boolean
  orderStatusUpdates: boolean
  paymentConfirmation: boolean
  promotionalEmails: boolean
  productUpdates: boolean
  securityAlerts: boolean
  weeklyNewsletter: boolean
  accountActivity: boolean
}

const defaultSettings: NotificationSettings = {
  orderConfirmation: true,
  orderStatusUpdates: true,
  paymentConfirmation: true,
  promotionalEmails: false,
  productUpdates: false,
  securityAlerts: true,
  weeklyNewsletter: false,
  accountActivity: true
}

export function EmailNotificationModal({ trigger }: EmailNotificationModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/profile/notification-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data })
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
      // Use default settings if loading fails
      setSettings(defaultSettings)
    }
  }

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasChanges) {
      setOpen(false)
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Gagal menyimpan pengaturan notifikasi')
      }

      toast.success('Pengaturan notifikasi berhasil disimpan')
      setOpen(false)
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast.error('Gagal menyimpan pengaturan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const notificationGroups = [
    {
      title: 'Pesanan & Pembayaran',
      icon: <ShoppingCart className="h-4 w-4" />,
      items: [
        {
          key: 'orderConfirmation' as keyof NotificationSettings,
          label: 'Konfirmasi Pesanan',
          description: 'Notifikasi saat pesanan berhasil dibuat'
        },
        {
          key: 'orderStatusUpdates' as keyof NotificationSettings,
          label: 'Update Status Pesanan',
          description: 'Notifikasi perubahan status pesanan (diproses, dikirim, selesai)'
        },
        {
          key: 'paymentConfirmation' as keyof NotificationSettings,
          label: 'Konfirmasi Pembayaran',
          description: 'Notifikasi saat pembayaran berhasil diproses'
        }
      ]
    },
    {
      title: 'Produk & Promosi',
      icon: <Package className="h-4 w-4" />,
      items: [
        {
          key: 'promotionalEmails' as keyof NotificationSettings,
          label: 'Email Promosi',
          description: 'Penawaran khusus, diskon, dan promosi terbaru'
        },
        {
          key: 'productUpdates' as keyof NotificationSettings,
          label: 'Update Produk',
          description: 'Produk baru dan update stok produk favorit'
        },
        {
          key: 'weeklyNewsletter' as keyof NotificationSettings,
          label: 'Newsletter Mingguan',
          description: 'Ringkasan produk dan berita terbaru setiap minggu'
        }
      ]
    },
    {
      title: 'Keamanan & Akun',
      icon: <Bell className="h-4 w-4" />,
      items: [
        {
          key: 'securityAlerts' as keyof NotificationSettings,
          label: 'Peringatan Keamanan',
          description: 'Notifikasi aktivitas mencurigakan dan perubahan keamanan'
        },
        {
          key: 'accountActivity' as keyof NotificationSettings,
          label: 'Aktivitas Akun',
          description: 'Login baru, perubahan profil, dan aktivitas penting lainnya'
        }
      ]
    }
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Pengaturan Notifikasi
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pengaturan Notifikasi Email</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {notificationGroups.map((group, groupIndex) => (
            <div key={group.title} className="space-y-4">
              <div className="flex items-center space-x-2">
                {group.icon}
                <h3 className="font-medium text-sm">{group.title}</h3>
              </div>
              
              <div className="space-y-3 pl-6">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-start justify-between space-x-3">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={item.key} className="text-sm font-medium cursor-pointer">
                        {item.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      id={item.key}
                      checked={settings[item.key]}
                      onCheckedChange={(checked) => handleSettingChange(item.key, checked)}
                    />
                  </div>
                ))}
              </div>
              
              {groupIndex < notificationGroups.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Catatan:</strong> Beberapa notifikasi penting seperti konfirmasi pesanan dan peringatan keamanan 
              sangat disarankan untuk tetap aktif demi keamanan dan kenyamanan berbelanja Anda.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}