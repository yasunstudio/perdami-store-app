// User Notification Settings Components
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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Save, 
  RotateCcw, 
  Bell, 
  Settings, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useNotificationSettings } from '../hooks/use-notification-settings'
import { NOTIFICATION_CATEGORIES, getNotificationIcon } from '../config'

interface NotificationSettingsProps {
  trigger?: React.ReactNode
  showHeader?: boolean
  className?: string
}

export function NotificationSettings({ 
  trigger, 
  showHeader = true,
  className = '' 
}: NotificationSettingsProps) {
  const [open, setOpen] = useState(false)
  const {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    updateSetting,
    saveSettings,
    resetSettings,
  } = useNotificationSettings()

  const handleSave = async () => {
    await saveSettings()
    setOpen(false)
  }

  const handleReset = () => {
    resetSettings()
  }

  const renderTrigger = () => {
    if (trigger) return trigger
    
    return (
      <Button variant="outline" size="sm">
        <Bell className="h-4 w-4 mr-2" />
        Pengaturan Notifikasi
      </Button>
    )
  }

  const renderSettingItem = (setting: any) => {
    const Icon = getNotificationIcon(setting.category)
    const isEnabled = settings[setting.key as keyof typeof settings]
    
    return (
      <div key={setting.key} className="flex items-center justify-between py-3">
        <div className="flex items-start space-x-3">
          <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
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
            <p className="text-sm text-muted-foreground">
              {setting.description}
            </p>
          </div>
        </div>
        <Switch
          id={setting.key}
          checked={isEnabled}
          onCheckedChange={(checked) => updateSetting(setting.key, checked)}
          disabled={setting.isRequired || isLoading}
        />
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {renderTrigger()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Pengaturan Notifikasi</span>
          </DialogTitle>
          <DialogDescription>
            Kelola preferensi notifikasi Anda untuk mendapatkan informasi yang relevan.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Memuat pengaturan...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {NOTIFICATION_CATEGORIES.map((category, index) => (
                <Card key={category.id} className="border-muted">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const Icon = getNotificationIcon(category.id)
                        return <Icon className="h-4 w-4" />
                      })()}
                      <CardTitle className="text-base">{category.title}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-0 divide-y">
                      {category.settings.map(renderSettingItem)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

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
              size="sm" 
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Quick actions component
export function NotificationQuickActions() {
  const {
    settings,
    isSaving,
    updateSettings,
    saveSettings,
  } = useNotificationSettings()

  const handleEnableAll = async () => {
    updateSettings({
      orderUpdates: true,
      paymentConfirmations: true,
      productAnnouncements: true,
      promotionalEmails: true,
      securityAlerts: true,
      accountUpdates: true,
    })
    await saveSettings()
  }

  const handleDisableOptional = async () => {
    updateSettings({
      orderUpdates: true, // Required
      paymentConfirmations: true, // Required
      productAnnouncements: false,
      promotionalEmails: false,
      securityAlerts: true, // Required
      accountUpdates: false,
    })
    await saveSettings()
  }

  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleEnableAll}
        disabled={isSaving}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Aktifkan Semua
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleDisableOptional}
        disabled={isSaving}
      >
        <XCircle className="h-4 w-4 mr-2" />
        Hanya Penting
      </Button>
    </div>
  )
}

// Status indicator component
export function NotificationStatusIndicator() {
  const { settings, isLoading } = useNotificationSettings()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Memuat...</span>
      </div>
    )
  }

  const enabledCount = Object.values(settings).filter(Boolean).length
  const totalCount = Object.keys(settings).length
  
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Bell className="h-4 w-4" />
        {enabledCount > 0 && (
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full" />
        )}
      </div>
      <span className="text-sm text-muted-foreground">
        {enabledCount} dari {totalCount} notifikasi aktif
      </span>
    </div>
  )
}
