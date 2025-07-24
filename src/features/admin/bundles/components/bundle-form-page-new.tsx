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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Package2, ArrowLeft, Save, Settings } from 'lucide-react'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { formatPrice } from '@/lib/utils'
import type { ProductBundleWithRelations, BundleFormData, BundleContentItem, BundleContentItemWithId } from '../types/bundle.types'
import { BundleImageUpload } from './bundle-image-upload'
import { BundleItemsManager } from './bundle-items-manager'

interface BundleFormPageProps {
  mode: 'create' | 'edit'
  bundleId?: string
}

interface StoreOption {
  id: string
  name: string
}

interface CategoryOption {
  id: string
  name: string
  storeId: string
  storeName: string
}

export function BundleFormPageNew({ mode, bundleId }: BundleFormPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState<BundleFormData>({
    name: '',
    description: '',
    price: 0,
    storeId: '',
    image: '',
    contents: [],
    isActive: true,
    isFeatured: false,
    showToCustomer: false
  })

  // Options
  const [stores, setStores] = useState<StoreOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  
  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load bundle data for edit mode
  useEffect(() => {
    if (mode === 'edit' && bundleId) {
      loadBundleData()
    }
  }, [mode, bundleId])

  // Load options
  useEffect(() => {
    loadOptions()
  }, [])

  const loadBundleData = async () => {
    try {
      console.log('Loading bundle data for ID:', bundleId)
      const response = await fetch(`/api/admin/bundles/${bundleId}`, {
        credentials: 'include'
      })
      
      console.log('Bundle API response status:', response.status)
      
      if (!response.ok) {
        console.error('Bundle API error:', response.status, response.statusText)
        if (response.status === 404) {
          setError('Paket produk tidak ditemukan')
          toast.error('Paket produk tidak ditemukan')
        } else if (response.status === 401) {
          setError('Akses tidak diizinkan')
          toast.error('Akses tidak diizinkan')
        } else {
          setError('Gagal memuat data paket produk')
          toast.error('Gagal memuat data paket produk')
        }
        // Don't redirect immediately, show error state
        return
      }

      const data = await response.json()
      console.log('Bundle API response data:', data)

      if (data.bundle) {
        const bundle = data.bundle as ProductBundleWithRelations
        const storeId = bundle.store.id
        
        console.log('Bundle loaded successfully:', {
          bundleName: bundle.name,
          storeId,
          storeName: bundle.store.name,
          contentsCount: bundle.contents?.length || 0
        })
        
        // Set form data
        setFormData({
          name: bundle.name,
          description: bundle.description || '',
          price: bundle.price,
          storeId: bundle.storeId,
          image: bundle.image || '',
          contents: Array.isArray(bundle.contents) 
            ? bundle.contents.map((item, index) => ({
                ...item,
                id: `item-${index}-${Date.now()}`
              }))
            : [],
          isActive: bundle.isActive,
          isFeatured: bundle.isFeatured,
          showToCustomer: bundle.showToCustomer || false
        })
        
        // Set store ID
        setSelectedStoreId(storeId)
      } else {
        console.error('No bundle data in response:', data)
        setError('Data paket produk tidak valid')
        toast.error('Data paket produk tidak valid')
        // Don't redirect immediately, show error state
      }
    } catch (error) {
      console.error('Error loading bundle:', error)
      setError('Terjadi kesalahan saat memuat data')
      toast.error('Terjadi kesalahan saat memuat data')
      // Don't redirect immediately, show error state
    } finally {
      setLoading(false)
    }
  }

  const loadOptions = async () => {
    try {
      const [storesRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/stores', { credentials: 'include' }),
        fetch('/api/admin/categories', { credentials: 'include' })
      ])

      if (storesRes.ok) {
        const storesData = await storesRes.json()
        setStores(storesData.stores || [])
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        const categoriesWithStore = categoriesData.categories?.map((cat: any) => ({
          ...cat,
          storeName: cat.store?.name || 'Unknown Store'
        })) || []
        setCategories(categoriesWithStore)
      }
    } catch (error) {
      console.error('Error loading options:', error)
      toast.error('Gagal memuat data opsi')
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama paket harus diisi'
    }

    if (!formData.storeId) {
      newErrors.storeId = 'Toko harus dipilih'
    }

    if (formData.price <= 0) {
      newErrors.price = 'Harga harus lebih dari 0'
    }

    if (!formData.contents || formData.contents.length === 0) {
      newErrors.contents = 'Minimal harus ada 1 item dalam paket'
    }

    // Validate contents
    formData.contents?.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors[`contents.${index}.name`] = 'Nama item harus diisi'
      }
      if (item.quantity <= 0) {
        newErrors[`contents.${index}.quantity`] = 'Kuantitas harus lebih dari 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Mohon perbaiki kesalahan pada form')
      return
    }

    setSaving(true)
    try {
      console.log('Submitting bundle data:', {
        mode,
        bundleId,
        contentsCount: formData.contents?.length
      })

      const url = mode === 'create' 
        ? '/api/admin/bundles'
        : `/api/admin/bundles/${bundleId}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      // Prepare data for API - remove IDs from contents
      const submitData = {
        ...formData,
        contents: formData.contents 
          ? formData.contents.map(item => {
              const { id, ...itemWithoutId } = item
              return itemWithoutId
            })
          : []
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(mode === 'create' ? 'Paket produk berhasil dibuat' : 'Paket produk berhasil diperbarui')
        router.push('/admin/bundles')
      } else {
        console.error('API error:', data)
        toast.error(data.message || 'Terjadi kesalahan saat menyimpan data')
      }
    } catch (error) {
      console.error('Error saving bundle:', error)
      toast.error('Terjadi kesalahan saat menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Memuat Data">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Memuat data paket produk...</span>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  if (error) {
    return (
      <AdminPageLayout title="Error">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-center">
            <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {error}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Terjadi masalah saat memuat data paket produk
            </p>
            <div className="space-x-2">
              <Button onClick={() => router.push('/admin/bundles')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Daftar Paket
              </Button>
              <Button onClick={() => {
                setError(null)
                setLoading(true)
                if (mode === 'edit' && bundleId) {
                  loadBundleData()
                }
              }}>
                Coba Lagi
              </Button>
            </div>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  const filteredCategories = selectedStoreId
    ? categories.filter(cat => cat.storeId === selectedStoreId)
    : categories

  return (
    <AdminPageLayout 
      title={mode === 'create' ? 'Tambah Paket Produk' : 'Edit Paket Produk'}
      description={mode === 'create' 
        ? 'Buat paket produk baru dengan item yang telah Anda tentukan' 
        : 'Perbarui informasi paket produk dengan detail yang akurat'
      }
      showBackButton={true}
      backUrl="/admin/bundles"
    >

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">{/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bundle Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nama Paket <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                      if (errors.name) {
                        setErrors(prev => ({ ...prev, name: '' }))
                      }
                    }}
                    placeholder="Masukkan nama paket produk"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Deskripsi Paket
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ceritakan tentang paket produk ini..."
                    className="min-h-[120px] resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.description || '').length}/500 karakter
                  </p>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">
                    Harga Paket <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                      if (errors.price) {
                        setErrors(prev => ({ ...prev, price: '' }))
                      }
                    }}
                    placeholder="0"
                    className={errors.price ? 'border-red-500' : ''}
                  />
                  {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Bundle Contents */}
            <BundleItemsManager
              items={formData.contents || []}
              onItemsChange={(items: BundleContentItemWithId[]) => {
                setFormData(prev => ({ ...prev, contents: items }))
              }}
              errors={errors}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Store Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Toko</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pilih toko yang akan menjual paket produk ini
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Pilih Toko <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.storeId} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, storeId: value }))
                      if (errors.storeId) {
                        setErrors(prev => ({ ...prev, storeId: '' }))
                      }
                    }}
                  >
                    <SelectTrigger className={`w-full ${errors.storeId ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Pilih toko" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.storeId && <p className="text-sm text-red-600">{errors.storeId}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Bundle Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gambar Paket</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload gambar yang menarik untuk mewakili paket produk
                </p>
              </CardHeader>
              <CardContent>
                <div className="aspect-square">
                  <BundleImageUpload
                    value={formData.image || ''}
                    onChange={(imageUrl) => setFormData(prev => ({ ...prev, image: imageUrl }))}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Pengaturan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Status Aktif</Label>
                    <p className="text-sm text-muted-foreground">
                      Paket dapat dilihat di toko
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Unggulan</Label>
                    <p className="text-sm text-muted-foreground">
                      Tampilkan di halaman utama
                    </p>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Tampilkan ke Pelanggan</Label>
                    <p className="text-sm text-muted-foreground">
                      Pelanggan dapat melihat paket ini
                    </p>
                  </div>
                  <Switch
                    checked={formData.showToCustomer}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showToCustomer: checked }))}
                  />
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
            onClick={() => router.push('/admin/bundles')}
            disabled={saving}
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Menyimpan...' : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === 'edit' ? 'Perbarui' : 'Simpan'}
              </>
            )}
          </Button>
        </div>
      </form>
    </AdminPageLayout>
  )
}
