'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, Store as StoreIcon, Clock } from 'lucide-react'
import type { StoreWithRelations, StoreFormData } from '../types/store.types'
import { StoreImageUpload } from './store-image-upload'

interface StoreFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store?: StoreWithRelations | null
  onSuccess?: () => void
}

export function StoreForm({
  open,
  onOpenChange,
  store,
  onSuccess
}: StoreFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    address: '',
    city: 'Bandung',
    province: 'Jawa Barat',
    isActive: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const isEditing = !!store

  // Reset form when modal opens/closes or store changes
  useEffect(() => {
    if (open) {
      if (store) {
        setFormData({
          name: store.name,
          description: store.description || '',
          image: store.image || '',
          address: store.address || '',
          city: store.city || 'Bandung',
          province: store.province || 'Jawa Barat',
          isActive: store.isActive
        })
      } else {
        setFormData({
          name: '',
          description: '',
          image: '',
          address: '',
          city: 'Bandung',
          province: 'Jawa Barat',
          isActive: true,
        })
      }
      setErrors({})
      setTouched({})
    }
  }, [open, store])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama toko wajib diisi'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama toko minimal 3 karakter'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const url = store ? `/api/admin/stores/${store.id}` : '/api/admin/stores'
      const method = store ? 'PUT' : 'POST'
      
      const submitData = {
        ...formData,
        description: formData.description || null,
        image: formData.image || null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        onSuccess?.()
        onOpenChange(false)
      } else {
        if (result.details) {
          // Handle validation errors from server
          const serverErrors: Record<string, string> = {}
          result.details.forEach((error: any) => {
            if (error.path && error.path.length > 0) {
              serverErrors[error.path[0]] = error.message
            }
          })
          setErrors(serverErrors)
        } else {
          toast.error(result.error)
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Terjadi kesalahan saat menyimpan data')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateForm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-4 pb-6 border-b bg-gradient-to-r from-background to-muted/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
              <StoreIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {isEditing ? 'Edit Toko' : 'Tambah Toko Baru'}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground leading-relaxed">
                {isEditing 
                  ? 'Perbarui informasi toko Anda dengan detail yang akurat untuk memberikan pengalaman terbaik kepada pelanggan.'
                  : 'Lengkapi informasi toko baru dengan detail yang menarik untuk memulai perjalanan bisnis Anda.'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
              {/* Left Column - Image */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/30">
                  <CardHeader className="pb-4 space-y-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <StoreIcon className="h-5 w-5 text-primary" />
                      </div>
                      Gambar Toko
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Upload gambar yang menarik untuk mewakili toko Anda
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="w-full aspect-square border-2 border-dashed border-primary/20 rounded-xl flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors duration-200">
                      <StoreImageUpload
                        value={formData.image}
                        onChange={(url) => updateFormData('image', url)}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                      <p className="text-sm text-muted-foreground text-center leading-relaxed">
                        💡 <strong>Tips:</strong> Gunakan gambar dengan resolusi tinggi (minimal 400x400px) 
                        untuk hasil terbaik. Format yang didukung: JPG, PNG, WebP.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Card */}
                <Card className="border-0 shadow-md bg-gradient-to-br from-background to-accent/5">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Clock className="h-5 w-5 text-accent-foreground" />
                      </div>
                      Preview Toko
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Lihat bagaimana toko Anda akan tampil
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 border-2 border-dashed border-accent/20 rounded-xl bg-accent/5">
                      <div className="flex items-start gap-4">
                        {formData.image ? (
                          <div className="relative">
                            <img 
                              src={formData.image} 
                              alt="Preview" 
                              className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-md"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-muted/50 rounded-xl flex items-center justify-center border-2 border-dashed border-muted">
                            <StoreIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <h4 className="font-bold text-lg truncate text-foreground">
                              {formData.name || 'Nama Toko'}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                              {formData.description || 'Deskripsi toko akan muncul di sini...'}
                            </p>
                            {(formData.address || formData.city) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                📍 {formData.address ? `${formData.address}, ` : ''}{formData.city || 'Kota'}, {formData.province || 'Provinsi'}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={formData.isActive ? 'default' : 'secondary'} 
                              className={`text-xs px-3 py-1 font-medium ${
                                formData.isActive 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {formData.isActive ? '🟢 Aktif' : '⚫ Nonaktif'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Store Data */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/30">
                  <CardHeader className="pb-6 space-y-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <StoreIcon className="h-5 w-5 text-primary" />
                      </div>
                      Informasi Toko
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Isi detail informasi toko dengan lengkap dan menarik
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-base font-semibold text-foreground flex items-center gap-2">
                        Nama Toko
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="name"
                          type="text"
                          placeholder="Masukkan nama toko yang menarik..."
                          className={`text-base h-12 px-4 rounded-xl border-2 transition-all duration-200 ${
                            errors.name && touched.name
                              ? 'border-red-300 focus-visible:border-red-500 bg-red-50'
                              : formData.name && !errors.name
                              ? 'border-green-300 focus-visible:border-green-500 bg-green-50'
                              : 'border-muted hover:border-primary/50 focus-visible:border-primary'
                          }`}
                          value={formData.name}
                          onChange={(e) => updateFormData('name', e.target.value)}
                          onBlur={() => handleBlur('name')}
                        />
                        {formData.name && !errors.name && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {errors.name && touched.name && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-red-500 text-sm">⚠️</span>
                          <p className="text-sm text-red-600 font-medium">{errors.name}</p>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Nama yang unik dan mudah diingat akan membantu pelanggan menemukan toko Anda
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-base font-semibold text-foreground">Deskripsi Toko</Label>
                      <Textarea 
                        id="description"
                        placeholder="Ceritakan tentang toko Anda, produk yang dijual, keunggulan, dan hal menarik lainnya yang ingin diketahui pelanggan..."
                        className="min-h-[140px] text-base resize-none rounded-xl border-2 border-muted hover:border-primary/50 focus-visible:border-primary transition-all duration-200 px-4 py-3"
                        value={formData.description}
                        onChange={(e) => updateFormData('description', e.target.value)}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Deskripsi yang menarik akan membantu pelanggan memahami toko Anda
                        </p>
                        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          {formData.description.length}/500
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="address" className="text-base font-semibold text-foreground">Alamat Toko</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Masukkan alamat lengkap toko..."
                        className="text-base h-12 px-4 rounded-xl border-2 border-muted hover:border-primary/50 focus-visible:border-primary transition-all duration-200"
                        value={formData.address}
                        onChange={(e) => updateFormData('address', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Alamat lengkap akan membantu pelanggan menemukan lokasi toko Anda
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="city" className="text-base font-semibold text-foreground">Kota</Label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="Kota..."
                          className="text-base h-12 px-4 rounded-xl border-2 border-muted hover:border-primary/50 focus-visible:border-primary transition-all duration-200"
                          value={formData.city}
                          onChange={(e) => updateFormData('city', e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="province" className="text-base font-semibold text-foreground">Provinsi</Label>
                        <Input
                          id="province"
                          type="text"
                          placeholder="Provinsi..."
                          className="text-base h-12 px-4 rounded-xl border-2 border-muted hover:border-primary/50 focus-visible:border-primary transition-all duration-200"
                          value={formData.province}
                          onChange={(e) => updateFormData('province', e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <Label htmlFor="isActive" className="text-base font-semibold text-foreground">
                        Status Toko
                      </Label>
                      <div className="flex items-center justify-between p-6 border-2 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/40 hover:to-muted/20 transition-all duration-200">
                        <div className="space-y-2">
                          <div className="font-bold text-base text-foreground">
                            Publikasi Toko
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {formData.isActive 
                              ? 'Toko Anda saat ini aktif dan dapat dilihat oleh semua pelanggan' 
                              : 'Toko Anda saat ini tidak aktif dan tidak akan ditampilkan kepada pelanggan'
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant={formData.isActive ? 'default' : 'secondary'} 
                            className={`text-sm px-4 py-2 font-semibold transition-all duration-200 ${
                              formData.isActive 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            {formData.isActive ? '🟢 Aktif' : '⚫ Nonaktif'}
                          </Badge>
                          <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => updateFormData('isActive', checked)}
                            className="data-[state=checked]:bg-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="gap-4 pt-8 mt-8 border-t-2 border-muted/50 bg-gradient-to-r from-background to-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-12 px-8 text-base font-semibold border-2 hover:bg-muted/50 transition-all duration-200 rounded-xl"
          >
            ✕ Batal
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
          >
            {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : (
              <>
                {isEditing ? '💾 Perbarui' : '💾 Simpan'} Toko
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
