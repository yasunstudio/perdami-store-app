'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Save, RotateCcw, Loader2, Settings2, Globe, Mail, MapPin, Facebook, AlertTriangle, AlertCircle } from 'lucide-react'

interface AppSettings {
  id: string
  appName: string
  appDescription: string
  appLogo?: string
  contactEmail: string
  contactPhone: string
  whatsappNumber: string
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  youtubeUrl?: string
  businessAddress: string
  pickupLocation: string
  pickupCity: string
  eventName: string
  eventYear: string
  copyrightText: string
  copyrightSubtext: string
  isMaintenanceMode: boolean
  maintenanceMessage?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        } else {
          throw new Error('Failed to fetch settings')
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error("Gagal memuat pengaturan aplikasi")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Handle form changes
  const handleChange = (field: keyof AppSettings, value: string | boolean) => {
    if (settings) {
      setSettings({
        ...settings,
        [field]: value
      })
      setHasChanges(true)
    }
  }

  // Save settings
  const handleSave = useCallback(async () => {
    if (!settings) return

    try {
      setIsSaving(true)
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        setHasChanges(false)
        toast.success("Pengaturan berhasil disimpan", {
          description: "Semua perubahan telah tersimpan dan berlaku sekarang"
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error("Gagal menyimpan pengaturan", {
        description: "Terjadi kesalahan saat menyimpan ke server"
      })
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        if (hasChanges && !isSaving && !isResetting) {
          handleSave()
        }
      }
      // Escape to close dialog
      if (event.key === 'Escape' && showResetDialog) {
        setShowResetDialog(false)
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [hasChanges, isSaving, isResetting, showResetDialog, handleSave])

  // Reset changes
  const handleReset = async () => {
    try {
      setIsResetting(true)
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setHasChanges(false)
        setShowResetDialog(false)
        toast.success("Perubahan berhasil direset ke data asli", {
          description: "Semua pengaturan telah dikembalikan ke nilai sebelumnya"
        })
      } else {
        throw new Error('Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error("Gagal mereset pengaturan", {
        description: "Terjadi kesalahan saat mengambil data dari server"
      })
    } finally {
      setIsResetting(false)
    }
  }

  // Cancel reset dialog
  const handleCancelReset = () => {
    setShowResetDialog(false)
  }

  // Confirm reset dialog
  const handleConfirmReset = () => {
    setShowResetDialog(true)
  }

  if (isLoading || !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Pengaturan Aplikasi
          </CardTitle>
          <CardDescription>
            Kelola konfigurasi dan pengaturan aplikasi Perdami Store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Memuat pengaturan...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-none">
      {/* Header with Actions */}
      <Card className={hasChanges ? 'border-yellow-200 shadow-sm' : ''}>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Settings2 className="h-5 w-5" />
                Pengaturan Aplikasi
                {hasChanges && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                Kelola konfigurasi dan pengaturan aplikasi Perdami Store
              </CardDescription>
            </div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              {hasChanges && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                    Perubahan belum disimpan
                  </Badge>
                </div>
              )}
              <div className="flex space-x-2">
                <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConfirmReset}
                      disabled={isSaving || isResetting || !hasChanges}
                      className="flex-1 sm:flex-none"
                    >
                      {isResetting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      Reset
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        Konfirmasi Reset Perubahan
                      </DialogTitle>
                      <DialogDescription className="space-y-2 pt-2">
                        <p>
                          Apakah Anda yakin ingin mereset semua perubahan yang belum disimpan?
                        </p>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-orange-800">
                              <p className="font-medium">Tindakan ini tidak dapat dibatalkan</p>
                              <p className="text-orange-700 mt-1">
                                Semua perubahan yang Anda buat akan hilang dan kembali ke pengaturan terakhir yang disimpan.
                              </p>
                            </div>
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                      <Button
                        variant="outline"
                        onClick={handleCancelReset}
                        disabled={isResetting}
                        className="w-full sm:w-auto"
                      >
                        Batal
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReset}
                        disabled={isResetting}
                        className="w-full sm:w-auto"
                      >
                        {isResetting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Mereset...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Ya, Reset Perubahan
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || isResetting || !hasChanges}
                  size="sm"
                  className="flex-1 sm:flex-none"
                  title="Simpan pengaturan (Ctrl+S)"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Maintenance Mode Warning */}
      {settings.isMaintenanceMode && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-orange-800">Mode Maintenance Aktif</p>
                <p className="text-sm text-orange-700">
                  Aplikasi saat ini dalam mode maintenance. User tidak dapat mengakses aplikasi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Informasi Aplikasi
          </CardTitle>
          <CardDescription>
            Konfigurasi dasar aplikasi seperti nama, deskripsi, dan logo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="appName">Nama Aplikasi</Label>
              <Input
                id="appName"
                value={settings.appName}
                onChange={(e) => handleChange('appName', e.target.value)}
                placeholder="Perdami Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appLogo">Path Logo</Label>
              <Input
                id="appLogo"
                value={settings.appLogo || ''}
                onChange={(e) => handleChange('appLogo', e.target.value)}
                placeholder="/images/logo.png"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appDescription">Deskripsi Aplikasi</Label>
            <Textarea
              id="appDescription"
              value={settings.appDescription}
              onChange={(e) => handleChange('appDescription', e.target.value)}
              rows={3}
              placeholder="Platform pre-order oleh-oleh khas Bandung..."
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Informasi Kontak
          </CardTitle>
          <CardDescription>
            Email, telepon, dan WhatsApp untuk customer service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email Kontak</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="info@perdamistore.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Nomor Telepon</Label>
              <Input
                id="contactPhone"
                value={settings.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                placeholder="+6281234567890"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">Nomor WhatsApp</Label>
            <Input
              id="whatsappNumber"
              value={settings.whatsappNumber}
              onChange={(e) => handleChange('whatsappNumber', e.target.value)}
              placeholder="6281234567890"
            />
            <p className="text-sm text-muted-foreground">
              Nomor WhatsApp tanpa tanda + dan spasi
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            Media Sosial
          </CardTitle>
          <CardDescription>
            Link ke akun media sosial untuk ditampilkan di footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input
                id="facebookUrl"
                value={settings.facebookUrl || ''}
                onChange={(e) => handleChange('facebookUrl', e.target.value)}
                placeholder="https://facebook.com/perdamistore"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                value={settings.instagramUrl || ''}
                onChange={(e) => handleChange('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/perdamistore"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="twitterUrl">Twitter URL</Label>
              <Input
                id="twitterUrl"
                value={settings.twitterUrl || ''}
                onChange={(e) => handleChange('twitterUrl', e.target.value)}
                placeholder="https://twitter.com/perdamistore"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube URL</Label>
              <Input
                id="youtubeUrl"
                value={settings.youtubeUrl || ''}
                onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                placeholder="https://youtube.com/@perdamistore"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Informasi Bisnis
          </CardTitle>
          <CardDescription>
            Alamat dan lokasi pickup untuk event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="businessAddress">Alamat Lengkap</Label>
            <Textarea
              id="businessAddress"
              value={settings.businessAddress}
              onChange={(e) => handleChange('businessAddress', e.target.value)}
              rows={2}
              placeholder="Venue PIT PERDAMI 2025, Bandung, Jawa Barat"
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="pickupLocation">Lokasi Pickup</Label>
              <Input
                id="pickupLocation"
                value={settings.pickupLocation}
                onChange={(e) => handleChange('pickupLocation', e.target.value)}
                placeholder="Venue PIT PERDAMI 2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupCity">Kota Pickup</Label>
              <Input
                id="pickupCity"
                value={settings.pickupCity}
                onChange={(e) => handleChange('pickupCity', e.target.value)}
                placeholder="Bandung, Jawa Barat"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Event</CardTitle>
          <CardDescription>
            Detail event PIT PERDAMI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="eventName">Nama Event</Label>
              <Input
                id="eventName"
                value={settings.eventName}
                onChange={(e) => handleChange('eventName', e.target.value)}
                placeholder="PIT PERDAMI 2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventYear">Tahun Event</Label>
              <Input
                id="eventYear"
                value={settings.eventYear}
                onChange={(e) => handleChange('eventYear', e.target.value)}
                placeholder="2025"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Text */}
      <Card>
        <CardHeader>
          <CardTitle>Teks Footer</CardTitle>
          <CardDescription>
            Copyright dan teks yang ditampilkan di footer website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="copyrightText">Teks Copyright</Label>
            <Input
              id="copyrightText"
              value={settings.copyrightText}
              onChange={(e) => handleChange('copyrightText', e.target.value)}
              placeholder="© 2025 Perdami Store. Dibuat khusus untuk PIT PERDAMI 2025."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="copyrightSubtext">Sub-teks Copyright</Label>
            <Input
              id="copyrightSubtext"
              value={settings.copyrightSubtext}
              onChange={(e) => handleChange('copyrightSubtext', e.target.value)}
              placeholder="Semua hak cipta dilindungi."
            />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Sistem</CardTitle>
          <CardDescription>
            Mode maintenance dan status aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Mode Maintenance</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Aktifkan untuk menonaktifkan akses user ke aplikasi
              </p>
            </div>
            <Switch
              checked={settings.isMaintenanceMode}
              onCheckedChange={(checked: boolean) => handleChange('isMaintenanceMode', checked)}
            />
          </div>
          
          {settings.isMaintenanceMode && (
            <div className="space-y-2">
              <Label htmlFor="maintenanceMessage">Pesan Maintenance</Label>
              <Textarea
                id="maintenanceMessage"
                value={settings.maintenanceMessage || ''}
                onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                rows={3}
                placeholder="Aplikasi sedang dalam pemeliharaan. Silakan coba lagi nanti."
                className="resize-none"
              />
            </div>
          )}

          <Separator />

          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Status Aplikasi Aktif</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Nonaktifkan untuk mematikan aplikasi sepenuhnya
              </p>
            </div>
            <Switch
              checked={settings.isActive}
              onCheckedChange={(checked: boolean) => handleChange('isActive', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Actions */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
              Terakhir diupdate: {new Date(settings.updatedAt).toLocaleString('id-ID')}
            </div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 order-1 sm:order-2">
              {hasChanges && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                    Ada perubahan yang belum disimpan
                  </Badge>
                </div>
              )}
              <div className="flex space-x-2">
                <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={handleConfirmReset}
                      disabled={isSaving || isResetting || !hasChanges}
                      className="flex-1 sm:flex-none"
                    >
                      {isResetting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      Reset Perubahan
                    </Button>
                  </DialogTrigger>
                </Dialog>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || isResetting || !hasChanges}
                  className="flex-1 sm:flex-none"
                  title="Simpan pengaturan (Ctrl+S)"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Simpan Pengaturan
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
