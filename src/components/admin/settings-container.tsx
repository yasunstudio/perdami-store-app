'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { 
  Save, 
  RotateCcw, 
  Loader2, 
  Settings2, 
  Globe, 
  Mail, 
  MapPin, 
  Facebook, 
  AlertTriangle, 
  AlertCircle,
  Calendar,
  FileText,
  Shield
} from 'lucide-react'
import { ContactInfoManager } from './contact-info-manager'

interface AppSettings {
  id: string
  appName: string
  appDescription: string
  appLogo?: string
  whatsappNumber: string
  businessAddress: string
  pickupLocation: string
  pickupCity: string
  eventName: string
  eventYear: string
  copyrightText: string
  copyrightSubtext: string
  isMaintenanceMode: boolean
  maintenanceMessage?: string
  singleBankMode: boolean
  defaultBankId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Bank {
  id: string
  name: string
  code: string
  accountNumber: string
  accountName: string
  isActive: boolean
}

export function SettingsContainer() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [banks, setBanks] = useState<Bank[]>([])
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
        
        // Fetch settings
        const settingsResponse = await fetch('/api/settings')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setSettings(settingsData)
        } else {
          throw new Error('Failed to fetch settings')
        }

        // Fetch banks for single bank mode
        const banksResponse = await fetch('/api/admin/banks')
        if (banksResponse.ok) {
          const banksData = await banksResponse.json()
          setBanks(banksData.banks || [])
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
        toast.success("Pengaturan berhasil disimpan!")
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error("Gagal menyimpan pengaturan")
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  // Reset settings
  const handleReset = useCallback(async () => {
    if (!settings) return

    try {
      setIsResetting(true)
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setHasChanges(false)
        setShowResetDialog(false)
        toast.success("Perubahan berhasil direset!")
      } else {
        throw new Error('Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error("Gagal mereset pengaturan")
    } finally {
      setIsResetting(false)
    }
  }, [settings])

  const handleCancelReset = () => {
    setShowResetDialog(false)
  }

  const handleConfirmReset = () => {
    setShowResetDialog(true)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        if (hasChanges && !isSaving) {
          handleSave()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges, isSaving, handleSave])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Memuat Pengaturan</h3>
            <p className="text-sm text-muted-foreground">
              Sedang mengambil data pengaturan aplikasi...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-red-900">Gagal Memuat Pengaturan</h3>
            <p className="text-sm text-red-700">
              Terjadi kesalahan saat memuat pengaturan aplikasi
            </p>
            <Button onClick={() => window.location.reload()} size="sm">
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Save/Reset Controls */}
      <Card className={`transition-all duration-300 ${hasChanges ? 'border-orange-200 bg-orange-50/50' : ''}`}>
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Settings2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Pengaturan Aplikasi</CardTitle>
                {hasChanges && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-1.5 animate-pulse" />
                    Ada Perubahan
                  </Badge>
                )}
              </div>
              <CardDescription>
                {hasChanges 
                  ? "Anda memiliki perubahan yang belum disimpan" 
                  : "Kelola pengaturan umum aplikasi"
                }
              </CardDescription>
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={isResetting || isSaving || !hasChanges}
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={handleConfirmReset}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md mx-4 sm:mx-0">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Konfirmasi Reset Perubahan
                    </DialogTitle>
                    <DialogDescription className="space-y-2 pt-2">
                      <p className="text-sm">
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
                  <DialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-2">
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
          
          {/* Last updated info */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Terakhir diupdate: {new Date(settings.updatedAt).toLocaleString('id-ID')}
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Maintenance Mode Warning */}
      {settings.isMaintenanceMode && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
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

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Pengaturan Umum
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Pembayaran
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Informasi Kontak
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">

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
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Contact Information - Moved to ContactInfo model */}
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
        <CardContent className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informasi Event
          </CardTitle>
          <CardDescription>
            Detail event PIT PERDAMI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Teks Footer
          </CardTitle>
          <CardDescription>
            Copyright dan teks yang ditampilkan di footer website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Pengaturan Sistem
          </CardTitle>
          <CardDescription>
            Mode maintenance dan status aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Mode Maintenance</Label>
              <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
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
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          {/* Single Bank Mode Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Mode Bank Tunggal
              </CardTitle>
              <CardDescription>
                Aktifkan mode bank tunggal untuk event singkat. Pelanggan akan langsung melihat rekening yang harus dituju tanpa perlu memilih.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Single Bank Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="singleBankMode" className="text-sm font-medium">
                    Aktifkan Mode Bank Tunggal
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Hanya tampilkan satu bank untuk transfer, cocok untuk event singkat
                  </p>
                </div>
                <Switch
                  id="singleBankMode"
                  checked={settings?.singleBankMode ?? false}
                  onCheckedChange={(checked: boolean) => handleChange('singleBankMode', checked)}
                />
              </div>

              {/* Default Bank Selection - Only show when single bank mode is enabled */}
              {settings?.singleBankMode && (
                <div className="space-y-3">
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Bank Default</Label>
                    <p className="text-sm text-muted-foreground">
                      Pilih bank yang akan ditampilkan kepada pelanggan untuk transfer
                    </p>
                    
                    {banks.length > 0 ? (
                      <div className="space-y-2">
                        {banks.map((bank) => (
                          <div
                            key={bank.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              settings?.defaultBankId === bank.id
                                ? 'border-primary bg-primary/5'
                                : 'border-input hover:bg-muted/50'
                            }`}
                            onClick={() => handleChange('defaultBankId', bank.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{bank.name}</span>
                                  <Badge variant="secondary">{bank.code}</Badge>
                                  {!bank.isActive && <Badge variant="destructive">Nonaktif</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {bank.accountName} - {bank.accountNumber}
                                </p>
                              </div>
                              {settings?.defaultBankId === bank.id && (
                                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          Belum ada bank yang tersedia. 
                          <Link href="/admin/banks" className="text-primary hover:underline ml-1">
                            Tambahkan bank terlebih dahulu
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info about single bank mode */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Tentang Mode Bank Tunggal
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Pelanggan langsung melihat rekening tujuan tanpa perlu memilih</li>
                      <li>• Cocok untuk event singkat dengan satu bank saja</li>
                      <li>• Mempercepat proses checkout</li>
                      <li>• Bank lain tetap bisa digunakan dari admin panel</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <ContactInfoManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}