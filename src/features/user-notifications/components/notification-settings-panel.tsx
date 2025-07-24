// Notification Settings Panel Component
'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { 
  Save, 
  RotateCcw, 
  Bell, 
  Settings, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Smartphone
} from 'lucide-react'
import { useNotificationSettings } from '../hooks/use-notification-settings'
import { NOTIFICATION_CATEGORIES, NOTIFICATION_CHANNELS, getNotificationIcon } from '../config'

interface NotificationSettingsPanelProps {
  className?: string
}

export function NotificationSettingsPanel({ className = '' }: NotificationSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('settings')
  const {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    updateSetting,
    updateSettings,
    saveSettings,
    resetSettings,
  } = useNotificationSettings()

  const handleSave = async () => {
    await saveSettings()
  }

  const handleReset = () => {
    resetSettings()
  }

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'enable-all':
        updateSettings({
          orderUpdates: true,
          paymentConfirmations: true,
          productAnnouncements: true,
          promotionalEmails: true,
          securityAlerts: true,
          accountUpdates: true,
        })
        break
      case 'disable-optional':
        updateSettings({
          orderUpdates: true, // Required
          paymentConfirmations: true, // Required
          productAnnouncements: false,
          promotionalEmails: false,
          securityAlerts: true, // Required
          accountUpdates: false,
        })
        break
      case 'marketing-only':
        updateSettings({
          orderUpdates: true,
          paymentConfirmations: true,
          productAnnouncements: true,
          promotionalEmails: true,
          securityAlerts: true,
          accountUpdates: true,
        })
        break
    }
    await saveSettings()
  }

  const renderQuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aksi Cepat</CardTitle>
        <CardDescription>
          Atur semua notifikasi sekaligus dengan preset yang umum digunakan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickAction('enable-all')}
            disabled={isSaving}
            className="justify-start"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aktifkan Semua
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickAction('disable-optional')}
            disabled={isSaving}
            className="justify-start"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Hanya Penting
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleQuickAction('marketing-only')}
            disabled={isSaving}
            className="justify-start"
          >
            <Mail className="h-4 w-4 mr-2" />
            Semua + Promo
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderCategorySetting = (category: any) => {
    const Icon = getNotificationIcon(category.id)
    const categorySettings = category.settings.map((s: any) => settings[s.key as keyof typeof settings])
    const enabledCount = categorySettings.filter(Boolean).length
    const totalCount = categorySettings.length
    
    return (
      <Card key={category.id}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">{category.title}</CardTitle>
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
              </div>
            </div>
            <Badge variant={enabledCount > 0 ? 'default' : 'secondary'}>
              {enabledCount}/{totalCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {category.settings.map((setting: any) => {
            const isEnabled = settings[setting.key as keyof typeof settings]
            
            return (
              <div key={setting.key} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={setting.key} className="text-sm font-medium">
                      {setting.label}
                    </Label>
                    {setting.isRequired && (
                      <Badge variant="secondary" className="text-xs">
                        Wajib
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Switch
                  id={setting.key}
                  checked={isEnabled}
                  onCheckedChange={(checked) => updateSetting(setting.key, checked)}
                  disabled={setting.isRequired || isLoading}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  const renderChannelSettings = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saluran Notifikasi</CardTitle>
          <CardDescription>
            Pilih bagaimana Anda ingin menerima notifikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIFICATION_CHANNELS.map((channel) => {
            const Icon = getNotificationIcon(channel.id)
            return (
              <div key={channel.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <div>
                    <Label className="text-sm font-medium">{channel.name}</Label>
                    <p className="text-xs text-muted-foreground">
                      {channel.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={channel.id === 'email'} // Email always enabled for now
                  disabled={channel.id === 'email'} // Email always enabled
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frekuensi Notifikasi</CardTitle>
          <CardDescription>
            Kontrol seberapa sering Anda menerima notifikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Notifikasi Langsung</Label>
              <Switch checked={true} disabled />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Ringkasan Harian</Label>
              <Switch checked={false} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Ringkasan Mingguan</Label>
              <Switch checked={false} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Memuat pengaturan notifikasi...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Pengaturan Notifikasi</h2>
          <p className="text-muted-foreground">
            Kelola preferensi notifikasi untuk mendapatkan informasi yang relevan
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="outline" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Ada perubahan
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          <TabsTrigger value="channels">Saluran & Frekuensi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-4">
          {NOTIFICATION_CATEGORIES.map(renderCategorySetting)}
        </TabsContent>
        
        <TabsContent value="channels">
          {renderChannelSettings()}
        </TabsContent>
      </Tabs>

      {/* Save Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Ada perubahan yang belum disimpan</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  )
}
