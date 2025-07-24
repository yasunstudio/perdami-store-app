'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  CreditCard, 
  Shield, 
  User, 
  Tag, 
  Mail,
  ShoppingCart,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface NotificationSettings {
  orderUpdates: boolean
  paymentConfirmations: boolean
  securityAlerts: boolean
  accountUpdates: boolean
  productAnnouncements: boolean
  promotionalEmails: boolean
}

interface NotificationSettingsFormProps {
  initialSettings: NotificationSettings
  userId: string
}

export function NotificationSettingsForm({ initialSettings, userId }: NotificationSettingsFormProps) {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings)
  const [isLoading, setIsLoading] = useState(false)

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const result = await response.json()
      toast.success('Pengaturan notifikasi berhasil disimpan')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan notifikasi')
    } finally {
      setIsLoading(false)
    }
  }

  const settingItems = [
    {
      key: 'orderUpdates' as keyof NotificationSettings,
      title: 'Update Pesanan',
      description: 'Terima notifikasi ketika status pesanan berubah',
      icon: <ShoppingCart className="w-5 h-5" />
    },
    {
      key: 'paymentConfirmations' as keyof NotificationSettings,
      title: 'Konfirmasi Pembayaran',
      description: 'Terima notifikasi ketika pembayaran dikonfirmasi atau gagal',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      key: 'securityAlerts' as keyof NotificationSettings,
      title: 'Peringatan Keamanan',
      description: 'Terima notifikasi untuk aktivitas keamanan yang mencurigakan',
      icon: <Shield className="w-5 h-5" />
    },
    {
      key: 'accountUpdates' as keyof NotificationSettings,
      title: 'Update Akun',
      description: 'Terima notifikasi ketika ada perubahan pada akun Anda',
      icon: <User className="w-5 h-5" />
    },
    {
      key: 'productAnnouncements' as keyof NotificationSettings,
      title: 'Pengumuman Produk',
      description: 'Terima notifikasi tentang produk baru dan update stok',
      icon: <Tag className="w-5 h-5" />
    },
    {
      key: 'promotionalEmails' as keyof NotificationSettings,
      title: 'Email Promosi',
      description: 'Terima email tentang penawaran khusus dan diskon',
      icon: <Mail className="w-5 h-5" />
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Preferensi Notifikasi
        </CardTitle>
        <CardDescription>
          Pilih jenis notifikasi yang ingin Anda terima
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settingItems.map((item, index) => (
          <div key={item.key}>
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <div className="mt-1 text-gray-500">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium leading-none">
                    {item.title}
                  </Label>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={(checked) => handleSettingChange(item.key, checked)}
                aria-label={`Toggle ${item.title}`}
              />
            </div>
            {index < settingItems.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
        
        <div className="pt-4">
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm text-gray-500">
            <p className="mb-2">
              <strong>Catatan:</strong> Beberapa notifikasi seperti peringatan keamanan 
              tidak dapat dinonaktifkan untuk menjaga keamanan akun Anda.
            </p>
            <p>
              Notifikasi akan dikirim melalui email dan juga ditampilkan di aplikasi. 
              Anda dapat mengubah pengaturan ini kapan saja.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
