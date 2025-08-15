'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ProductBundle } from '@prisma/client'
import { BundleImageUpload } from './bundle-image-upload'
import { BundleItemsManager } from './bundle-items-manager'
import type { BundleContentItemWithId, BundleFormData } from '../types/bundle.types'

interface Store {
  id: string
  name: string
  description?: string | null
}

interface BundleFormPageNewProps {
  mode?: 'create' | 'edit'
  bundleId?: string
  initialData?: ProductBundle
}

export function BundleFormPageNew({ mode = 'create', bundleId, initialData }: BundleFormPageNewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [bundle, setBundle] = useState<ProductBundle | null>(initialData || null)
  const [stores, setStores] = useState<Store[]>([])
  const [formData, setFormData] = useState<BundleFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    storeId: initialData?.storeId || '',
    image: initialData?.image || '',
    contents: initialData?.contents ? 
      (initialData.contents as any[]).map((item, index) => ({
        ...item,
        id: `item-${index}`
      })) : [],
    isActive: initialData?.isActive || true,
    isFeatured: initialData?.isFeatured || false,
    showToCustomer: initialData?.showToCustomer || true,
  })

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      setIsLoadingStores(true)
      try {
        const response = await fetch('/api/admin/stores')
        if (response.ok) {
          const data = await response.json()
          setStores(data.stores || data)
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
        toast.error('Gagal mengambil data toko')
      } finally {
        setIsLoadingStores(false)
      }
    }

    fetchStores()
  }, [])

  // Fetch bundle data if in edit mode and no initial data provided
  useEffect(() => {
    const fetchBundle = async () => {
      if (mode === 'edit' && bundleId && !initialData) {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/admin/bundles/${bundleId}`)
          if (response.ok) {
            const bundleData = await response.json()
            setBundle(bundleData)
            setFormData({
              name: bundleData.name || '',
              description: bundleData.description || '',
              price: bundleData.price || 0,
              storeId: bundleData.storeId || '',
              image: bundleData.image || '',
              contents: bundleData.contents ? 
                bundleData.contents.map((item: any, index: number) => ({
                  ...item,
                  id: `item-${index}`
                })) : [],
              isActive: bundleData.isActive || true,
              isFeatured: bundleData.isFeatured || false,
              showToCustomer: bundleData.showToCustomer || true,
            })
          } else {
            toast.error('Gagal mengambil data bundle')
            router.push('/admin/bundles')
          }
        } catch (error) {
          console.error('Error fetching bundle:', error)
          toast.error('Gagal mengambil data bundle')
          router.push('/admin/bundles')
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchBundle()
  }, [mode, bundleId, initialData, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Nama bundle harus diisi')
      return
    }
    
    if (!formData.storeId) {
      toast.error('Toko harus dipilih')
      return
    }
    
    if (formData.price <= 0) {
      toast.error('Harga harus lebih dari 0')
      return
    }

    setIsLoading(true)

    try {
      const url = mode === 'edit' && bundleId 
        ? `/api/admin/bundles/${bundleId}`
        : '/api/admin/bundles'
      
      const method = mode === 'edit' ? 'PUT' : 'POST'

      // Prepare data to send
      const submitData = {
        ...formData,
        contents: formData.contents?.map(({ id, ...item }) => item) || [], // Remove id from contents
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save bundle')
      }

      toast.success(mode === 'edit' ? 'Bundle berhasil diperbarui' : 'Bundle berhasil dibuat')
      router.push('/admin/bundles')
    } catch (error) {
      console.error('Error saving bundle:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan bundle')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof BundleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleItemsChange = (items: BundleContentItemWithId[]) => {
    setFormData(prev => ({
      ...prev,
      contents: items,
    }))
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'edit' ? 'Edit Bundle' : 'Tambah Bundle Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode === 'edit' && bundleId && !bundle && isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Memuat data bundle...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Informasi Dasar</h3>
                  <p className="text-sm text-muted-foreground">
                    Atur informasi dasar bundle produk
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Bundle *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Masukkan nama bundle"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Harga *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                      placeholder="Masukkan harga"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeId">Toko *</Label>
                    <Select
                      value={formData.storeId}
                      onValueChange={(value) => handleInputChange('storeId', value)}
                      disabled={isLoadingStores}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingStores ? "Memuat..." : "Pilih toko"} />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Masukkan deskripsi bundle"
                    rows={4}
                  />
                </div>
              </div>

              <Separator />

              {/* Image Upload */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Gambar Bundle</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload gambar untuk bundle produk
                  </p>
                </div>
                
                <BundleImageUpload
                  value={formData.image}
                  onChange={(url) => handleInputChange('image', url)}
                />
              </div>

              <Separator />

              {/* Bundle Contents */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Isi Bundle</h3>
                  <p className="text-sm text-muted-foreground">
                    Atur item-item yang termasuk dalam bundle ini
                  </p>
                </div>
                
                <BundleItemsManager
                  items={formData.contents || []}
                  onItemsChange={handleItemsChange}
                />
              </div>

              <Separator />

              {/* Settings */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Pengaturan</h3>
                  <p className="text-sm text-muted-foreground">
                    Konfigurasi visibilitas dan status bundle
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">Aktif</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                    />
                    <Label htmlFor="isFeatured">Unggulan</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showToCustomer"
                      checked={formData.showToCustomer}
                      onCheckedChange={(checked) => handleInputChange('showToCustomer', checked)}
                    />
                    <Label htmlFor="showToCustomer">Tampilkan ke Pelanggan</Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/bundles')}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : (mode === 'edit' ? 'Perbarui Bundle' : 'Simpan Bundle')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}