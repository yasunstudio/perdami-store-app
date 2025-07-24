'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, Store as StoreIcon, ArrowLeft, Save } from 'lucide-react'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import type { StoreWithRelations, StoreFormData } from '../types/store.types'
import { StoreImageUpload } from './store-image-upload'

interface StoreFormPageProps {
  mode: 'create' | 'edit'
  storeId?: string
}

export function StoreFormPage({ mode, storeId }: StoreFormPageProps) {
  const router = useRouter()
  const [store, setStore] = useState<StoreWithRelations | null>(null)
  const [loading, setLoading] = useState(mode === 'edit')
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

  const isEditing = mode === 'edit'

  // Fetch store data for edit mode
  useEffect(() => {
    if (isEditing && storeId) {
      fetchStore()
    }
  }, [isEditing, storeId])

  const fetchStore = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${storeId}`)
      if (response.ok) {
        const storeData = await response.json()
        setStore(storeData)
        setFormData({
          name: storeData.name,
          description: storeData.description || '',
          image: storeData.image || '',
          address: storeData.address || '',
          city: storeData.city || 'Bandung',
          province: storeData.province || 'Jawa Barat',
          isActive: storeData.isActive
        })
      } else {
        toast.error('Gagal memuat data toko')
        router.push('/admin/stores')
      }
    } catch (error) {
      console.error('Error fetching store:', error)
      toast.error('Terjadi kesalahan saat memuat data')
      router.push('/admin/stores')
    } finally {
      setLoading(false)
    }
  }

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
      const url = isEditing ? `/api/admin/stores/${storeId}` : '/api/admin/stores'
      const method = isEditing ? 'PUT' : 'POST'
      
      const submitData = {
        ...formData,
        description: formData.description || null,
        image: formData.image || null,
        address: formData.address || null,
        city: formData.city || null,
        province: formData.province || null
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
        router.push('/admin/stores')
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

  if (loading) {
    return (
      <AdminPageLayout 
        title={isEditing ? 'Edit Toko' : 'Tambah Toko Baru'}
        description={isEditing 
          ? 'Perbarui informasi toko dengan detail yang akurat'
          : 'Lengkapi informasi toko baru untuk memulai'
        }
        showBackButton={true}
        backUrl="/admin/stores"
        loading={true}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Memuat data toko...</span>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout 
      title={isEditing ? 'Edit Toko' : 'Tambah Toko Baru'}
      description={isEditing 
        ? 'Perbarui informasi toko dengan detail yang akurat'
        : 'Lengkapi informasi toko baru untuk memulai'
      }
      showBackButton={true}
      backUrl="/admin/stores"
    >

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image Upload */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gambar Toko</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload gambar yang menarik untuk mewakili toko
                </p>
              </CardHeader>
              <CardContent>
                <div className="aspect-square">
                  <StoreImageUpload
                    value={formData.image}
                    onChange={(url) => updateFormData('image', url)}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form Fields */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Toko</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Isi detail informasi toko dengan lengkap
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Store Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nama Toko <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Masukkan nama toko"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={errors.name && touched.name ? 'border-red-500' : ''}
                  />
                  {errors.name && touched.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Deskripsi Toko
                  </Label>
                  <Textarea 
                    id="description"
                    placeholder="Ceritakan tentang toko Anda..."
                    className="min-h-[120px] resize-none"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/500 karakter
                  </p>
                </div>

                {/* Location Fields */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Informasi Lokasi</Label>
                  
                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Alamat
                    </Label>
                    <Textarea 
                      id="address"
                      placeholder="Masukkan alamat lengkap toko..."
                      className="min-h-[80px] resize-none"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                    />
                  </div>

                  {/* City and Province */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">
                        Kota
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Masukkan kota"
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province" className="text-sm font-medium">
                        Provinsi
                      </Label>
                      <Input
                        id="province"
                        type="text"
                        placeholder="Masukkan provinsi"
                        value={formData.province}
                        onChange={(e) => updateFormData('province', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Store Status */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Status Toko</Label>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">Publikasi Toko</div>
                      <p className="text-sm text-muted-foreground">
                        {formData.isActive 
                          ? 'Toko aktif dan dapat dilihat pelanggan' 
                          : 'Toko tidak aktif dan tidak ditampilkan'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                        {formData.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => updateFormData('isActive', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 sm:gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/stores')}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="min-w-[120px]"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Perbarui' : 'Simpan'}
              </>
            )}
          </Button>
        </div>
      </form>
    </AdminPageLayout>
  )
}